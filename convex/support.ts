// Give a Gallon — support tickets (contact form + inbound email → AI assistant)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

const CATEGORIES = ["donation", "creator", "payout", "account", "other"];

// Reopen tickets within this window when a sender emails again; otherwise a
// fresh email starts a new ticket.
const THREAD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Public: submit a support request from the /support contact form.
// Stores the ticket + first message and schedules the AI assistant to reply.
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

    if (!email || !isValidEmail(email)) {
      throw new Error("Please enter a valid email address");
    }
    if (message.length < 10) {
      throw new Error("Please add a little more detail to your message");
    }

    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
      name: name || email.split("@")[0],
      email,
      category,
      subject: subject || "Support request",
      message,
      status: "open",
      source: "web",
      lastMessageAt: now,
      createdAt: now,
    });
    await ctx.db.insert("supportMessages", {
      ticketId,
      role: "user",
      body: message,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.supportAI.handleTicket, {
      ticketId,
    });

    return { ticketId };
  },
});

// Internal: intake an inbound email reply. Finds the sender's most recent open
// thread (or starts a new one), appends the message, and schedules the AI.
export const intakeInboundEmail = internalMutation({
  args: {
    from: v.string(),
    name: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.from.trim().toLowerCase().slice(0, 200);
    const body = args.body.trim().slice(0, 8000);
    const subject = args.subject.trim().slice(0, 200) || "Support request";
    if (!email || !isValidEmail(email) || body.length === 0) {
      return null;
    }

    const now = Date.now();

    // Look for an existing recent, non-closed ticket from this sender.
    const recent = await ctx.db
      .query("supportTickets")
      .withIndex("by_email", q => q.eq("email", email))
      .order("desc")
      .take(5);
    const existing = recent.find(
      t =>
        t.status !== "closed" &&
        now - (t.lastMessageAt ?? t.createdAt) < THREAD_WINDOW_MS,
    );

    let ticketId: Id<"supportTickets">;
    if (existing) {
      ticketId = existing._id;
      await ctx.db.patch(ticketId, { status: "open", lastMessageAt: now });
    } else {
      ticketId = await ctx.db.insert("supportTickets", {
        name: (args.name ?? "").trim().slice(0, 120) || email.split("@")[0],
        email,
        category: "other",
        subject: subject.replace(/^(re:\s*)+/i, "").slice(0, 200),
        message: body,
        status: "open",
        source: "email",
        lastMessageAt: now,
        createdAt: now,
      });
    }

    await ctx.db.insert("supportMessages", {
      ticketId,
      role: "user",
      body,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.supportAI.handleTicket, {
      ticketId,
    });

    return { ticketId };
  },
});

// Internal: the ticket plus its full ordered message thread (for the AI).
export const getThread = internalQuery({
  args: { ticketId: v.id("supportTickets") },
  handler: async (
    ctx,
    { ticketId },
  ): Promise<{
    ticket: Doc<"supportTickets"> | null;
    messages: Doc<"supportMessages">[];
  }> => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return { ticket: null, messages: [] };
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_ticket", q => q.eq("ticketId", ticketId))
      .order("asc")
      .collect();
    return { ticket, messages };
  },
});

// Internal: append a message to a ticket thread.
export const addMessage = internalMutation({
  args: {
    ticketId: v.id("supportTickets"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    body: v.string(),
  },
  handler: async (ctx, { ticketId, role, body }) => {
    const now = Date.now();
    await ctx.db.insert("supportMessages", {
      ticketId,
      role,
      body,
      createdAt: now,
    });
    await ctx.db.patch(ticketId, { lastMessageAt: now });
  },
});

// Internal: record the final status / latest AI reply on a ticket.
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
