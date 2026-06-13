# Surflow — Scratchpad

> Session-to-session context for Claude. Update this file as tasks are completed, decisions are made, or blockers arise.

**Last updated**: 2026-06-13
**Current phase**: Personal Planner v1 — SHIPPED (parallel track to the main app phases below)
**Estimated timeline**: 3–4 day build

---

## ⭐ East Bali Personal Session Planner (v1 — built 2026-06-13)

A standalone, Claude-Code-native tool for planning Yahya's solo East Bali sessions and learning surf science. Deliberately **lightweight** (no DB/Redis/Vercel cron) and modular so an openclaw/WhatsApp adapter can wrap it later. This is a parallel track to the main 6-phase app build below.

**What exists:**
- `packages/surf-engine/` — pure, adapter-agnostic engine. Public API: `planSessions()`, `scoreWindow()`, `loadKnowledgeBase()`, `formatPlan()`. 13 vitest tests pass.
  - `knowledge/spots/*.spot.ts` — 6 spots (Keramas Peak/Car Park, Cucukan, Klotok's Right, Kubur, Lembang) encoded as `SurfRules` with **provenance** (verbatim Julien quotes + msg refs) reverse-engineered from 342 WhatsApp messages.
  - `knowledge/calibration.ts` — tide datum calibration from Julien's quoted tide-height pairs.
  - `forecast/` — Open-Meteo Marine + Weather clients (free, no key), tide module, file cache (`~/.surflow/cache`), normalizer. `http.ts` falls back to `curl` when undici can't connect.
  - `scoring/` — hard safety gate (tide ≥ min + uncertainty buffer) → 0–100 weighted quality score → human "why" citing Julien.
  - `planner/` — daylight-filtered, per-spot, ranked day/week plan.
- `apps/cli/` — `surf plan | check | spots | calibrate` (run: `cd apps/cli && pnpm exec tsx src/index.ts <cmd>`).
- `.claude/commands/surf-plan.md` — `/surf-plan` skill (adapter). `.claude/commands/surf-extract-rules.md` — re-runnable Julien extraction.

**Verified end-to-end:** live Open-Meteo plan renders; `surf check keramas-carpark --tide 1.3 --rising` → ⛔ (matches Julien "wait until 1.5m"); at 1.8m → clean.

**Next for this track:**
- Get a `WORLDTIDES_API_KEY` (paid, cheap) → run `surf calibrate` to backfill `worldtidesM` samples → harmonic-grade tide replaces the degraded Open-Meteo fallback.
- Phase 2 enrichment (deferred): GEBCO bathymetry / wave refraction; webcams; then DB/Redis/cron only if multi-user.
- openclaw/WhatsApp adapter wraps `planSessions()` (engine already returns ready-to-send `summary` strings).

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
| 2026-06-13 | Personal planner = lightweight `packages/surf-engine` + CLI + skill; **no** DB/Redis/Vercel cron in v1 (overrides CLAUDE.md instincts) | User wants a Claude-Code tool first, "relatively simple"; forward-compatible with the heavy stack later |
| 2026-06-13 | Wire **both** tide sources (WorldTides + Open-Meteo), calibrate against Julien's quotes, lock lower-residual as primary | Tide is the safety-critical input; user willing to pay for accuracy |
| 2026-06-13 | Open-Meteo tide is a **degraded fallback only** (RMS ~0.15m, max ~0.24m vs Julien) — add a safety buffer; WorldTides should be primary | Empirical: May 28 vs 31 mornings gave ~identical OM sea-level (1.28/1.275m) but Julien quoted 2.40 vs 2.00m — irreducible by affine fit |
| 2026-06-13 | Defer GEBCO bathymetry/refraction to phase 2 | Julien's empirical tide minimums already capture the safety-critical reef behaviour |
| 2026-06-13 | Knowledge base = versioned `*.spot.ts` with per-rule **provenance** (Julien quote + msg ref) | Powers the learning goal — every recommendation cites its source; keeps safety data in git, not a DB |

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
