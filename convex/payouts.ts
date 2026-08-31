import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const initiatePayPalPayout = mutation({
  args: {
    creatorId: v.id("creators"),
    amountCents: v.number(),
    paypalEmail: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) {
      throw new Error("Payout amount must be greater than zero.");
    }

    const existing = await ctx.db
      .query("payouts")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { payoutId: existing._id, status: existing.status };
    }

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) {
      throw new Error("Creator not found.");
    }

    if (creator.balanceCents < args.amountCents) {
      throw new Error("Insufficient creator balance.");
    }

    // Atomic ledger deduction
    await ctx.db.patch(creator._id, {
      balanceCents: creator.balanceCents - args.amountCents,
      disbursedCents: creator.disbursedCents + args.amountCents,
      updatedAt: Date.now(),
    });

    const payoutId = await ctx.db.insert("payouts", {
      creatorId: creator._id,
      provider: "paypal",
      amountCents: args.amountCents,
      recipient: args.paypalEmail,
      status: "processing",
      retryCount: 0,
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { payoutId, status: "processing" };
  },
});

export const finalizePayoutStatus = mutation({
  args: {
    payoutId: v.id("payouts"),
    status: v.union(v.literal("success"), v.literal("failed")),
    payoutBatchId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Payout not found");

    if (args.status === "failed" && payout.status === "processing") {
      // Rollback creator balance on failure
      const creator = await ctx.db.get(payout.creatorId);
      if (creator) {
        await ctx.db.patch(creator._id, {
          balanceCents: creator.balanceCents + payout.amountCents,
          disbursedCents: Math.max(0, creator.disbursedCents - payout.amountCents),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(payout._id, {
      status: args.status,
      payoutBatchId: args.payoutBatchId,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
