// Give a Gallon — PayPal integration (alternative to Stripe).
//
// Flow (central-account model): donations are captured into the platform
// PayPal business account; creators are paid out separately via PayPal Payouts.
//
//   createOrder ──▶ redirect donor to PayPal approve URL
//        │
//   donor approves, returns to /donation-success?provider=paypal&token=ORDER_ID
//        │
//   captureOrder ──▶ capture funds, mark donation completed, email both sides
//
// A /paypal-webhook route (PAYMENT.CAPTURE.COMPLETED) is wired as a backup so
// the donation still completes if the donor closes the tab before the return.
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

const GALLON_PRICE_CENTS = 425; // $4.25
const PLATFORM_FEE_PCT = 0.05; // 5%

// Live vs sandbox is chosen by PAYPAL_ENV ("live" | "sandbox", default live).
function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");

  const auth = btoa(`${clientId}:${secret}`);
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    console.error("PayPal token error:", await res.text());
    throw new Error("Failed to authenticate with PayPal");
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ── Create order ─────────────────────────────────────────────────────────────

export const createOrder = action({
  args: {
    creatorId: v.id("creators"),
    gallons: v.number(),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ url: string; orderId: string }> => {
    if (args.gallons < 1 || args.gallons > 1000) {
      throw new Error("Gallons must be between 1 and 1000");
    }

    const amountCents = Math.round(args.gallons * GALLON_PRICE_CENTS);
    const amountUsd = (amountCents / 100).toFixed(2);
    const siteUrl = process.env.SITE_URL || "https://www.giveagallon.org";

    // Record a pending donation up front (mirrors the Stripe flow).
    const donationId = await ctx.runMutation(
      internal.paypal.createPendingDonation,
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

    const token = await getAccessToken();
    const res = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            // Ties the PayPal order back to our donation record in the webhook.
            custom_id: donationId,
            description: `${args.gallons} Gallon${
              args.gallons > 1 ? "s" : ""
            } of Fuel — Give a Gallon`,
            soft_descriptor: "GIVEAGALLON",
            amount: { currency_code: "USD", value: amountUsd },
          },
        ],
        application_context: {
          brand_name: "Give a Gallon",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: `${siteUrl}/donation-success?provider=paypal`,
          cancel_url: `${siteUrl}/donation-cancel`,
        },
      }),
    });

    if (!res.ok) {
      console.error("PayPal create-order error:", await res.text());
      throw new Error("Failed to start PayPal checkout");
    }

    const order = (await res.json()) as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    await ctx.runMutation(internal.paypal.setOrderId, {
      donationId,
      paypalOrderId: order.id,
    });

    const approve = order.links.find(l => l.rel === "approve")?.href;
    if (!approve) throw new Error("PayPal did not return an approval URL");

    return { url: approve, orderId: order.id };
  },
});

// ── Capture order (called on return from PayPal) ───────────────────────────────

