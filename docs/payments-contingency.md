# Payments Contingency Plan

Stripe has disabled payment acceptance for Give-A-Gallon pending a fraud
review. This document covers (a) how to export donation evidence and (b)
backup payment processors if Stripe is not reinstated.

## 1. Export donation evidence

Use the admin query `admin.exportDonationEvidence` (added for the Stripe
appeal). It returns a `summary` plus a `rows` array of every completed
donation with its Stripe Payment Intent ID.

A small Node helper to dump it to CSV:

```bash
# from the project root, against prod
npx convex run admin:exportDonationEvidence --prod > donations-evidence.json
```

(That requires being authenticated as the admin user; alternatively read the
data from the Convex dashboard Data tab → `donations` table → export.)

## 2. Backup processors (high-risk / donation friendly)

Stripe and most "instant onboarding" processors (Square, PayPal standard,
Braintree) treat brand-new crowdfunding/donation platforms as **high risk**.
Realistic options, roughly in order of fastest-to-launch:

| Option | Model | Pros | Cons |
|---|---|---|---|
| **PayPal Giving Fund / PayPal Donations** | Hosted donate button / API | Huge trust, fast | Can also freeze new high-volume accounts; donor needs PayPal-friendly flow |
| **Givebutter** | Hosted fundraising platform | Built for donations, no monthly fee, tipping model | Less control; you live on their pages, not fully white-label |
| **Donorbox** | Embeddable donation forms | Quick to embed, recurring built in | Platform fee; still rides on Stripe/PayPal underneath |
| **Helcim** | Real merchant account | Transparent interchange-plus pricing, good support | Underwriting takes days; still risk-reviews crowdfunding |
| **Authorize.net + high-risk merchant account** (via an ISO/MSP like PaymentCloud, Durango, Soar Payments) | True high-risk merchant account | Built specifically for high-risk/crowdfunding; stable once approved | Higher fees, rolling reserve, underwriting takes 1–2 weeks |

### Recommendation
- **Short term (days):** stand up **Givebutter** or **Donorbox** so creators
  can keep receiving support while Stripe is resolved. These are the fastest to
  go live and are purpose-built for donations.
- **Long term (stable):** apply for a **dedicated high-risk merchant account**
  (PaymentCloud / Soar Payments / Durango) paired with Authorize.net. Expect a
  rolling reserve (e.g. 5–10% held for 90–180 days) — that is normal for the
  category and is exactly the protection that makes them tolerate the risk
  Stripe just rejected.

### What underwriters will want (prepare this once, reuse everywhere)
- Business registration / EIN.
- A clear refund & donation policy on the site (state that donations are
  generally non-refundable, how disputes are handled, contact for support).
- Terms of Service and Privacy Policy.
- A description of the donor flow showing consent (checkout screenshots,
  confirmation emails).
- Expected monthly volume and average transaction size.

## 3. Architecture impact

The current integration assumes Stripe Checkout + Stripe Connect (creators are
paid directly via Connect). A switch means:
- **Givebutter/Donorbox:** creators would need their own accounts on that
  platform, or funds route to a central account and you pay out manually. This
  breaks the automated Connect payout model — plan for manual/managed payouts
  initially.
- **High-risk merchant account + Authorize.net:** keeps the most control and
  can preserve a Connect-like split via a marketplace/sub-merchant setup, but is
  the heaviest lift.

Keep the `donations` schema and the Convex webhook pattern; only the
`convex/stripe.ts` checkout + webhook verification and `convex/connect.ts`
payout logic need a processor-specific replacement.
