# Surf Extract Rules — Reverse-engineer coaching wisdom from WhatsApp

One-time (re-runnable) extraction pass that turns a surf coach's WhatsApp thread into structured `SurfRules` + tide `CalibrationPair[]` for `@surflow/surf-engine`. Run this when there are **new coaching messages** to fold into the knowledge base.

## Source

Julien (Blue Coco / Gone Surfing School), wacli JID `6281239311018@s.whatsapp.net`. Export read-only:

```bash
wacli --read-only messages export --chat 6281239311018@s.whatsapp.net --limit 1000 --json > .research/julien_raw.json
```

Build a clean transcript (sender + local-time + msg id + text). The raw export and transcript are **gitignored** — they contain personal data. Only the distilled rules (with quote provenance) get committed.

## What to extract — for each spot

Read the whole thread and, per spot (Keramas Peak, Keramas Car Park, Cucukan, Klotok's Right, Kubur, Lembang), pull with a **verbatim quote + message id** for every rule:

- **Tide:** hard minimum (metres), optimal band, rising/falling preference, "more water when big" notes.
- **Swell:** direction window, ideal size range, period notes, "swell magnet / holds size / smaller-swell spot".
- **Wind:** offshore direction, morning-glass vs afternoon-onshore timing, reef-vs-onshore behaviour.
- **Hazards:** reef/rockshelf, shallow-at-low-tide, big-swell-dangerous, paddle-out notes, crowd, health (ear) cautions.

Separately, extract every **tide calibration pair** — any message stating an absolute tide height at a datetime (e.g. *"08:42, 2.4 meters"*, *"around 07:30 am at 2.0 meter"*, *"wait until 1.5 meter"*). These are ground truth for fitting the tide datum.

## Output

1. Update `packages/surf-engine/src/knowledge/spots/*.spot.ts` — one `SurfRules` object per spot, **every rule with a `provenance` block** (`source: 'julien-whatsapp'`, the quote, the msg ref, a confidence). Bump `version` on changes.
2. Update `packages/surf-engine/src/knowledge/calibration.ts` `CALIBRATION_PAIRS` with new `{ localDatetime, julienM, state, spot, ref, confidence }` rows. Backfill the source-height samples (`openMeteoM`, and `worldtidesM` once a key exists) by querying each source at those datetimes.
3. Keep a human-readable summary in `.research/julien-extraction.md` for review.
4. Run `pnpm --filter @surflow/surf-engine test` — the knowledge + calibration tests must pass before committing.

## Principle

Provenance is non-negotiable: the engine cites these quotes back to the user as the "why" behind every recommendation. A rule with no source quote is an inference — mark it `source: 'inferred'` or `'web'`, never `'julien-whatsapp'`.