export const captureOrder = action({
  args: { orderId: v.string() },
  handler: async (
    ctx,
    { orderId },
  ): Promise<{ ok: boolean; alreadyCompleted?: boolean }> => {
    const existing = await ctx.runQuery(internal.paypal.getDonationByOrder, {
      paypalOrderId: orderId,
    });
    if (existing?.status === "completed") {
      return { ok: true, alreadyCompleted: true };
    }

    const token = await getAccessToken();
    const res = await fetch(
      `${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      // A 422 ORDER_ALREADY_CAPTURED means the webhook beat us to it — fine.
      if (body.includes("ORDER_ALREADY_CAPTURED")) {
        return { ok: true, alreadyCompleted: true };
      }
      console.error("PayPal capture error:", body);
      throw new Error("Failed to capture PayPal payment");
    }

    const data = (await res.json()) as {
      status: string;
      purchase_units?: Array<{
        payments?: { captures?: Array<{ id: string; status: string }> };
      }>;
    };

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    if (data.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      return { ok: false };
    }

    await ctx.runMutation(internal.paypal.completeDonationByOrder, {
      paypalOrderId: orderId,
      paypalCaptureId: capture.id,
    });

    return { ok: true };
  },
});

// ── Internal queries / mutations ───────────────────────────────────────────────

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

export const setOrderId = internalMutation({
  args: { donationId: v.id("donations"), paypalOrderId: v.string() },
  handler: async (ctx, { donationId, paypalOrderId }) => {
    await ctx.db.patch(donationId, { paypalOrderId });
  },
});

export const getDonationByOrder = internalQuery({
  args: { paypalOrderId: v.string() },
  handler: async (ctx, { paypalOrderId }) => {
    return ctx.db
      .query("donations")
      .withIndex("by_paypalOrder", q => q.eq("paypalOrderId", paypalOrderId))
      .first();
  },
});

// Shared completion logic — marks the donation done, rolls up creator totals,
// updates platform stats, and credits referrals. Mirrors stripe.completeDonation.
async function applyCompletion(
  ctx: MutationCtx,
  donationId: import("./_generated/dataModel").Id<"donations">,
  paypalCaptureId?: string,
): Promise<void> {
  const donation = await ctx.db.get(donationId);
  if (!donation || donation.status === "completed") return;

  await ctx.db.patch(donation._id, {
    status: "completed",
    ...(paypalCaptureId ? { paypalCaptureId } : {}),
  });

  const creator = await ctx.db.get(donation.creatorId);
  if (creator) {
    await ctx.db.patch(creator._id, {
      totalGallons: creator.totalGallons + donation.gallons,
      totalDonations: creator.totalDonations + 1,
      totalAmountCents: creator.totalAmountCents + donation.amountCents,
    });
  }

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

  if (donation.referralCode) {
    await ctx.runMutation(internal.referrals.creditReferral, {
      referralCode: donation.referralCode,
      gallons: donation.gallons,
      donationId: donation._id,
    });
  }

  // Fire donation emails (non-fatal — must never block completion).
  if (creator) {
    const creatorUser = await ctx.db.get(creator.userId);
    await ctx.scheduler.runAfter(0, internal.paypal.sendDonationEmails, {
      creatorEmail: creatorUser?.email ?? undefined,
      creatorName: creator.displayName,
      creatorSlug: creator.slug,
      donorName: donation.isAnonymous
        ? "Anonymous"
        : (donation.donorName ?? "Someone"),
      donorEmail: donation.isAnonymous ? undefined : donation.donorEmail,
      gallons: donation.gallons,
      amountCents: donation.amountCents,
      netToCreatorCents: donation.amountCents - donation.platformFeeCents,
      message: donation.message,
    });
  }

  // Kick off the automated creator payout (non-blocking).
  await ctx.scheduler.runAfter(0, internal.paypal.payoutForDonation, {
    donationId: donation._id,
  });
}

export const completeDonationByOrder = internalMutation({
  args: { paypalOrderId: v.string(), paypalCaptureId: v.optional(v.string()) },
  handler: async (ctx, { paypalOrderId, paypalCaptureId }) => {
    const donation = await ctx.db
      .query("donations")
      .withIndex("by_paypalOrder", q => q.eq("paypalOrderId", paypalOrderId))
      .first();
    if (!donation) {
      console.error("No donation for PayPal order:", paypalOrderId);
      return;
    }
    await applyCompletion(ctx, donation._id, paypalCaptureId);
  },
});

export const completeDonationById = internalMutation({
  args: {
    donationId: v.id("donations"),
    paypalCaptureId: v.optional(v.string()),
  },
  handler: async (ctx, { donationId, paypalCaptureId }) => {
    await applyCompletion(ctx, donationId, paypalCaptureId);
  },
});

// ── Automated creator payouts (PayPal Payouts) ─────────────────────────────────

// The amount paid to the creator per donation. We pay the "net to creator"
// already shown in confirmation emails (gross minus the 5% platform fee); the
// platform absorbs PayPal's processing + payout fees from that 5%. To change the
// split, adjust this one function.
function creatorPayoutCents(donation: {
  amountCents: number;
  platformFeeCents: number;
}): number {
  return donation.amountCents - donation.platformFeeCents;
}

export const getDonationWithCreator = internalQuery({
  args: { donationId: v.id("donations") },
  handler: async (ctx, { donationId }) => {
    const donation = await ctx.db.get(donationId);
    if (!donation) return null;
    const creator = await ctx.db.get(donation.creatorId);
    return { donation, creator };
  },
});

export const listPayableDonations = internalQuery({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    // Completed donations for this creator that haven't been paid out yet
    // (either explicitly "held" or never attempted).
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_creator", q => q.eq("creatorId", creatorId))
      .collect();
    return donations.filter(
      d =>
        d.status === "completed" &&
        (d.payoutStatus === undefined ||
          d.payoutStatus === "held" ||
          d.payoutStatus === "failed"),
    );
  },
});

export const markPayoutHeld = internalMutation({
  args: { donationId: v.id("donations") },
  handler: async (ctx, { donationId }) => {
    const d = await ctx.db.get(donationId);
    if (!d || d.payoutStatus === "paid") return;
    await ctx.db.patch(donationId, { payoutStatus: "held" });
  },
});

export const recordPayoutResult = internalMutation({
  args: {
    donationId: v.id("donations"),
    payoutStatus: v.union(
      v.literal("processing"),
      v.literal("paid"),
      v.literal("unclaimed"),
      v.literal("failed"),
    ),
    payoutAmountCents: v.optional(v.number()),
    paypalPayoutBatchId: v.optional(v.string()),
    paypalPayoutItemId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.donationId);
    if (!d) return;
    await ctx.db.patch(args.donationId, {
      payoutStatus: args.payoutStatus,
      ...(args.payoutAmountCents !== undefined
        ? { payoutAmountCents: args.payoutAmountCents }
        : {}),
      ...(args.paypalPayoutBatchId
        ? { paypalPayoutBatchId: args.paypalPayoutBatchId }
        : {}),
      ...(args.paypalPayoutItemId
        ? { paypalPayoutItemId: args.paypalPayoutItemId }
        : {}),
      ...(args.payoutStatus === "paid" ? { payoutAt: Date.now() } : {}),
    });
  },
});

export const updatePayoutStatusByItem = internalMutation({
  args: {
    paypalPayoutItemId: v.string(),
    payoutStatus: v.union(
      v.literal("paid"),
      v.literal("unclaimed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, { paypalPayoutItemId, payoutStatus }) => {
    const d = await ctx.db
      .query("donations")
      .withIndex("by_paypalPayoutItem", q =>
        q.eq("paypalPayoutItemId", paypalPayoutItemId),
      )
      .first();
    if (!d) return;
    await ctx.db.patch(d._id, {
      payoutStatus,
      ...(payoutStatus === "paid" ? { payoutAt: Date.now() } : {}),
    });
  },
});

// Send one creator payout for a single donation via the PayPal Payouts API.
async function sendPayout(opts: {
  amountCents: number;
  receiverEmail: string;
  donationId: string;
  note: string;
}): Promise<{ batchId: string; itemId: string; status: string }> {
  const token = await getAccessToken();
  const senderItemId = `gag-${opts.donationId}`;
  const res = await fetch(`${paypalApiBase()}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        // Idempotency: PayPal rejects a reused sender_batch_id, preventing
        // accidental double-payouts for the same donation.
        sender_batch_id: `gag-payout-${opts.donationId}`,
        email_subject: "You've received a Give-A-Gallon payout",
        email_message:
          "Your supporters fueled your campaign. Here's your payout from Give-A-Gallon.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: (opts.amountCents / 100).toFixed(2),
            currency: "USD",
          },
          receiver: opts.receiverEmail,
          note: opts.note,
          sender_item_id: senderItemId,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal payout failed: ${body}`);
  }

  const data = (await res.json()) as {
    batch_header?: { payout_batch_id?: string; batch_status?: string };
    items?: Array<{ payout_item_id?: string }>;
  };
  return {
    batchId: data.batch_header?.payout_batch_id ?? "",
    itemId: data.items?.[0]?.payout_item_id ?? "",
    status: data.batch_header?.batch_status ?? "PENDING",
  };
}

export const payoutForDonation = internalAction({
  args: { donationId: v.id("donations") },
  handler: async (ctx, { donationId }) => {
    const data = await ctx.runQuery(internal.paypal.getDonationWithCreator, {
      donationId,
    });
    if (!data?.donation || !data.creator) return;
    const { donation, creator } = data;

    if (donation.status !== "completed") return;
    if (
      donation.payoutStatus === "paid" ||
      donation.payoutStatus === "processing"
    ) {
      return; // already handled
    }

    // No payout email yet → hold the funds; the sweep pays it once they add one.
    if (!creator.paypalPayoutEmail) {
      await ctx.runMutation(internal.paypal.markPayoutHeld, { donationId });
      return;
    }

    const amountCents = creatorPayoutCents(donation);
    if (amountCents <= 0) return;

    try {
      const result = await sendPayout({
        amountCents,
        receiverEmail: creator.paypalPayoutEmail,
        donationId,
        note: `Payout for ${donation.gallons} gallon${
          donation.gallons > 1 ? "s" : ""
        } on Give-A-Gallon`,
      });
      await ctx.runMutation(internal.paypal.recordPayoutResult, {
        donationId,
        payoutStatus: "processing",
        payoutAmountCents: amountCents,
        paypalPayoutBatchId: result.batchId,
        paypalPayoutItemId: result.itemId,
      });
    } catch (err) {
      console.error("Creator payout failed:", err);
      await ctx.runMutation(internal.paypal.recordPayoutResult, {
        donationId,
        payoutStatus: "failed",
        payoutAmountCents: amountCents,
      });
    }
  },
});

// Back-pay every payable donation for a creator (called when they set/update
// their payout email). Spaces payouts slightly to stay clear of rate limits.
export const sweepCreatorPayouts = internalAction({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    const payable = await ctx.runQuery(internal.paypal.listPayableDonations, {
      creatorId,
    });
    for (const d of payable) {
      await ctx.runAction(internal.paypal.payoutForDonation, {
        donationId: d._id,
      });
    }
  },
});

// ── Email dispatch (scheduled, non-fatal) ──────────────────────────────────────

export const sendDonationEmails = internalAction({
  args: {
    creatorEmail: v.optional(v.string()),
    creatorName: v.string(),
    creatorSlug: v.string(),
    donorName: v.string(),
    donorEmail: v.optional(v.string()),
    gallons: v.number(),
    amountCents: v.number(),
    netToCreatorCents: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      if (args.creatorEmail) {
        await ctx.runAction(internal.emails.sendDonationReceived, {
          creatorEmail: args.creatorEmail,
          creatorName: args.creatorName,
          creatorSlug: args.creatorSlug,
          donorName: args.donorName,
          gallons: args.gallons,
          amountCents: args.netToCreatorCents,
          message: args.message,
        });
      }
    } catch (err) {
      console.error("PayPal creator email failed (non-fatal):", err);
    }
    try {
      if (args.donorEmail) {
        await ctx.runAction(internal.emails.sendDonationConfirmation, {
          donorEmail: args.donorEmail,
          donorName: args.donorName,
          gallons: args.gallons,
          amountCents: args.amountCents,
          creatorName: args.creatorName,
          creatorSlug: args.creatorSlug,
        });
      }
    } catch (err) {
      console.error("PayPal donor email failed (non-fatal):", err);
    }
  },
});

// ── Webhook (backup completion) ────────────────────────────────────────────────

export const handleWebhook = action({
  args: {
    body: v.string(),
    headers: v.object({
      transmissionId: v.optional(v.string()),
      transmissionTime: v.optional(v.string()),
      transmissionSig: v.optional(v.string()),
      certUrl: v.optional(v.string()),
      authAlgo: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { body, headers }) => {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Verify the webhook signature with PayPal when configured. If no webhook id
    // is set we skip verification (the synchronous capture path is the primary
    // route; the webhook is only a backup), but log it so it's not silent.
    if (webhookId) {
      const token = await getAccessToken();
      const verifyRes = await fetch(
        `${paypalApiBase()}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transmission_id: headers.transmissionId,
            transmission_time: headers.transmissionTime,
            cert_url: headers.certUrl,
            auth_algo: headers.authAlgo,
            transmission_sig: headers.transmissionSig,
            webhook_id: webhookId,
            webhook_event: JSON.parse(body),
          }),
        },
      );
      const verify = (await verifyRes.json()) as {
        verification_status?: string;
      };
      if (verify.verification_status !== "SUCCESS") {
        throw new Error("PayPal webhook signature verification failed");
      }
    } else {
      console.warn("PAYPAL_WEBHOOK_ID not set — skipping signature verify");
    }

    const event = JSON.parse(body) as {
      event_type?: string;
      resource?: {
        id?: string;
        custom_id?: string;
        payout_item_id?: string;
        supplementary_data?: {
          related_ids?: { order_id?: string };
        };
      };
    };

    // ── Donation captured → complete the donation (backup for the return path) ──
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource ?? {};
      const captureId = resource.id;
      const donationId = resource.custom_id; // we set this to our donation id
      const orderId = resource.supplementary_data?.related_ids?.order_id;

      if (donationId) {
        await ctx.runMutation(internal.paypal.completeDonationById, {
          donationId:
            donationId as import("./_generated/dataModel").Id<"donations">,
          paypalCaptureId: captureId,
        });
      } else if (orderId) {
        await ctx.runMutation(internal.paypal.completeDonationByOrder, {
          paypalOrderId: orderId,
          paypalCaptureId: captureId,
        });
      }
    }

    // ── Creator payout item events → update payout status ──
    if (event.event_type?.startsWith("PAYMENT.PAYOUTS-ITEM.")) {
      const itemId = event.resource?.payout_item_id;
      if (itemId) {
        const status: "paid" | "unclaimed" | "failed" =
          event.event_type === "PAYMENT.PAYOUTS-ITEM.SUCCEEDED"
            ? "paid"
            : event.event_type === "PAYMENT.PAYOUTS-ITEM.UNCLAIMED"
              ? "unclaimed"
              : "failed"; // FAILED / DENIED / RETURNED / BLOCKED / REFUNDED
        await ctx.runMutation(internal.paypal.updatePayoutStatusByItem, {
          paypalPayoutItemId: itemId,
          payoutStatus: status,
        });
      }
    }

    return { received: true };
  },
});
