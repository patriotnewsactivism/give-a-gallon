"use node";
// Give a Gallon — PayPal Checkout actions (Node.js runtime)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");
  const base =
    process.env.PAYPAL_ENV === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token error: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

function paypalBase(): string {
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
  handler: async (
    ctx,
    args,
  ): Promise<{ url: string; orderId: string; donationId: string }> => {
    if (args.gallons < 1 || args.gallons > 1000)
      throw new Error("Gallons must be between 1 and 1000");
    const amountCents = Math.round(args.gallons * 425);
    const platformFeeCents = Math.round(amountCents * 0.05);
    const amountUSD = (amountCents / 100).toFixed(2);

    const donationId: string = await ctx.runMutation(
      internal.paypalMutations.createPendingDonation,
      {
        creatorId: args.creatorId,
        gallons: args.gallons,
        amountCents,
        platformFeeCents,
        donorName: args.donorName,
        donorEmail: args.donorEmail,
        message: args.message,
        isAnonymous: args.isAnonymous,
        referralCode: args.referralCode,
      },
    );

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
        purchase_units: [
          {
            reference_id: donationId,
            description: `${args.gallons} Gallon${args.gallons > 1 ? "s" : ""} of Fuel — Give-A-Gallon`,
            custom_id: donationId,
            amount: { currency_code: "USD", value: amountUSD },
          },
        ],
        application_context: {
          brand_name: "Give-A-Gallon",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/donation-success?donation_id=${donationId}`,
          cancel_url: `${siteUrl}/donation-cancel`,
        },
      }),
    });

    if (!orderRes.ok)
      throw new Error(
        `Failed to create PayPal order: ${await orderRes.text()}`,
      );
    const orderData = (await orderRes.json()) as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };
    const approveLink = orderData.links?.find(l => l.rel === "approve")?.href;
    if (!approveLink) throw new Error("No PayPal approve link returned");

    await ctx.runMutation(internal.paypalMutations.setPayPalOrderId, {
      donationId: donationId as any,
      paypalOrderId: orderData.id,
    });

    return { url: approveLink, orderId: orderData.id, donationId };
  },
});

export const captureOrder = action({
  args: { orderId: v.string() },
  handler: async (
    ctx,
    { orderId },
  ): Promise<{ success: boolean; donationId: string }> => {
    const token = await getPayPalToken();
    const res = await fetch(
      `${paypalBase()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok)
      throw new Error(`Failed to capture PayPal order: ${await res.text()}`);
    const data = (await res.json()) as {
      purchase_units: Array<{
        custom_id?: string;
        reference_id?: string;
        payments?: { captures?: Array<{ id: string }> };
      }>;
    };
    const unit = data.purchase_units?.[0];
    const donationId = unit?.custom_id || unit?.reference_id;
    const captureId = unit?.payments?.captures?.[0]?.id;
    if (!donationId)
      throw new Error("No donationId in PayPal capture response");
    await ctx.runMutation(internal.paypalMutations.completeDonation, {
      donationId,
      paypalCaptureId: captureId,
    });
    return { success: true, donationId };
  },
});

export const handleWebhook = action({
  args: { payload: v.string(), headers: v.string() },
  handler: async (ctx, { payload, headers }): Promise<{ received: boolean }> => {
    const parsedHeaders = JSON.parse(headers) as Record<string, string>;

    const transmissionId = parsedHeaders["paypal-transmission-id"];
    const transmissionTime = parsedHeaders["paypal-transmission-time"];
    const certUrl = parsedHeaders["paypal-cert-url"];
    const authAlgo = parsedHeaders["paypal-auth-algo"];
    const transmissionSig = parsedHeaders["paypal-transmission-sig"];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      throw new Error("Missing PayPal webhook signature headers");
    }

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new Error("PAYPAL_WEBHOOK_ID environment variable not configured");
    }

    const token = await getPayPalToken();

    const verifyRes = await fetch(
      `${paypalBase()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: JSON.parse(payload),
        }),
      },
    );

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error(`PayPal webhook verification failed: ${errorText}`);
      throw new Error("Webhook signature verification failed");
    }

    const verifyData = (await verifyRes.json()) as {
      verification_status: string;
    };

    if (verifyData.verification_status !== "SUCCESS") {
      throw new Error(
        `Webhook verification status: ${verifyData.verification_status}`,
      );
    }

    const event = JSON.parse(payload) as {
      event_type: string;
      resource: {
        id?: string;
        custom_id?: string;
        purchase_units?: Array<{ custom_id?: string }>;
      };
    };
    const eventType = event.event_type;
    if (
      eventType === "CHECKOUT.ORDER.APPROVED" ||
      eventType === "PAYMENT.CAPTURE.COMPLETED"
    ) {
      const resource = event.resource;
      const donationId =
        resource?.custom_id || resource?.purchase_units?.[0]?.custom_id;
      const captureId = resource?.id;
      if (donationId) {
        await ctx.runMutation(internal.paypalMutations.completeDonation, {
          donationId,
          paypalCaptureId: captureId,
        });
      }
    }
    return { received: true };
  },
});
