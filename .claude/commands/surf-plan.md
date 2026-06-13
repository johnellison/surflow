# Surf Plan — East Bali Session Planner

Plan surf sessions for East Bali using the `@surflow/surf-engine` package. This skill is a **thin adapter**: it parses the request, calls the engine via the `surf` CLI, and presents the result. All surf logic lives in the engine — never re-implement scoring or tide rules here.

## When to use

The user asks to plan a session / week, asks "where should I surf", asks "is `<spot>` safe at `<tide>`", or wants to understand why conditions are good/bad at an East Bali spot (Keramas Peak, Keramas Car Park, Cucukan, Klotok's Right, Kubur, Lembang).

## How to run

The engine is driven through the CLI in `apps/cli`. Run commands with:

```bash
cd apps/cli && pnpm exec tsx src/index.ts <command>
```

### Commands

- **Plan a window** (default 7 days from today):
  `… plan [--days N] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--spots keramas-carpark,klotok-right]`
- **Check a specific scenario** (replays a "is this safe?" question, like the user used to ask Julien):
  `… check <spot-slug> --tide 1.3 [--rising|--falling] --swell 1.3 --period 6 [--wind 8 --winddir 300]`
- **List spots and their rules:** `… spots`
- **Show tide calibration fits:** `… calibrate`

Spot slugs: `keramas-peak`, `keramas-carpark`, `cucukan`, `klotok-right`, `kubur`, `lembang`.

## Presenting results

1. Run the matching command and show the engine's markdown output (it already contains the ranked plan, ★ ratings, and Julien-cited explanations).
2. Lead with the **top pick** and the single most useful sentence of "why".
3. Surface any `⛔` safety blocks and `⚠️` warnings prominently — these encode reef-exposure and skill/ear hazards from Julien's coaching.
4. If the output notes `tide source: open-meteo`, remind the user once that tide is the degraded fallback (±~0.25m) and that adding a `WORLDTIDES_API_KEY` upgrades it to harmonic-grade.

## Notes for the learning goal

Each window's explanation cites the Julien rule it leaned on (e.g. *"rising boosts size"*, *"car park is a swell magnet, good option for small days"*). When the user asks **why**, expand using the spot's `notes` and `hazards` (visible via `… spots` or the spot files in `packages/surf-engine/src/knowledge/spots/`), and explain the physics: swell-direction window vs the spot's orientation, period (groundswell vs windswell), offshore-wind alignment, and tide depth over the reef.

## Do NOT

- Do not hand-write forecasts, tide heights, or scores — always go through the engine.
- Do not recommend a spot the engine marked unsafe, even if the user pushes — relay Julien's minimum instead.
