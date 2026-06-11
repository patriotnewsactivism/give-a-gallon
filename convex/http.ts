// Give a Gallon — HTTP routes (webhook verified)
import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();
auth.addHttpRoutes(http);

// Stripe webhook endpoint
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature") || "";
    const payload = await request.text();

    try {
      await ctx.runAction(api.stripe.handleWebhook, { payload, signature });
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});



// Diagnostic: check env var status (temporary)
http.route({
  path: "/check-env",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
    const hasSiteUrl = !!process.env.SITE_URL;
    return new Response(JSON.stringify({
      STRIPE_SECRET_KEY: hasStripeKey ? "SET (" + process.env.STRIPE_SECRET_KEY.substring(0, 8) + "...)" : "NOT SET",
      STRIPE_WEBHOOK_SECRET: hasWebhookSecret ? "SET" : "NOT SET",
      SITE_URL: process.env.SITE_URL || "NOT SET",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
