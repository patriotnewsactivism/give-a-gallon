# Give a Gallon

Give a Gallon is a crowdfunding platform centered on a simple unit of support: a gallon of fuel.

## Stack

- React 19 + Vite
- Supabase Postgres, Auth, Storage, Row Level Security, and Edge Functions
- Vercel hosting
- PayPal checkout/payout integration through Supabase Edge Functions

## Local development

Copy `.env.example` to `.env.local` and set the public Supabase client values:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Then run:

```bash
npm install
npm run dev
```

## Production

The production database is Supabase project `mbghcswcssyzzycalbit`. Database migrations are kept under `supabase/migrations/`, and server-side payment logic lives under `supabase/functions/`.

Do not commit PayPal, email, or service-role secrets. Configure server-side secrets in Supabase before enabling payment or email workflows.
