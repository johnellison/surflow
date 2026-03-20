# Surflow — Claude Code Guidelines

## Project Overview

Cross-platform surf lifestyle app: real-time forecasts, webcams, guided PT/recovery, and a local coach marketplace. Target: intermediate-to-advanced surfers in Morocco and Bali.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo (pnpm workspaces) |
| Mobile | Expo (React Native) + Expo Router |
| Web | Next.js 16 (App Router) |
| Shared UI | React Native Web / Tamagui |
| API | Hono (Node.js) → Vercel Functions |
| Database | Neon Postgres + Drizzle ORM |
| Cache | Upstash Redis |
| File Storage | Vercel Blob |
| Payments | Stripe Connect (85% coach / 15% platform) |
| Auth | Clerk (Apple Sign-In, Google OAuth) |
| Push | Expo Notifications + web-push |
| Analytics | PostHog |
| CI/CD | GitHub Actions + Vercel + EAS Build |

## Workspace Map

```
surflow/
├── apps/mobile/          # Expo (React Native) — iOS app
├── apps/web/             # Next.js 16 — web app + marketing
├── packages/core/        # Shared business logic + types + Zod schemas
├── packages/ui/          # Shared React components (cross-platform)
├── packages/api-client/  # Typed HTTP client + SWR hooks
├── services/api/         # Hono backend (routes, DB, jobs, integrations)
└── Scratchpad.md         # Session-to-session task tracker — UPDATE AS YOU GO
```

## Session Protocol

1. **Start of session**: Read `Scratchpad.md` for current phase, completed tasks, blockers, and decisions.
2. **During work**: Check off tasks in `Scratchpad.md` as they're completed. Add decisions and blockers as they arise.
3. **End of session**: Update `Scratchpad.md` with progress, any context the next session needs.

## Instincts — Automatic Skill Triggers

Claude MUST follow these instincts. When a trigger condition is detected, invoke the corresponding skill BEFORE writing code. Do not ask the user — just do it.

### Database Instinct
**Detects**: User asks to "create a table", "add an entity", "define the schema for X", or a task involves a new data model. Also triggers when you're about to write a file in `services/api/db/schema/`.
**Action**: Run `/drizzle-schema` first. Never hand-write a Drizzle schema, Zod type, or seed file individually — the skill keeps them synchronized.
**Chain**: After `/drizzle-schema` completes, if the entity needs API access (almost always), automatically proceed to `/hono-crud`.

### API Instinct
**Detects**: User asks to "build the X API", "add endpoints for X", "create routes for X", or a task involves CRUD operations on an entity. Also triggers when you're about to write a file in `services/api/routes/`.
**Action**: Run `/hono-crud`. If the entity's Drizzle schema doesn't exist yet, run `/drizzle-schema` first.
**Chain**: After `/hono-crud` completes, if the feature needs a UI (check the task), automatically proceed to `/screen-scaffold`.

### Screen Instinct
**Detects**: User asks to "build the X tab", "create the X page", "add the X screen", or a task mentions both mobile and web for a feature. Also triggers when you're about to create files in both `apps/mobile/` and `apps/web/` for the same feature.
**Action**: Run `/screen-scaffold`. Always generate both platforms together — never build mobile-only or web-only unless explicitly asked.

### Integration Instinct
**Detects**: User asks to "integrate X API", "pull data from X", "connect to X service", or a task involves fetching from an external data source (NOAA, Open-Meteo, Copernicus, webcam feeds, etc.). Also triggers when you're about to write a file in `services/api/integrations/`.
**Action**: Run `/external-api`. Always includes retry logic, cache layer, and normalizer — never write a raw fetch to an external API.

### Scratchpad Instinct
**Detects**: A task is completed, a decision is made, a blocker is encountered, or a session is ending.
**Action**: Update `Scratchpad.md` immediately. Check off completed tasks. Add decisions to the Decisions Log. Add blockers to the Blockers table. This is non-negotiable — the Scratchpad is the cross-session lifeline.

### Full-Feature Chain
When a task spans the full stack (e.g., "build the coach marketplace"), Claude should automatically chain skills in this order without waiting for the user to request each step:

```
detect new entities → /drizzle-schema (for each entity)
         ↓
detect API needed  → /hono-crud (for each entity)
         ↓
detect UI needed   → /screen-scaffold (for each screen)
         ↓
detect external data → /external-api (if applicable)
         ↓
update progress    → Scratchpad.md
```

### Instinct Overrides
- If the user says "just the schema" or "only the API" — stop the chain at that step.
- If files already exist for a step — read them first, then extend rather than regenerate.
- If you're unsure whether to chain — chain. It's faster to generate and discard than to wait for the user to ask.

