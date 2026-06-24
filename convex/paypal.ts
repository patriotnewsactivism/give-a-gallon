"use node";
// Give a Gallon — PayPal Checkout integration (Orders API v2)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";

const GALLON_PRICE_CENTS = 425;
const PLATFORM_FEE_PCT = 0.05;

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");
  const base = process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token error: ${await res.text()}`);
  return ((await res.json()) as any).access_token as string;
}

function paypalBase() {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

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
    if (args.gallons < 1 || args.gallons > 1000) throw new Error("Gallons must be between 1 and 1000");
    const amountCents = Math.round(args.gallons * GALLON_PRICE_CENTS);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PCT);
    const amountUSD = (amountCents / 100).toFixed(2);

    const donationId = await ctx.runMutation(internal.paypal.createPendingDonation, {
      creatorId: args.creatorId,
      gallons: args.gallons,
      amountCents,
      platformFeeCents,
      donorName: args.donorName,
      donorEmail: args.donorEmail,
      message: args.message,
      isAnonymous: args.isAnonymous,
      referralCode: args.referralCode,
    });

    const siteUrl = process.env.SITE_URL || "https://www.giveagallon.org";
    const token = await getPayPalToken();

    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": donationId,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: donationId,
          description: `${args.gallons} Gallon${args.gallons > 1 ? "s" : ""} of Fuel — Give-A-Gallon`,
          custom_id: donationId,
          amount: { currency_code: "USD", value: amountUSD },
        }],
        application_context: {
          brand_name: "Give-A-Gallon",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/donation-success?donation_id=${donationId}`,
          cancel_url: `${siteUrl}/donation-cancel`,
        },
      }),
    });

    if (!orderRes.ok) throw new Error(`Failed to create PayPal order: ${await orderRes.text()}`);
    const orderData = await orderRes.json() as any;
    const approveLink = orderData.links?.find((l: any) => l.rel === "approve")?.href;
    if (!approveLink) throw new Error("No PayPal approve link returned");

    await ctx.runMutation(internal.paypal.setPayPalOrderId, { donationId, paypalOrderId: orderData.id });
    return { url: approveLink as string, orderId: orderData.id as string, donationId };
  },
});

export const captureOrder = action({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const token = await getPayPalToken();
    const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Failed to capture PayPal order: ${await res.text()}`);
    const data = await res.json() as any;
    const unit = data.purchase_units?.[0];
    const donationId = unit?.custom_id || unit?.reference_id;
    const captureId  = unit?.payments?.captures?.[0]?.id;
    if (!donationId) throw new Error("No donationId in PayPal capture response");
    await ctx.runMutation(internal.paypal.completeDonation, { donationId, paypalCaptureId: captureId });
    return { success: true, donationId };
  },
});

export const getByPayPalOrder = internalQuery({
  args: { donationId: v.string() },
  handler: async (ctx, { donationId }) => ctx.db.get(donationId as any),
});

export const handleWebhook = action({
  args: { payload: v.string(), headers: v.string() },
  handler: async (ctx, { payload, headers }) => {
    const event = JSON.parse(payload);
    const eventType: string = event.event_type;
    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource;
      const donationId = resource?.custom_id || resource?.purchase_units?.[0]?.custom_id;
      const captureId  = resource?.id;
      if (donationId) {
        await ctx.runMutation(internal.paypal.completeDonation, { donationId, paypalCaptureId: captureId });
      }
    }
    return { received: true };
  },
});

export const createPendingDonation = internalMutation({
  args: {
    creatorId: v.id("creators"),
    gallons: v.number(),
    amountCents: v.number(),
    platformFeeCents: v.number(),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => ctx.db.insert("donations", { ...args, status: "pending", createdAt: Date.now() }),
});

export const setPayPalOrderId = internalMutation({
  args: { donationId: v.id("donations"), paypalOrderId: v.string() },
  handler: async (ctx, { donationId, paypalOrderId }) => ctx.db.patch(donationId, { stripeSessionId: paypalOrderId }),
});

export const completeDonation = internalMutation({
  args: { donationId: v.string(), paypalCaptureId: v.optional(v.string()) },
  handler: async (ctx, { donationId, paypalCaptureId }) => {
    const donation = await ctx.db.get(donationId as any);
    if (!donation || donation.status === "completed") return;
    await ctx.db.patch(donation._id, {
      status: "completed",
      ...(paypalCaptureId ? { stripePaymentIntentId: paypalCaptureId } : {}),
    });
    const creator = await ctx.db.get(donation.creatorId);
    if (creator) {
      await ctx.db.patch(creator._id, {
        totalGallons: creator.totalGallons + donation.gallons,
        totalDonations: creator.totalDonations + 1,
        totalAmountCents: creator.totalAmountCents + donation.amountCents,
      });
    }
    const stats = await ctx.db.query("platformStats").withIndex("by_key", q => q.eq("key","global")).first();
    if (stats) {
      await ctx.db.patch(stats._id, {
        totalDonationsCents: stats.totalDonationsCents + donation.amountCents,
        totalGallons: stats.totalGallons + donation.gallons,
        totalDonors: stats.totalDonors + 1,
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
  },
});
