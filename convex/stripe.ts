// Give a Gallon — Stripe integration (Connect-aware)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";

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
    referralCode: v.optional(v.string()),
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
        referralCode: args.referralCode,
      },
    );

    const siteUrl = process.env.SITE_URL || "https://giveagallon.org";

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
    if (args.referralCode) {
      params.append("metadata[referralCode]", args.referralCode);
    }
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

export const getCreatorById = internalQuery({
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
    referralCode: v.optional(v.string()),
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
      referralCode: args.referralCode,
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

    // Update global platform stats so hero + /impact dashboard stay current
    const stats = await ctx.db
      .query("platformStats")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();
    if (stats) {
      await ctx.db.patch(stats._id, {
        totalDonationsCents: stats.totalDonationsCents + donation.amountCents,
        totalGallons: stats.totalGallons + donation.gallons,
        totalDonors: stats.totalDonors + 1,
        updatedAt: Date.now(),
      });
    } else {
      // First donation ever — create the stats record
      await ctx.db.insert("platformStats", {
        key: "global",
        totalDonationsCents: donation.amountCents,
        totalGallons: donation.gallons,
        totalDonors: 1,
        totalCreators: 1,
        totalCampaigns: 1,
        successfulCampaigns: 1,
        updatedAt: Date.now(),
      });
    }

    // Credit the referrer if this donation came via a referral link
    if (donation.referralCode) {
      await ctx.runMutation(internal.referrals.creditReferral, {
        referralCode: donation.referralCode,
        gallons: donation.gallons,
        donationId: donation._id,
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


    // ── Subscription created/updated ──
    if (event.type === "checkout.session.completed" && event.data.object.mode === "subscription") {
      const session = event.data.object;
      const meta = session.metadata ?? {};
      const userId = meta.userId;
      const tierId = meta.tierId;
      const tierName = meta.tierName;
      const gallonsPerMonth = Number(meta.gallonsPerMonth ?? 0);
      const donorName = meta.donorName || undefined;

      if (userId && tierId) {
        const subId = session.subscription;
        // Fetch the subscription from Stripe to get period end
        const stripeKey = process.env.STRIPE_SECRET_KEY!;
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const sub = await subRes.json();

        await ctx.runMutation(internal.subscriptions.createSubscriptionRecord, {
          userId: userId as any,
          donorEmail: session.customer_details?.email ?? "",
          donorName,
          tierId,
          tierName,
          amountCents: sub.plan?.amount ?? 0,
          gallonsPerMonth,
          stripeSubscriptionId: subId,
          stripeCustomerId: session.customer,
          stripePriceId: sub.plan?.id,
          currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : undefined,
        });

        // Send confirmation email — wrapped so failure never breaks webhook
        try {
          if (session.customer_details?.email) {
            await ctx.runAction(internal.emails.sendSubscriptionConfirmed, {
              donorEmail: session.customer_details.email,
              donorName: donorName ?? "there",
              tierName,
              gallonsPerMonth,
              amountCents: sub.plan?.amount ?? 0,
              currentPeriodEndMs: sub.current_period_end ? sub.current_period_end * 1000 : Date.now() + 30 * 86400 * 1000,
            });
          }
        } catch (emailErr) {
          console.error("Subscription confirmation email failed (non-fatal):", emailErr);
        }
      }
    }

    // ── Subscription status changes ──
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object;

      let status: "active" | "canceled" | "past_due" | "paused" = "active";
      if (sub.status === "canceled" || event.type === "customer.subscription.deleted") status = "canceled";
      else if (sub.status === "past_due") status = "past_due";
      else if (sub.status === "paused") status = "paused";

      await ctx.runMutation(internal.subscriptions.updateSubStatus, {
        stripeSubscriptionId: sub.id,
        status,
        currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : undefined,
      });
    }

    // ── One-time donation emails ──
    if (event.type === "checkout.session.completed" && event.data.object.mode === "payment") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        // Find the donation and creator to send emails
        const donation = await ctx.runQuery(internal.stripe.getDonationBySession, {
          stripeSessionId: session.id,
        });
        if (donation) {
          const creator = await ctx.runQuery(internal.stripe.getCreatorByDonationId, {
            creatorId: donation.creatorId,
          });
          if (creator) {
            // Email to creator — wrapped so failure never breaks the webhook
            try {
              const creatorUser = await ctx.runQuery(internal.stripe.getUserById, { userId: creator.userId });
              if (creatorUser?.email) {
                await ctx.runAction(internal.emails.sendDonationReceived, {
                  creatorEmail: creatorUser.email,
                  creatorName: creator.displayName,
                  creatorSlug: creator.slug,
                  donorName: donation.isAnonymous ? "Anonymous" : (donation.donorName ?? "Someone"),
                  gallons: donation.gallons,
                  amountCents: donation.amountCents - donation.platformFeeCents,
                  message: donation.message,
                });
              }
            } catch (emailErr) {
              console.error("Creator email failed (non-fatal):", emailErr);
            }
            // Confirmation to donor — wrapped too
            try {
              if (donation.donorEmail && !donation.isAnonymous) {
                await ctx.runAction(internal.emails.sendDonationConfirmation, {
                  donorEmail: donation.donorEmail,
                  donorName: donation.donorName ?? "Supporter",
                  gallons: donation.gallons,
                  amountCents: donation.amountCents,
                  creatorName: creator.displayName,
                  creatorSlug: creator.slug,
                });
              }
            } catch (emailErr) {
              console.error("Donor confirmation email failed (non-fatal):", emailErr);
            }
          }
        }
      }
    }

    return { received: true };
  },
});

// ── Internal helpers for webhook email dispatch ────────────────────────────────

export const getDonationBySession = internalQuery({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, { stripeSessionId }) => {
    return ctx.db
      .query("donations")
      .withIndex("by_stripeSession", q => q.eq("stripeSessionId", stripeSessionId))
      .first();
  },
});

export const getCreatorByDonationId = internalQuery({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    return ctx.db.get(creatorId);
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});
