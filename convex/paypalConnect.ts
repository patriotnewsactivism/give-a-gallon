"use node";
import { getAuthUserId } from "@convex-dev/auth/server";
// Give a Gallon — PayPal Payouts actions (Node.js runtime)
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

export const startOnboarding = action({
  args: { paypalEmail: v.string() },
  handler: async (ctx, { paypalEmail }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const creator: any = await ctx.runQuery(
      internal.paypalConnectMutations.getMyCreator,
      {},
    );
    if (!creator) throw new Error("Creator profile not found");
    await ctx.runMutation(internal.paypalConnectMutations.setPayPalEmail, {
      creatorId: creator._id,
      paypalEmail,
    });
    return { success: true };
  },
});

export const getBalance = action({
  args: {},
  handler: async ctx => {
    const creator: any = await ctx.runQuery(
      internal.paypalConnectMutations.getMyCreator,
      {},
    );
    if (!creator) throw new Error("Creator not found");
    const totalPaidOut = creator.payoutsCents ?? 0;
    const netCents = Math.round(creator.totalAmountCents * 0.95) - totalPaidOut;
    return {
      availableCents: Math.max(0, netCents),
      pendingCents: 0,
      accountStatus: "active",
      currency: "USD",
    };
  },
});

export const requestPayout = action({
  args: { amountCents: v.number(), instant: v.boolean() },
  handler: async (ctx, { amountCents, instant }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const creator: any = await ctx.runQuery(
      internal.paypalConnectMutations.getMyCreator,
      {},
    );
    if (!creator) throw new Error("Creator not found");
    if (!(creator as any).paypalEmail)
      throw new Error("No PayPal email on file — please add one in Settings.");
    if (amountCents < 100) throw new Error("Minimum payout is $1.00");

    const totalPaidOut = creator.payoutsCents ?? 0;
    const availableCents =
      Math.round(creator.totalAmountCents * 0.95) - totalPaidOut;
    if (amountCents > availableCents) {
      throw new Error("Insufficient funds available for payout.");
    }

    const feeCents = instant
      ? Math.min(1000, Math.max(50, Math.round(amountCents * 0.015)))
      : 0;
    const netCents = amountCents - feeCents;

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const batchId = `payout_${creator._id}_${Date.now()}`;

    if (!clientId || !secret) {
      // Simulation mode for development/preview environments without PayPal configured
      await ctx.runMutation(internal.paypalConnectMutations.recordPayout, {
        creatorId: creator._id,
        amountCents,
      });
      return {
        success: true,
        payoutId: `sim_${batchId}`,
        feeCents,
        netCents,
        method: instant ? "instant" : "standard",
      };
    }

    const token = await getPayPalToken();
    const amountUSD = (netCents / 100).toFixed(2);

    const res = await fetch(`${paypalBase()}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "Your Give-A-Gallon payout is on its way!",
          email_message:
            "Thanks for being a creator on Give-A-Gallon. Your payout has been processed.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: amountUSD, currency: "USD" },
            receiver: (creator as any).paypalEmail,
            note: "Give-A-Gallon creator payout",
            sender_item_id: batchId,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`PayPal payout error: ${await res.text()}`);

    await ctx.runMutation(internal.paypalConnectMutations.recordPayout, {
      creatorId: creator._id,
      amountCents,
    });

    return {
      success: true,
      payoutId: batchId,
      feeCents,
      netCents,
      method: instant ? "instant" : "standard",
    };
  },
});
