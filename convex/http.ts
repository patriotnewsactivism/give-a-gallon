// Give a Gallon — HTTP routes (webhook verified)
import { httpRouter } from "convex/server";
import { api, internal } from "./_generated/api";
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

// Inbound support email → AI assistant.
// An email worker (e.g. Cloudflare Email Routing) parses mail to
// support@giveagallon.org and POSTs { from, name?, subject, body } here with an
// `x-support-secret` header matching SUPPORT_INBOUND_SECRET.
http.route({
  path: "/support-inbound",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.SUPPORT_INBOUND_SECRET;
    if (!secret || request.headers.get("x-support-secret") !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }

    let payload: {
      from?: string;
      name?: string;
      subject?: string;
      body?: string;
    };
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (!payload.from || !payload.body) {
      return new Response("Missing from/body", { status: 400 });
    }

    await ctx.runMutation(internal.support.intakeInboundEmail, {
      from: payload.from,
      name: payload.name,
      subject: payload.subject ?? "Support request",
      body: payload.body,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
