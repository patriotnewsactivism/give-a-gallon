// Give a Gallon — support tickets (public contact form → AI assistant)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";

const CATEGORIES = ["donation", "creator", "payout", "account", "other"];

// Public: submit a support request from the /support contact form.
// Stores the ticket and schedules the AI assistant to draft + send a reply.
export const submitTicket = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    category: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 120);
    const email = args.email.trim().toLowerCase().slice(0, 200);
    const subject = args.subject.trim().slice(0, 200);
    const message = args.message.trim().slice(0, 4000);
    const category = CATEGORIES.includes(args.category)
      ? args.category
      : "other";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address");
    }
    if (message.length < 10) {
      throw new Error("Please add a little more detail to your message");
    }

    const ticketId = await ctx.db.insert("supportTickets", {
      name: name || email.split("@")[0],
      email,
      category,
      subject: subject || "Support request",
      message,
      status: "open",
      createdAt: Date.now(),
    });

    // Hand off to the AI assistant (drafts a reply, emails the user + support).
    // Non-blocking: the form returns immediately.
    await ctx.scheduler.runAfter(0, internal.supportAI.handleTicket, {
      ticketId,
    });

    return { ticketId };
  },
});

// Internal: load a ticket for the AI action.
export const getTicket = internalQuery({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, { ticketId }) => {
    return await ctx.db.get(ticketId);
  },
});

// Internal: record the AI reply / final status on a ticket.
export const recordReply = internalMutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("ai_replied"),
      v.literal("needs_human"),
      v.literal("closed"),
    ),
    aiReply: v.optional(v.string()),
  },
  handler: async (ctx, { ticketId, status, aiReply }) => {
    await ctx.db.patch(ticketId, {
      status,
      aiReply,
      repliedAt: Date.now(),
    });
  },
});
