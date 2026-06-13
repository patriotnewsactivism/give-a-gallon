import { query } from "./_generated/server";

// TEMPORARY diagnostic — reports only the PRESENCE (never the values) of the
// Stripe env vars so we can confirm the webhook secret is configured. Removed
// immediately after verification.
export const checkStripeEnv = query({
  args: {},
  handler: async () => ({
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasSiteUrl: !!process.env.SITE_URL,
  }),
});
