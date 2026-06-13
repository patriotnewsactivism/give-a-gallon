// Give a Gallon — Stripe integration (live)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

const GALLON_PRICE_CENTS = 425; // $4.25

// Create a Stripe Checkout Session
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

    // Create a pending donation first
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

    // Create Stripe Checkout Session via API
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append(
      "success_url",
      `${siteUrl}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
    );
    params.append("cancel_url", `${siteUrl}/donation-cancel`);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append(
      "line_items[0][price_data][unit_amount]",
      String(amountCents),
    );
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

    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Stripe error:", error);
      throw new Error("Failed to create checkout session");
    }

    const session = await response.json();

    // Update donation with Stripe session ID
    await ctx.runMutation(internal.stripe.setStripeSessionId, {
      donationId,
      stripeSessionId: session.id,
    });

    return { url: session.url, sessionId: session.id };
  },
});

// Internal: create a pending donation record
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
    const platformFeeCents = Math.round(args.amountCents * 0.05);
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

// Internal: store stripe session ID on donation
export const setStripeSessionId = internalMutation({
  args: {
    donationId: v.id("donations"),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, { donationId, stripeSessionId }) => {
    await ctx.db.patch(donationId, { stripeSessionId });
  },
});

// Internal: mark donation as completed after payment
export const completeDonation = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, { stripeSessionId }) => {
    // Look up the donation directly via the by_stripeSession index
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

    if (donation.status === "completed") {
      return; // Already processed (idempotent)
    }

    // Mark completed
    await ctx.db.patch(donation._id, { status: "completed" });

    // Update creator totals
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

// How far a webhook timestamp may drift from now before we reject it (replay protection).
const WEBHOOK_TOLERANCE_SECONDS = 300;

// Constant-time comparison of two equal-length hex strings to avoid timing attacks.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Verify a Stripe webhook signature using Stripe's scheme: HMAC-SHA256 over
// `${timestamp}.${payload}`, with a timestamp tolerance and constant-time compare.
async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<void> {
  if (!signatureHeader) {
    throw new Error("Missing Stripe signature header");
  }

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const element of signatureHeader.split(",")) {
    const [key, value] = element.split("=");
    const trimmedKey = key?.trim();
    if (trimmedKey === "t") {
      timestamp = value?.trim();
    } else if (trimmedKey === "v1" && value) {
      v1Signatures.push(value.trim());
    }
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid Stripe signature header");
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    throw new Error("Invalid Stripe signature timestamp");
  }
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

  const isValid = v1Signatures.some(candidate =>
    constantTimeEqual(candidate, expectedSig),
  );
  if (!isValid) {
    throw new Error("Stripe signature verification failed");
  }
}

// Stripe webhook handler (called from http.ts)
export const handleWebhook = action({
  args: { payload: v.string(), signature: v.string() },
  handler: async (ctx, { payload, signature }) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // Fail closed: never trust an unverified webhook that moves money.
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret is not configured");
    }

    await verifyStripeSignature(payload, signature, webhookSecret);

    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        await ctx.runMutation(internal.stripe.completeDonation, {
          stripeSessionId: session.id,
        });
      }
    }

    return { received: true };
  },
});
