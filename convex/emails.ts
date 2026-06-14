/**
 * give-a-gallon — transactional email helpers (Resend)
 * Called from stripe.ts (webhooks) and subscriptions.ts
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

const FROM = "Give-A-Gallon <fuel@fuel.wtpnews.org>";
const SITE = "https://fuel.wtpnews.org";
const FUEL_COLOR = "#f97316";

// ── Shared HTML wrapper ───────────────────────────────────────────────────────

function wrap(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:${FUEL_COLOR};border-radius:12px;padding:10px 18px;">
        <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;">⛽ GIVE-A-GALLON</span>
      </div>
    </div>
    <!-- Body -->
    <div style="background:#141414;border:1px solid #222;border-radius:16px;overflow:hidden;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#555;font-size:12px;margin:0;">
        © Give-A-Gallon · <a href="${SITE}" style="color:${FUEL_COLOR};text-decoration:none;">fuel.wtpnews.org</a>
      </p>
      <p style="color:#444;font-size:11px;margin:6px 0 0;">
        Part of the <a href="https://wtpnews.org" style="color:#555;text-decoration:none;">We The People News</a> network
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Core send helper ─────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

function donationReceivedHtml({
  creatorName, donorName, gallons, amountDollars, message, creatorSlug,
}: { creatorName: string; donorName: string; gallons: number; amountDollars: string; message?: string; creatorSlug: string }) {
  return wrap(`
    <div style="padding:28px 28px 0;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">
        ⛽ You just got fueled!
      </h1>
      <p style="color:#888;font-size:14px;margin:0 0 20px;">Someone just gave your campaign a gallon — here's what happened.</p>
    </div>
    <div style="background:#${FUEL_COLOR}18;border-top:2px solid ${FUEL_COLOR};margin:0 28px;border-radius:10px;padding:18px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:${FUEL_COLOR};font-size:28px;font-weight:900;">${gallons} gallon${gallons !== 1 ? "s" : ""}</div>
          <div style="color:#aaa;font-size:13px;">from ${donorName}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:#fff;font-size:20px;font-weight:700;">${amountDollars}</div>
          <div style="color:#555;font-size:11px;">after 5% platform fee</div>
        </div>
      </div>
      ${message ? `<div style="margin-top:14px;padding:12px;background:#0a0a0a;border-radius:8px;border-left:3px solid ${FUEL_COLOR};color:#ccc;font-size:13px;font-style:italic;">"${message}"</div>` : ""}
    </div>
    <div style="padding:0 28px 28px;">
      <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 20px;">
        This fuel goes directly to your campaign. Post an impact update to show supporters where it's going — creators who post updates consistently get 3× more recurring donations.
      </p>
      <a href="${SITE}/${creatorSlug}" style="display:inline-block;background:${FUEL_COLOR};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">
        Post an Impact Update →
      </a>
    </div>
  `);
}

function donationConfirmationHtml({
  donorName, gallons, amountDollars, creatorName, creatorSlug, estimatedMiles,
}: { donorName: string; gallons: number; amountDollars: string; creatorName: string; creatorSlug: string; estimatedMiles: number }) {
  return wrap(`
    <div style="padding:28px 28px 0;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">
        Thank you, ${donorName}! ⛽
      </h1>
      <p style="color:#888;font-size:14px;margin:0 0 20px;">Your fuel is on the way. Here's your giving receipt.</p>
    </div>
    <div style="background:#141a14;border-top:2px solid #22c55e;margin:0 28px;border-radius:10px;padding:18px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Campaign</td><td style="color:#fff;font-size:13px;text-align:right;font-weight:600;">${creatorName}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Gallons Given</td><td style="color:${FUEL_COLOR};font-size:13px;text-align:right;font-weight:700;">${gallons} gal</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Amount</td><td style="color:#fff;font-size:13px;text-align:right;">${amountDollars}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Est. Miles Fueled</td><td style="color:#22c55e;font-size:13px;text-align:right;">~${estimatedMiles} miles</td></tr>
      </table>
    </div>
    <div style="padding:0 28px 28px;">
      <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 20px;">
        You'll see impact updates from ${creatorName} on your personal impact page as they use your fuel.
      </p>
      <a href="${SITE}/my-impact" style="display:inline-block;background:#1a1a1a;border:1px solid #333;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;margin-right:10px;">
        View My Impact →
      </a>
      <a href="${SITE}/${creatorSlug}" style="display:inline-block;color:${FUEL_COLOR};text-decoration:none;padding:12px 0;font-weight:600;font-size:14px;">
        See Campaign
      </a>
    </div>
  `);
}

function subscriptionConfirmedHtml({
  donorName, tierName, gallonsPerMonth, amountDollars, nextBillingDate,
}: { donorName: string; tierName: string; gallonsPerMonth: number; amountDollars: string; nextBillingDate: string }) {
  return wrap(`
    <div style="padding:28px 28px 0;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">
        Welcome to the movement, ${donorName}! 🏆
      </h1>
      <p style="color:#888;font-size:14px;margin:0 0 20px;">Your monthly membership is active. You're now part of the backbone of the fight.</p>
    </div>
    <div style="background:#1a1200;border-top:2px solid ${FUEL_COLOR};margin:0 28px;border-radius:10px;padding:18px;margin-bottom:20px;">
      <div style="color:${FUEL_COLOR};font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:8px;">YOUR PLAN</div>
      <div style="color:#fff;font-size:20px;font-weight:800;margin-bottom:4px;">${tierName}</div>
      <div style="color:#aaa;font-size:13px;">${amountDollars}/month · ${gallonsPerMonth} gallon${gallonsPerMonth !== 1 ? "s" : ""}/month</div>
      <div style="margin-top:14px;color:#666;font-size:12px;">Next billing: ${nextBillingDate}</div>
    </div>
    <div style="padding:0 28px 28px;">
      <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 20px;">
        Each month your gallons are distributed to campaigns you choose. Visit your dashboard to allocate fuel or let us auto-distribute to the most urgent campaigns.
      </p>
      <a href="${SITE}/dashboard" style="display:inline-block;background:${FUEL_COLOR};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">
        Go to Dashboard →
      </a>
    </div>
  `);
}

function subscriptionCanceledHtml({
  donorName, tierName, endDate,
}: { donorName: string; tierName: string; endDate: string }) {
  return wrap(`
    <div style="padding:28px;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px;">Membership canceled</h1>
      <p style="color:#888;font-size:14px;margin:0 0 20px;">We're sorry to see you go, ${donorName}.</p>
      <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:20px;">
        <div style="color:#aaa;font-size:13px;">Your <strong style="color:#fff;">${tierName}</strong> membership will remain active until <strong style="color:#fff;">${endDate}</strong>.</div>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 20px;">
        You can still make one-time donations anytime. If you change your mind, reactivate from your dashboard.
      </p>
      <a href="${SITE}/membership" style="display:inline-block;background:#1a1a1a;border:1px solid #333;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">
        Reactivate Membership →
      </a>
    </div>
  `);
}

// ── Exported Convex internal actions ──────────────────────────────────────────

export const sendDonationReceived = internalAction({
  args: {
    creatorEmail: v.string(),
    creatorName: v.string(),
    creatorSlug: v.string(),
    donorName: v.string(),
    gallons: v.number(),
    amountCents: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const amountDollars = `$${(args.amountCents / 100).toFixed(2)}`;
    await send(
      args.creatorEmail,
      `⛽ ${args.donorName} just gave ${args.gallons} gallon${args.gallons !== 1 ? "s" : ""}!`,
      donationReceivedHtml({
        creatorName: args.creatorName,
        donorName: args.donorName,
        gallons: args.gallons,
        amountDollars,
        message: args.message,
        creatorSlug: args.creatorSlug,
      }),
    );
  },
});

export const sendDonationConfirmation = internalAction({
  args: {
    donorEmail: v.string(),
    donorName: v.string(),
    gallons: v.number(),
    amountCents: v.number(),
    creatorName: v.string(),
    creatorSlug: v.string(),
  },
  handler: async (_ctx, args) => {
    const amountDollars = `$${(args.amountCents / 100).toFixed(2)}`;
    const estimatedMiles = Math.round(args.gallons * 30);
    await send(
      args.donorEmail,
      `Your ${args.gallons} gallon${args.gallons !== 1 ? "s" : ""} are fueling ${args.creatorName} ⛽`,
      donationConfirmationHtml({
        donorName: args.donorName,
        gallons: args.gallons,
        amountDollars,
        creatorName: args.creatorName,
        creatorSlug: args.creatorSlug,
        estimatedMiles,
      }),
    );
  },
});

export const sendSubscriptionConfirmed = internalAction({
  args: {
    donorEmail: v.string(),
    donorName: v.string(),
    tierName: v.string(),
    gallonsPerMonth: v.number(),
    amountCents: v.number(),
    currentPeriodEndMs: v.number(),
  },
  handler: async (_ctx, args) => {
    const amountDollars = `$${(args.amountCents / 100).toFixed(2)}`;
    const nextBillingDate = new Date(args.currentPeriodEndMs).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    await send(
      args.donorEmail,
      `Your ${args.tierName} membership is active ✦`,
      subscriptionConfirmedHtml({
        donorName: args.donorName,
        tierName: args.tierName,
        gallonsPerMonth: args.gallonsPerMonth,
        amountDollars,
        nextBillingDate,
      }),
    );
  },
});

export const sendSubscriptionCanceled = internalAction({
  args: {
    donorEmail: v.string(),
    donorName: v.string(),
    tierName: v.string(),
    currentPeriodEndMs: v.number(),
  },
  handler: async (_ctx, args) => {
    const endDate = new Date(args.currentPeriodEndMs).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    await send(
      args.donorEmail,
      "Your Give-A-Gallon membership has been canceled",
      subscriptionCanceledHtml({
        donorName: args.donorName,
        tierName: args.tierName,
        endDate,
      }),
    );
  },
});