## Custom Skills Reference

| Skill | Command | What It Generates |
|-------|---------|-------------------|
| Drizzle Schema | `/drizzle-schema` | Drizzle table + Zod schemas + TS types + seed data + barrel exports |
| Hono CRUD | `/hono-crud` | Route handlers + query helpers + validators + API client methods |
| Screen Scaffold | `/screen-scaffold` | Expo screen + Next.js page + shared UI component + SWR hook |
| External API | `/external-api` | Fetch client + normalizer + Redis cache + Drizzle upsert + poller job |

### Vercel Skill Instincts

These are pre-installed skills invoked via `Skill()`. Claude MUST proactively invoke them when the trigger condition matches — don't wait for the user to ask.

**Infrastructure & Setup**
| Instinct | Trigger | Skill |
|----------|---------|-------|
| Bootstrap | Starting the project, first `vercel link`, first `vercel env pull`, setting up workspaces | `bootstrap` |
| Turborepo | Editing `turbo.json`, adding workspace dependencies, configuring build pipeline, `--affected` flag | `turborepo` |
| Env Vars | Adding/removing env vars, `.env` files, `vercel env` commands, secrets management | `env-vars` |
| CLI | Any `vercel` CLI command — deploy, link, pull, dev, logs, domains | `vercel-cli` |

**Backend & Data**
| Instinct | Trigger | Skill |
|----------|---------|-------|
| Functions | Deploying Hono as Vercel Functions, configuring runtime, streaming responses, `maxDuration` | `vercel-functions` |
| Storage | Setting up Neon Postgres, Upstash Redis, or Vercel Blob; writing connection logic; configuring storage env vars | `vercel-storage` |
| Cron | Adding scheduled jobs to `vercel.json`, configuring `CRON_SECRET`, polling intervals | `cron-jobs` |
| Payments | Anything Stripe — Connect onboarding, checkout, webhooks, payouts, refunds, the 85/15 split | `payments` |
| Auth | Clerk setup, `clerkMiddleware()`, sign-in/sign-up flows, `proxy.ts` auth checks, protected routes | `auth` |

**Frontend & UI**
| Instinct | Trigger | Skill |
|----------|---------|-------|
| Next.js | Writing App Router pages, server components, server actions, `proxy.ts`, `'use cache'`, layouts, metadata | `nextjs` |
| shadcn | Installing/composing UI components for the web app, theming, `cn()` utility, Tailwind config | `shadcn` |
| SWR | Writing data-fetching hooks, `useSWR`, `useSWRMutation`, cache invalidation, optimistic UI | `swr` |
| React QA | After editing 3+ TSX component files in a session — run a quality check before moving on | `react-best-practices` |
| Design | Building marketing pages, polishing UI, creating layouts that need to look production-grade | `frontend-design` |

**Operations & Testing**
| Instinct | Trigger | Skill |
|----------|---------|-------|
| Deploy | Running `vercel deploy`, promoting to production, rollbacks, CI/CD pipeline config | `deployments-cicd` |
| Observe | Setting up PostHog, adding analytics events, debugging with logs, performance monitoring | `observability` |
| Browser Verify | After starting a dev server (`next dev`, `vercel dev`) — verify the page loads and renders correctly | `agent-browser-verify` |
| Verify E2E | User says "something's broken", "why isn't this working", or you need to verify a full feature flow | `verification` |
| Investigate | Stuck on a bug, something hangs, deploy fails, logs show errors | `investigation-mode` |

**Instinct Priority**: When multiple instincts match, prefer the more specific one. E.g., if you're setting up Neon Postgres via `vercel integration add`, use `vercel-storage` (specific) over `vercel-cli` (general).

## Code Conventions

- **IDs**: Use `cuid2` for all primary keys
- **Timestamps**: Always `createdAt` + `updatedAt` on every table
- **API responses**: `{ data, meta? }` for success, `{ error, message }` for errors
- **Validation**: Zod schemas in `packages/core/types/`, shared between API validation and client
- **Env vars**: Never hardcode. Use `.env.example` as documentation. Pull from Vercel.
- **Auth**: Clerk middleware on protected routes. Public routes explicitly marked.
- **Naming**: camelCase for TS, snake_case for DB columns, kebab-case for URLs

## Key Decisions (from PRD)

- Hono over tRPC: REST is better for public API surface (coach profiles, SEO). Type safety via shared Zod schemas.
- Expo over native Swift: Maximize code sharing with web. Single TS codebase.
- SWR for client data fetching on both mobile and web.
- Forecast data: poll hourly, cache aggressively, multi-source with graceful degradation.
- Coach payments: Stripe Connect with 24h hold after session completion.
