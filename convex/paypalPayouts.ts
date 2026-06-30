"use node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { PLATFORM_FEE_PCT } from "./constants";

function paypalBase(): string {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");
  const base = paypalBase();
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

export const triggerPayout = action({
  args: {
    creatorId: v.id("creators"),
  },
  handler: async (ctx, { creatorId }) => {
    const creators = await ctx.runQuery(
      internal.paypalMutations.getEligibleCreatorsForPayout,
      {},
    );
    const creator = creators.find((c) => c._id === creatorId);
    if (!creator) {
      return {
        success: false,
        message: "Creator not eligible for payout",
        payoutAmountCents: 0,
      };
    }

    const owed =
      creator.totalAmountCents * (1 - PLATFORM_FEE_PCT) -
      creator.payoutsCents;
    const payoutAmountCents = Math.floor(owed);

    if (payoutAmountCents <= 0) {
      return {
        success: false,
        message: "No balance to pay out",
        payoutAmountCents: 0,
      };
    }

    const payoutAmountUSD = (payoutAmountCents / 100).toFixed(2);
    const token = await getPayPalToken();
    const senderBatchId = `${creatorId}_${Date.now()}`;

    const res = await fetch(`${paypalBase()}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": senderBatchId,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: "You received a payout from Give-A-Gallon!",
          email_message:
            "Thank you for your campaign on Give-A-Gallon. Here is your latest payout.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: payoutAmountUSD,
              currency: "USD",
            },
            note: "Give-A-Gallon campaign payout",
            receiver: creator.paypalEmail,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`PayPal Payout failed: ${errorText}`);
      throw new Error(`PayPal Payout failed: ${errorText}`);
    }

    const data = (await res.json()) as {
      batch_header: { payout_batch_id: string; batch_status: string };
    };
    const batchStatus = data.batch_header?.batch_status;

    if (batchStatus === "SUCCESS" || batchStatus === "PENDING" || batchStatus === "PROCESSING") {
      await ctx.runMutation(internal.paypalMutations.updatePayoutsCents, {
        creatorId,
        payoutAmountCents,
      });

      return {
        success: true,
        message: `Payout of $${payoutAmountUSD} sent (batch: ${data.batch_header.payout_batch_id})`,
        payoutAmountCents,
      };
    }

    throw new Error(`PayPal Payout batch status: ${batchStatus}`);
  },
});

export const runWeeklyPayouts = action({
  args: {},
  handler: async (ctx) => {
    const eligibleCreators = await ctx.runQuery(
      internal.paypalMutations.getEligibleCreatorsForPayout,
      {},
    );

    if (eligibleCreators.length === 0) {
      return { payoutsProcessed: 0, results: [] };
    }

    const results: Array<{ creatorId: string; success: boolean; message: string }> = [];

    for (const creator of eligibleCreators) {
      try {
        const result = await ctx.runAction(internal.paypalPayouts.triggerPayout, {
          creatorId: creator._id as any,
        });
        results.push({
          creatorId: creator._id,
          success: result.success,
          message: result.message,
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({
          creatorId: creator._id,
          success: false,
          message: msg,
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return { payoutsProcessed: succeeded, results };
  },
});
