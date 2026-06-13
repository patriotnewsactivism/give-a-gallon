// Give a Gallon — Stripe integration (Connect-aware)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

const GALLON_PRICE_CENTS = 425; // $4.25
const PLATFORM_FEE_PCT = 0.05;  // 5%

// ── Checkout ───────────────────────────────────────────────────────────────

export const createCheckoutSession = action({
  args: {
    creatorId: v.id("creators"),
    gallons: v.number(),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    if (args.gallons < 1 || args.gallons > 1000) {
      throw new Error("Gallons must be between 1 and 1000");
    }

    const amountCents = Math.round(args.gallons * GALLON_PRICE_CENTS);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PCT);

    // Fetch creator to check if they have a Connect account
    const creator = await ctx.runQuery(internal.stripe.getCreatorById, {
      creatorId: args.creatorId,
    });

    const donationId = await ctx.runMutation(
      internal.stripe.createPendingDonation,
      {
        creatorId: args.creatorId,
        gallons: args.gallons,
        amountCents,
        donorName: args.donorName,
        donorEmail: args.donorEmail,
        message: args.message,
        isAnonymous: args.isAnonymous,
      },
    );

    const siteUrl = process.env.SITE_URL || "https://give-a-gallon.vercel.app";

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append(
      "success_url",
      `${siteUrl}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
    );
    params.append("cancel_url", `${siteUrl}/donation-cancel`);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(amountCents));
    params.append(
      "line_items[0][price_data][product_data][name]",
      `${args.gallons} Gallon${args.gallons > 1 ? "s" : ""} of Fuel`,
    );
    params.append(
      "line_items[0][price_data][product_data][description]",
      "Give a Gallon — fuel an activist's fight",
    );
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[donationId]", donationId);
    params.append("metadata[creatorId]", args.creatorId);
    params.append("metadata[gallons]", String(args.gallons));
    if (args.donorEmail) {
      params.append("customer_email", args.donorEmail);
    }

    // If the creator has a verified Connect account, route the payment through
    // them and collect our platform fee as an application_fee_amount.
    if (creator?.stripeAccountId && creator?.stripeAccountStatus === "active") {
      params.append("payment_intent_data[application_fee_amount]", String(platformFeeCents));
      params.append("payment_intent_data[transfer_data][destination]", creator.stripeAccountId);
      params.append("metadata[connectedAccountId]", creator.stripeAccountId);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Stripe error:", error);
      throw new Error("Failed to create checkout session");
    }

    const session = await response.json();

    await ctx.runMutation(internal.stripe.setStripeSessionId, {
      donationId,
      stripeSessionId: session.id,
    });

    return { url: session.url, sessionId: session.id };
  },
});

// ── Internal queries / mutations ───────────────────────────────────────────

export const getCreatorById = internalMutation({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    return ctx.db.get(creatorId);
  },
});

export const createPendingDonation = internalMutation({
  args: {
    creatorId: v.id("creators"),
    gallons: v.number(),
    amountCents: v.number(),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    const platformFeeCents = Math.round(args.amountCents * PLATFORM_FEE_PCT);
    return await ctx.db.insert("donations", {
      creatorId: args.creatorId,
      gallons: args.gallons,
      amountCents: args.amountCents,
      platformFeeCents,
      donorName: args.donorName,
      donorEmail: args.donorEmail,
      message: args.message,
      isAnonymous: args.isAnonymous,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const setStripeSessionId = internalMutation({
  args: {
    donationId: v.id("donations"),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, { donationId, stripeSessionId }) => {
    await ctx.db.patch(donationId, { stripeSessionId });
  },
});

export const completeDonation = internalMutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, { stripeSessionId, stripePaymentIntentId }) => {
    const donation = await ctx.db
      .query("donations")
      .withIndex("by_stripeSession", q =>
        q.eq("stripeSessionId", stripeSessionId),
      )
      .unique();

    if (!donation) {
      console.error("No donation found for session:", stripeSessionId);
      return;
    }
    if (donation.status === "completed") return;

    await ctx.db.patch(donation._id, {
      status: "completed",
      ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
    });

    const creator = await ctx.db.get(donation.creatorId);
    if (creator) {
      await ctx.db.patch(creator._id, {
        totalGallons: creator.totalGallons + donation.gallons,
        totalDonations: creator.totalDonations + 1,
        totalAmountCents: creator.totalAmountCents + donation.amountCents,
      });
    }
  },
});

// ── Webhook ────────────────────────────────────────────────────────────────

const WEBHOOK_TOLERANCE_SECONDS = 300;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<void> {
  if (!signatureHeader) throw new Error("Missing Stripe signature header");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const element of signatureHeader.split(",")) {
    const [key, value] = element.split("=");
    const trimmedKey = key?.trim();
    if (trimmedKey === "t") timestamp = value?.trim();
    else if (trimmedKey === "v1" && value) v1Signatures.push(value.trim());
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid Stripe signature header");
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) throw new Error("Invalid timestamp");

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error("Stripe signature timestamp outside tolerance");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expectedSig = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const isValid = v1Signatures.some(c => constantTimeEqual(c, expectedSig));
  if (!isValid) throw new Error("Stripe signature verification failed");
}

export const handleWebhook = action({
  args: { payload: v.string(), signature: v.string() },
  handler: async (ctx, { payload, signature }) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("Stripe webhook secret not configured");

    await verifyStripeSignature(payload, signature, webhookSecret);

    const event = JSON.parse(payload);

    // ── Payment completed → mark donation done ──
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        await ctx.runMutation(internal.stripe.completeDonation, {
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent ?? undefined,
        });
      }
    }

    // ── Connect account updated → sync KYC status ──
    if (event.type === "account.updated") {
      const account = event.data.object;
      const chargesEnabled: boolean = account.charges_enabled;
      const payoutsEnabled: boolean = account.payouts_enabled;
      const disabled: boolean =
        account.requirements?.disabled_reason != null;

      let status: "pending" | "active" | "restricted";
      if (chargesEnabled && payoutsEnabled) {
        status = "active";
      } else if (disabled) {
        status = "restricted";
      } else {
        status = "pending";
      }

      await ctx.runMutation(internal.connect.setAccountStatus, {
        stripeAccountId: account.id,
        stripeAccountStatus: status,
      });
    }

    return { received: true };
  },
});
