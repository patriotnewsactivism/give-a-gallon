// Give a Gallon — HTTP routes (webhook verified)
import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

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

// Stripe Connect V2 Thin Webhook endpoint
http.route({
  path: "/stripe-v2-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Read Stripe V2 Signature and payload
    const signature = request.headers.get("stripe-signature") || "";
    const payload = await request.text();

    try {
      // Forward the thin event payload to our connectV2 action for verification and execution
      await ctx.runAction(api.connectV2.handleV2Webhook, { payload, signature });
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Connect V2 Webhook HTTP Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Recent donations endpoint (for automations / webhooks)
http.route({
  path: "/api/recent-donations",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const limit = new URL(request.url).searchParams.get("limit") || "50";
    const donations = await ctx.runQuery(api.donations.getRecent, {
      limit: parseInt(limit, 10),
    });
    return new Response(JSON.stringify(donations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Recent creators endpoint (for automations / webhooks)
http.route({
  path: "/api/recent-creators",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const limit = new URL(request.url).searchParams.get("limit") || "50";
    const creators = await ctx.runQuery(api.creators.listRecentCreators, {
      limit: parseInt(limit, 10),
    });
    return new Response(JSON.stringify(creators), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
