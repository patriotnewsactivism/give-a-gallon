# PayPal payments — setup

Give a Gallon can route donations through **PayPal** instead of Stripe. This is
the backup processor for when Stripe is unavailable. It uses the
**central-account model**: donations are captured into the platform's PayPal
business account, and creators are paid out separately (see "Paying creators").

## How it works

```
Donor picks gallons
   │  paypal.createOrder  → creates a PayPal order, redirects to PayPal
   ▼
Donor approves on PayPal
   │  returns to /donation-success?provider=paypal&token=ORDER_ID
   ▼
paypal.captureOrder  → captures funds, marks donation completed, emails both sides
   (│ /paypal-webhook PAYMENT.CAPTURE.COMPLETED is a backup if the donor closes the tab)
```

Money lands in your PayPal balance **near-instantly** on capture. You then
transfer to your bank (PayPal instant transfer to a debit card is typically
minutes for ~1.5%, or standard bank transfer in ~1 business day for free).

## 1. Create PayPal REST app credentials

1. Go to https://developer.paypal.com/dashboard/applications/live (use the
   **Live** tab, not Sandbox, for real money).
2. Create an app → copy the **Client ID** and **Secret**.

## 2. Set Convex env vars (prod)

```bash
cd C:\give-a-gallon
npx convex env set PAYPAL_CLIENT_ID     <client-id>     --prod
npx convex env set PAYPAL_CLIENT_SECRET <secret>        --prod
npx convex env set PAYPAL_ENV           live            --prod
# SITE_URL should already be set to https://www.giveagallon.org
```

(For testing first, use Sandbox credentials and set `PAYPAL_ENV=sandbox`.)

## 3. Configure the webhook (recommended backup)

1. In the PayPal app settings → **Webhooks** → Add webhook.
2. URL: `https://aware-sandpiper-557.convex.site/paypal-webhook`
3. Subscribe to event: **Payment capture completed**
   (`PAYMENT.CAPTURE.COMPLETED`).
4. Copy the **Webhook ID** PayPal generates and set it:
   ```bash
   npx convex env set PAYPAL_WEBHOOK_ID <webhook-id> --prod
   ```
   With this set, the webhook signature is verified. (If unset, the webhook
   still works but is unverified — the synchronous capture is the primary path.)

## 4. Turn PayPal on for the frontend

In Vercel project settings → Environment Variables:

```
VITE_PAYMENT_PROVIDER = paypal
```

Redeploy the frontend. The donate button now routes through PayPal. To switch
back to Stripe, set it to `stripe` (or remove it) and redeploy — no code change.

## 5. Deploy the backend

```bash
cd C:\give-a-gallon
npx convex deploy -y
```

## Paying creators (payouts)

In the central-account model the platform holds the funds and pays creators out.
Options:
- **Manual (launch fast):** use the admin donation views to see what each
  creator is owed and send PayPal payments by hand.
- **Automated (next step):** PayPal **Payouts API** can push funds to creators'
  PayPal accounts near-instantly. This is the equivalent of Stripe Connect and
  can be added with a `paypal.createPayout` action when you're ready — say the
  word and it can be wired up.

## Notes / caveats

- PayPal also reviews high-volume new accounts and can place holds or reserves;
  the on-site refund/donation policy + donor confirmation emails are your best
  protection (same as for Stripe).
- The `donations` schema now carries `paypalOrderId` and `paypalCaptureId`
  alongside the existing Stripe fields, so both processors can coexist.
