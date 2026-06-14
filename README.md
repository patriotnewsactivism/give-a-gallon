# ⛽ Give-A-Gallon

> *"One gallon can change someone's day. Many gallons can change a life."*

**Give-A-Gallon** is a crowdsourcing and crowdfunding platform built for people who are always on the go — activists, journalists, veterans, content creators, and families fighting for something bigger than themselves.

Built by **[We The People News](https://www.wtpnews.org)** · Sister platform to **[Civil Rights Hub](https://www.civilrightshub.org)** · Live at **[fuel.wtpnews.org](https://fuel.wtpnews.org)**

---

## Why We Built This

This platform was born out of a real problem. Being on the road constantly — covering stories, getting to hearings, filing records requests, showing up where it matters — costs money most people simply don't have.

We needed a way for supporters to fuel the work directly, instantly, and transparently. Not a generic GoFundMe. Not a tipping jar. Something built specifically for people in motion, doing work that matters.

**We built Give-A-Gallon because we needed it. In solving it for ourselves, we believe we've solved it for many.**

---

## What It Is

Give-A-Gallon reframes donations as **fuel** — because that's exactly what they are. Every gallon ($4.25) is a unit of real-world impact: miles driven, records filed, hearings attended, stories published.

The platform is built around three core principles:

- **Proof over promises** — Creators post impact updates tied to donations. Donors see exactly what their gallons made possible.
- **Trust through verification** — A 5-tier system (Unverified → Community → Journalist → Organization → Platform Verified) so donors know who they're fueling.
- **Instant access** — Creator payouts via Stripe Connect Express. No waiting weeks to access your funds.

---

## Platform Features

### For Creators / Campaigners
- Campaign profile with urgency levels (Active / Urgent / Emergency)
- Fuel gauge showing progress toward gallon goals
- Milestone tracker — set targets, mark them complete as funding hits
- Post campaign updates with impact tags (✦ Records filed, ✦ Case won, etc.)
- Stripe Connect Express onboarding for instant payouts
- 5% transparent platform fee — shown upfront on every donation

### For Donors
- Browse campaigns by category: Fuel Assistance, Veterans, Investigative Journalism, Legal Defense, Border & Immigration, Faith & Community, Family Crisis, Activism & Protest
- One-click donation with fee breakdown shown before checkout
- Social proof ticker — see real-time giving activity across the platform
- Full share toolkit on every campaign: Twitter, Facebook, SMS, native share, copy link
- Donation success page with impact summary and viral share prompt

### Platform-Wide
- Deep-dark, high-contrast UI — mobile-first, built for people on the go
- Real-time transparency dashboard (`/impact`) — total gallons funded, recipients helped, platform activity
- Membership tiers (`/membership`) — recurring monthly giving (Fuel Supporter → Impact Champion)
- Social proof notification bar — rotating live donation feed on all public pages

---

## Verification Tiers

| Tier | Badge | Description |
|------|-------|-------------|
| Unverified | ⬜ | Self-registered, no verification |
| Community | 🔵 | Community vouched, basic identity confirmed |
| Journalist | 🟣 | Press credentials or publication verified |
| Organization | 🟠 | Registered nonprofit or media organization |
| Platform Verified | 🟢 | Fully vetted by Give-A-Gallon team |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend | Convex (real-time DB, auth, file storage, scheduled functions) |
| Auth | Convex Auth (email/password) |
| Payments | Stripe + Stripe Connect Express |
| Deployment | Vercel → `fuel.wtpnews.org` |
| Package Manager | Bun |

---

## Getting Started (Dev)

```bash
# Install dependencies
bun install

# Start Convex backend (watches for changes)
bunx convex dev

# In another terminal, start frontend
bun run dev
```

### One-shot commands (CI / agents)

```bash
# Push Convex functions + build frontend
bun run sync:build

# Fetch recent backend logs
bun run logs:fetch
```

---

## Project Structure

```
├── convex/
│   ├── schema.ts          # Full DB schema (creators, donations, updates, milestones)
│   ├── creators.ts        # Creator CRUD, profile queries
│   ├── donations.ts       # Donation logic, live feed, success page lookup
│   ├── stripe.ts          # Stripe checkout + Connect Express onboarding
│   ├── updates.ts         # Campaign update posts
│   ├── milestones.ts      # Milestone tracking
│   ├── platform.ts        # Platform-wide stats (impact dashboard)
│   └── auth.ts            # Auth config
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx        # Hero, category grid, founder story, WhoItsFor
│   │   ├── ExplorePage.tsx        # Campaign discovery + filtering
│   │   ├── CreatorProfilePage.tsx # Full campaign profile with updates + milestones
│   │   ├── DashboardPage.tsx      # Creator dashboard — stats, fuel gauge, updates
│   │   ├── SettingsPage.tsx       # Profile settings, Stripe Connect onboarding
│   │   ├── ImpactPage.tsx         # Transparency dashboard
│   │   ├── MembershipPage.tsx     # Recurring giving tiers
│   │   └── DonationSuccessPage.tsx # Post-donation impact + share prompt
│   ├── components/
│   │   ├── ShareSheet.tsx         # Twitter/FB/SMS/native share + copy link
│   │   ├── SocialProofBar.tsx     # Floating live donation ticker
│   │   ├── DonationTicker.tsx     # Inline live feed (profile pages)
│   │   ├── FuelGauge.tsx          # SVG goal progress gauge
│   │   └── ...
│   └── App.tsx
```

---

## Roadmap

### ✅ Phase 1 — Foundation
- Verification system, campaign categories, impact dashboard, schema expansion

### ✅ Phase 2 — Impact Engine
- Campaign updates with impact tags, milestone tracker, creator dashboard, urgency levels

### ✅ Phase 3 — Growth & Viral
- Donation success share prompt, membership tiers, social proof bar, share toolkit, founder story

### 🔜 Phase 4 — Donor Dashboard
- Personal `/my-impact` page: every gallon donated → campaign → outcome
- Recurring subscription billing via Stripe
- Referral links + viral loop tracking

### 🔜 Phase 5 — Network & Discovery
- Cross-promotion with WTP News and Civil Rights Hub
- Featured campaigns, editorial picks, verified journalist spotlights

---

## The Network

Give-A-Gallon is part of a growing independent media and advocacy ecosystem:

- **[We The People News](https://www.wtpnews.org)** — Independent news, on the ground
- **[Civil Rights Hub](https://www.civilrightshub.org)** — Civil rights resources and advocacy
- **[Give-A-Gallon](https://fuel.wtpnews.org)** — Fuel the people doing the work

---

## License

Private — © We The People News. All rights reserved.
