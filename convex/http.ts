import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

async function verifyHmacSignature(rawBody: string, signatureHeader: string | null, secret: string | undefined): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, item) => {
    const [k, v] = item.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  // Check age (allow 5 minutes max timestamp drift)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parseInt(timestamp, 10)) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedPayload = `${timestamp}.${rawBody}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const hexSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hexSignature === expectedSig;
}

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    const isValid = await verifyHmacSignature(rawBody, signature, secret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const payload = JSON.parse(rawBody);
      if (payload.type === "checkout.session.completed") {
        const session = payload.data.object;
        const metadata = session.metadata || {};
        const creatorSlug = metadata.creatorSlug || "";
        const gallons = parseInt(metadata.gallons || "0", 10);
        const amountCents = session.amount_total || 0;
        const donorName = session.customer_details?.name || "Anonymous";
        const donorEmail = session.customer_details?.email || undefined;

        await ctx.runMutation(api.donations.recordCompletedCheckoutSession, {
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          creatorSlug,
          donorName,
          donorEmail,
          gallons,
          amountCents,
        });
      }
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "Webhook handling error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
