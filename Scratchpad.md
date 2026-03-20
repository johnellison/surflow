# Surflow — Scratchpad

> Session-to-session context for Claude. Update this file as tasks are completed, decisions are made, or blockers arise.

**Last updated**: 2026-03-20
**Current phase**: Phase 0 — Foundation
**Estimated timeline**: 3–4 day build

---

## Quick Context

Surflow is a cross-platform surf lifestyle app (React Native via Expo + Next.js web) combining real-time forecasts, webcams, guided PT/recovery, and a local coach marketplace. Target markets: Morocco and Bali. Target users: intermediate-to-advanced surfers.

**Tech stack**: Turborepo monorepo, Expo (mobile), Next.js 16 (web), Hono API, Neon Postgres + Drizzle, Upstash Redis, Vercel Blob, Stripe Connect, Clerk/Supabase Auth, PostHog analytics.

---

## Phase 0: Foundation
> Goal: Monorepo scaffold, DB schema, shared types, skeleton apps.

- [ ] **0.1** Initialize Turborepo monorepo with all workspaces (`apps/mobile`, `apps/web`, `packages/core`, `packages/ui`, `packages/api-client`, `services/api`)
  - `turbo build` runs across all workspaces without error
- [ ] **0.2** Define shared TypeScript types + Zod schemas in `packages/core/types`
  - Types: Spot, Forecast, Exercise, Coach, User, Session, Booking, Review, Message
- [ ] **0.3** Set up Postgres (Neon) + Drizzle ORM in `services/api/db`
  - All tables created via migration, seed script populates test data
- [ ] **0.4** Set up Expo project with file-based routing + 5-tab navigation skeleton
  - Tabs: Forecast, Cams, PT, Coaches, Profile
- [ ] **0.5** Set up Next.js web app with App Router — `(marketing)` and `(app)` route groups
  - Marketing landing page + auth-gated app shell

---

## Phase 1: Forecast Core (MVP Differentiator)
> Goal: Working surf forecast from real data, displayed in both apps.

- [ ] **1.1** Build forecast data source integrations (NOAA/NDBC, Open-Meteo, Copernicus)
- [ ] **1.2** Implement forecast normalization + surf rating engine (`packages/core/forecast`)
- [ ] **1.3** Build forecast API endpoints (`GET /spots/:id/forecast`, `GET /spots`)
- [ ] **1.4** Build forecast poller background job
- [ ] **1.5** Curate initial spot database — Morocco (15–20 spots), Bali (15–20 spots)
- [ ] **1.6** Build `ForecastCard` and `SpotCard` shared UI components
- [ ] **1.7** Integrate forecast display into mobile (Forecast tab) + web (`/forecast`)

---

## Phase 2: Webcams & Visual Context
> Goal: Live webcam feeds paired with forecast data.

- [ ] **2.1** Research + integrate webcam sources for Morocco and Bali (min 5 feeds/region)
- [ ] **2.2** Build webcam metadata service + stream proxy
- [ ] **2.3** Build webcam viewer component with forecast overlay
- [ ] **2.4** Build time-lapse / rewind feature (server-side snapshot storage)
- [ ] **2.5** Integrate webcam views into mobile (Webcams tab) + web (`/webcams`)

---

## Phase 3: Physical Therapy & Recovery
> Goal: Surf-specific PT library with guided routines. Can start in parallel with Phase 2.

- [ ] **3.1** Source + curate exercise library (20–30 surf-specific exercises)
- [ ] **3.2** Build PT content API (exercises, routines, progress)
- [ ] **3.3** Build routine suggestion engine (`packages/core/pt`)
- [ ] **3.4** Build `ExerciseCard` and `TimerView` shared UI components
- [ ] **3.5** Build guided routine flow (exercise sequence, timers, transitions, progress)
- [ ] **3.6** Build progress tracking (calendar heatmap, streaks, body-area chart)
- [ ] **3.7** Integrate into mobile (Recovery tab) + web (`/recovery`)

---

## Phase 4: Coach Marketplace
> Goal: Two-sided marketplace — discovery, booking, payment, reviews.

- [ ] **4.1** Build coach profile system (registration, CRUD, verification workflow)
- [ ] **4.2** Build coach search + discovery API
- [ ] **4.3** Integrate Stripe Connect for coach payouts (85/15 split)
- [ ] **4.4** Build booking system (availability, instant booking, cancellation)
- [ ] **4.5** Build in-app messaging (surfer ↔ coach)
- [ ] **4.6** Build review + rating system
- [ ] **4.7** Build `CoachCard`, booking flow UI, messaging UI components
- [ ] **4.8** Integrate into mobile (Coaches tab) + web (`/coaches`)

---

## Phase 5: Session Logging & Connectivity
> Goal: Tie the loop — log sessions, trigger recovery, build history.

- [ ] **5.1** Build session logging API + UI (quick-log + detailed log)
- [ ] **5.2** Auto-suggest spot from GPS, auto-fill conditions from forecast
- [ ] **5.3** Session-to-recovery trigger (post-session push → PT routine)
- [ ] **5.4** Personal stats dashboard (sessions, spots surfed, recovery consistency)

---

## Phase 6: Polish & Launch Prep
> Goal: Notifications, offline, analytics, App Store, marketing site.

- [ ] **6.1** Unified push notification system (APNs + web push)
- [ ] **6.2** Offline support (forecast cache, spot metadata, PT video downloads)
- [ ] **6.3** Analytics integration (PostHog)
- [ ] **6.4** Marketing landing page
- [ ] **6.5** App Store submission (iOS)
- [ ] **6.6** Onboard initial coach cohort (10 Morocco, 10 Bali)

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| — | _none yet_ | — |

## Blockers

| Date | Blocker | Status |
|------|---------|--------|
| — | _none yet_ | — |

## Notes

- Phases 2 and 3 can run in parallel (both depend on Phase 0, not each other)
- Phase 4 depends on Phase 1 (auth + core infra must be stable)
- Stripe Connect availability in Morocco and Indonesia needs early validation
- iOS-first for mobile; Android is Expo-capable but scope TBD
- Open questions from PRD: monetization model, coach vetting rigor, localization scope
