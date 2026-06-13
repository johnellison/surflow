# 🏄 Surflow

A surf lifestyle monorepo. The shipped, working piece today is the **East Bali personal session planner** — a tool that plans solo surf sessions and explains the science behind the conditions.

It runs inside Claude Code (and a small CLI) now, and is built to be wrapped by a WhatsApp agent later.

## The surf planner

For six East Bali spots — **Keramas (The Peak / Car Park), Cucukan, Klotok's Right, Kubur, Lembang** — the planner pulls live swell/wind/tide, applies per-spot rules reverse-engineered from a surf coach's session history, and returns a ranked day/week plan with a plain-English *why* for each window.

```bash
cd apps/cli

# Plan the week
pnpm exec tsx src/index.ts plan --days 7

# "Is Car Park safe at 1.3m rising?" (replays the kind of question you'd text a coach)
pnpm exec tsx src/index.ts check keramas-carpark --tide 1.3 --rising --swell 1.3 --period 6

# List spots and their encoded rules / show tide calibration
pnpm exec tsx src/index.ts spots
pnpm exec tsx src/index.ts calibrate
```

Example:

```
Keramas — Car Park  (keramas-carpark)
07:00  ☆☆☆☆☆   0  1.3m @ 6s, wind 6kn, tide 1.30m rising ⛔
      ⛔ Tide 1.30m is below the 1.50m minimum for Keramas (Car Park) — reef too exposed.
```

### How it works

```
packages/surf-engine/        # pure, adapter-agnostic engine (no DB/server/UI)
  knowledge/spots/*.spot.ts  #   per-spot rules, each with provenance (a coach quote + msg ref)
  knowledge/calibration.ts   #   tide-datum calibration from quoted tide heights
  forecast/                  #   Open-Meteo Marine + Weather clients (free), tide, file cache
  scoring/                   #   safety gate (reef-exposure tide minimum) → 0–100 quality → "why"
  planner/                   #   daylight-filtered, ranked day/week plan
apps/cli/                    # thin `surf` CLI over the engine
.claude/commands/            # /surf-plan and /surf-extract-rules skills
```

**Design notes**

- **Safety first.** Every reef spot has a hard tide minimum; windows below it are excluded, not just down-ranked.
- **Tide accuracy.** Open-Meteo's modelled sea level is a *degraded fallback* here (it can't resolve the local tidal range to the ~0.2m safety margin), so readings carry a safety buffer. Set `WORLDTIDES_API_KEY` for harmonic-grade tide, then run `surf calibrate`.
- **Explainable.** Recommendations cite the rule they leaned on, so the tool teaches as it plans.
- **Modular.** The engine returns ready-to-send summaries; a WhatsApp/agent adapter is a thin wrapper.

### Develop

```bash
pnpm install
pnpm --filter @surflow/surf-engine test       # 13 tests
pnpm --filter @surflow/surf-engine typecheck
```

## The broader app

`apps/`, `packages/`, and `services/api/` scaffold a cross-platform surf app (Expo + Next.js + Hono + Drizzle) — forecasts, webcams, guided recovery, and a coach marketplace. See `CLAUDE.md` for the full architecture and `Scratchpad.md` for status. The planner above is a deliberately lightweight parallel track.

## Data & credits

Wave/wind data from [Open-Meteo](https://open-meteo.com) (free). Optional tide from [WorldTides](https://www.worldtides.info). Spot intelligence distilled from coaching sessions with Blue Coco / Gone Surfing School, Keramas.
