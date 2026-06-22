"use node";

// Give a Gallon — AI support assistant ("AI employee" manning support@).
// Drafts a reply to each support ticket with Claude, emails it to the sender
// from support@giveagallon.org, and copies the support inbox for oversight.
import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

const SUPPORT_FROM = "Give-A-Gallon Support <support@giveagallon.org>";
const SUPPORT_INBOX = "support@giveagallon.org";
const SITE = "https://www.giveagallon.org";

// What the assistant is allowed to rely on. Keep factual and current.
const KNOWLEDGE = `
You are the support assistant for Give-A-Gallon (www.giveagallon.org), a
crowdfunding platform by We The People News where donors fund activists,
journalists, and creators in "gallons of fuel."

Facts you can rely on:
- 1 gallon of fuel = $4.25.
- Fees: 5% platform fee + ~3% Stripe processing; creators net ~92% of a donation.
- Donations are generally non-refundable because funds can pay out to creators
  quickly. If a donor believes a charge was fraudulent/unauthorized, they should
  contact support immediately and we will investigate.
- Donations are not tax-deductible unless the creator is a registered 501(c)(3)
  (most are not).
- Creators receive payouts through Stripe Connect. Standard payouts take ~1–2
  business days (free); instant payouts cost Stripe's ~1% fee (min $0.50). New
  Stripe accounts can have temporary payout holds or review delays that Stripe
  sets for fraud protection — these clear automatically and are outside our
  control.
- Account/login: password resets are handled by email.
- Statements show the charge as "GIVEAGALLON".

Tone: warm, concise, and human. Write a complete email reply (no subject line).
Sign off as "— The Give-A-Gallon Support Team".

Rules:
- Only state facts from above. Never invent policies, amounts, dates, or
  account-specific details.
- If the request needs account-specific action (a refund, a payout problem, a
  locked account, anything requiring you to look up their data), help with what
  you can from the facts, then tell them a teammate will personally follow up
  within one business day.
- Keep it under ~200 words.
`.trim();

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping support email to", opts.to);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SUPPORT_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    console.error(`Resend error (support) to ${opts.to}:`, await res.text());
  }
}

function wrap(bodyHtml: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;color:#222;">
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="color:#999;font-size:12px;">Give-A-Gallon · <a href="${SITE}" style="color:#f97316;text-decoration:none;">www.giveagallon.org</a></p>
  </div>`;
}

async function draftReply(ticket: Doc<"supportTickets">): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: KNOWLEDGE,
    messages: [
      {
        role: "user",
        content:
          `A user submitted a support request.\n\n` +
          `Name: ${ticket.name}\n` +
          `Category: ${ticket.category}\n` +
          `Subject: ${ticket.subject}\n\n` +
          `Message:\n${ticket.message}\n\n` +
          `Write the email reply now.`,
      },
    ],
  });

  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export const handleTicket = internalAction({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.runQuery(internal.support.getTicket, { ticketId });
    if (!ticket) return;

    let aiReply: string | null = null;
    try {
      aiReply = await draftReply(ticket);
    } catch (err) {
      console.error("Support AI draft failed:", err);
    }

    const greeting = ticket.name ? `Hi ${ticket.name},` : "Hi,";
    const replyText =
      aiReply ??
      `${greeting}\n\nThanks for reaching out to Give-A-Gallon support — we've ` +
        `received your message and a teammate will follow up within one ` +
        `business day.\n\n— The Give-A-Gallon Support Team`;

    // 1) Reply to the user. Replies route back to the support inbox.
    await sendEmail({
      to: ticket.email,
      subject: `Re: ${ticket.subject}`,
      replyTo: SUPPORT_INBOX,
      html: wrap(
        `<p style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(replyText)}</p>`,
      ),
    });

    // 2) Copy the support inbox for human oversight of the AI's reply.
    await sendEmail({
      to: SUPPORT_INBOX,
      subject: `[${ticket.category}] ${ticket.subject} — ${ticket.email}`,
      html: wrap(
        `<p><strong>New support ticket</strong></p>
         <p style="font-size:13px;color:#555;">From ${escapeHtml(ticket.name)} &lt;${escapeHtml(ticket.email)}&gt;<br/>Category: ${escapeHtml(ticket.category)}</p>
         <p style="white-space:pre-wrap;line-height:1.5;"><strong>Message:</strong>\n${escapeHtml(ticket.message)}</p>
         <p style="white-space:pre-wrap;line-height:1.5;color:#0a7;"><strong>AI reply sent:</strong>\n${escapeHtml(replyText)}</p>
         ${aiReply ? "" : '<p style="color:#c00;"><strong>⚠ AI was unavailable — a human reply is needed.</strong></p>'}`,
      ),
    });

    await ctx.runMutation(internal.support.recordReply, {
      ticketId,
      status: aiReply ? "ai_replied" : "needs_human",
      aiReply: replyText,
    });
  },
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
