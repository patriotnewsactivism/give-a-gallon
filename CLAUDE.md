# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Give a Gallon** is a crowdfunding/donation platform for activists, journalists, and creators built on the "We The People News" (WTP News) network. Donors give "gallons of fuel" ($4.25/gallon) to creator campaigns. The platform lives at `www.giveagallon.org`.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI primitives)
- **Backend**: Convex (real-time database + serverless functions + file storage)
- **Auth**: `@convex-dev/auth` (JWT-based, email/password; no OAuth)
- **Payments**: Stripe Checkout + Stripe Connect (creators collect directly), webhooks verified with HMAC
- **Email**: Resend (`alerts@giveagallon.org`) via internal Convex actions
- **Linter/Formatter**: Biome (double quotes, 2-space indent, 80-char line width)
- **Package manager**: Bun
- **Deployment**: Vercel (frontend) + Convex cloud (backend); CI via GitHub Actions

## Commands

```bash
bun run dev          # start Vite dev server
bun run build        # tsc + vite build
bun run check        # biome check (lint + format check)
bun run format       # biome check --write (auto-fix)
bun run lint         # biome lint only
bun run typecheck    # tsc --noEmit

bun run sync         # push convex schema/functions to dev deployment (once)
bun run logs         # stream Convex function logs
bun run test         # run Playwright E2E tests (scripts/test.ts)
bun run test:auth    # test auth flow (scripts/auth.ts)
bun run test:demo    # run demo scenario (scripts/demo-test.ts)

bunx convex deploy -y   # deploy Convex backend to production
```

## Architecture

### Convex backend (`convex/`)

All server-side logic lives here. Key files:

| File | Purpose |
|------|---------|
| `schema.ts` | Single source of truth for all DB tables and indexes |
| `stripe.ts` | Checkout session creation, webhook handler (payments + subscriptions), HMAC verification |
| `http.ts` | HTTP routes: Stripe webhook (`/stripe-webhook`), public REST endpoints (`/api/recent-donations`, `/api/recent-creators`) |
| `auth.ts` / `auth.config.ts` | `@convex-dev/auth` setup; JWT domain set from `CONVEX_SITE_URL` |
| `emails.ts` | Transactional emails via Resend (donation received, donor confirmation, subscription confirmed/canceled) |
| `creators.ts` | Creator CRUD and queries |
| `donations.ts` | Donation queries, platform stats (materialized in `platformStats` table) |
| `subscriptions.ts` | Recurring membership logic |
| `referrals.ts` | Referral code tracking and crediting |
| `admin.ts` | Admin-only mutations |
| `notifications.ts` | Admin push notifications + per-user read receipts |
| `connect.ts` | Stripe Connect account status sync |

Business constants: **$4.25/gallon**, **5% platform fee** — defined in both `convex/stripe.ts` and `src/lib/constants.ts`.

### React frontend (`src/`)

```
src/
  App.tsx             # Route tree (PublicLayout + AppLayout + ProtectedRoute)
  main.tsx            # ConvexAuthProvider + BrowserRouter bootstrap
  pages/              # One file per route
  components/         # Shared components (domain + layout)
  components/ui/      # shadcn/ui primitives (treat as library, don't modify lightly)
  contexts/           # ThemeContext (dark-only, non-switchable)
  hooks/              # useReferral, useUploadFile, useInView, etc.
  lib/constants.ts    # GALLON_PRICE, PLATFORM_FEE_PCT, CATEGORIES, VERIFICATION_TIERS
```

Route structure (from `App.tsx`):
- **Public** (`PublicLayout`): `/`, `/explore`, `/impact`, `/membership`, `/leaderboard`, `/:slug` (creator profile), `/:slug/join` (firm onboarding)
- **Auth-only** (`ProtectedRoute` → `AppLayout`): `/dashboard`, `/settings`, `/my-impact`, `/referrals`
- **Admin** (separate, no layout): `/admin`

### Data model highlights

- `creators` — one per user, has `slug`, totals (`totalGallons`, `totalDonations`, `totalAmountCents`), Stripe Connect fields, verification status
- `donations` — status: `pending → completed | failed`; referral tracking via `referralCode`
- `platformStats` — single `key="global"` row updated on each `completeDonation` mutation (materialized counter)
- `subscriptions` — mirrors Stripe subscription lifecycle; `tierId` maps to membership tier slugs
- `notifications` + `notificationReads` — admin broadcasts with per-user read state

## Required Environment Variables

**Convex (set via `bunx convex env`)**:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SITE_URL` (e.g. `https://www.giveagallon.org`)
- `CONVEX_SITE_URL` (injected automatically by Convex)

**Vite (set in Vercel project settings)**:
- `VITE_CONVEX_URL` — the Convex deployment URL

## Key Conventions

- All Convex queries/mutations use `v` validators from `convex/values` — no untyped DB access
- Email failures are always non-fatal (wrapped in try/catch, log only) — they must never block payment completion
- `platformStats` is a materialized counter row, not computed on the fly; update it inside `completeDonation`
- Creator slugs are unique and used as public URL paths (`/:slug`)
- Stripe webhook signature verification is manual HMAC (no Stripe SDK) — see `verifyStripeSignature` in `convex/stripe.ts`

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
