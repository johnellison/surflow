# Julien Coaching Extraction — East Bali Surf Rules

Source: WhatsApp thread with Julien (Blue Coco / Gone Surfing School), JID `6281239311018`, 342 msgs, 2026-04-25 → 2026-06-10. Surfer: Yahya/John, advanced-intermediate, settled on a 6'2" ~35L hybrid. All times in messages are UTC; Bali local = UTC+8. Tide heights Julien quotes are off a local tide table (chart-datum style: high ≈ 2.4m, mid ≈ 1.3–1.6m, low ≈ 0).

## General tide & wind philosophy (the rule-of-thumb engine)

- **Rule of thumb: rising mid-tide for all these spots.** "There are details to it but that is true in general." (msg 124/129)
- **Rising boosts size, dropping reduces size.** "Rising VS dropping... is about reduction or boosting factor for the waves size: Rising boost size VS Dropping take some size away." (msg 125)
- **Wind usually decides the schedule.** Morning = softer & better-direction wind → sessions land on the rising tide because the rise occupies most of the morning. (msg 126–127)
- **Bigger swell → want MORE water (higher tide)** so waves aren't too-fast barrels. "the bigger the swell the more water (tide level) you want for the waves to not be too fast barrels." (msg 129)
- **On big days prefer the drop**, but only surfed it when it aligned with good morning wind; otherwise took the rise to avoid a messy afternoon onshore lineup. (msg 128, 186)
- **Small swell → happy with a rising boost.** (msg 127)
- **Wind: morning offshore/glassy, onshore builds midday.** Noon starts ≈ "high chance of onshore wind." 11 km/h = "low" wind. (msg 181, 290)
- **Coral reef breaks handle onshore wind badly** — disturbs the wrap/bowl, makes long walls sectiony. (msg 302)
- **Session length: max ~2h** (performance drops after ~1h). Best windows are sunrise. (msg 340)

## Tide calibration pairs (datetime_local, tideMeters, state) — ground truth for datum fitting

| # | Local datetime (UTC+8) | Tide (m) | State | Spot context | Provenance |
|---|------------------------|----------|-------|--------------|-----------|
| 1 | 2026-05-28 08:42 | 2.40 | high (full) | Keramas main, "2.2m should be fine" sand exit | msg 180 |
| 2 | 2026-05-31 07:30 | 2.00 | rising | Car Park "good this morning" | msg 208 |
| 3 | 2026-06-04 06:?? (dawn) | 1.30 | rising | Klotok "this morning" | msg 254 |
| 4 | 2026-06-04 08:15 | 1.60 | rising | Klotok, chosen for more water | msg 254 |
| 5 | 2026-06-05 (Carpark) | 1.30 | rising | "too low — wait until 1.5m" | msg 265/270 |

These pairs let us fit `tideMeters = a·sourceHeight + b` for each tide API and pick the lower-residual source.

## Per-spot rules (with provenance)

### Keramas — The Peak (point, reef, river-mouth paddle-out)
- Shallow reef; **needs enough tide to break well but not be too shallow; rising = getting safer.** "just enough of tide to break good but not yet be too shallow. And it'll be rising so getting safer." (msg 189)
- Paddle out via the river bed alongside the break. (msg 189)
- First light start (06:00). **Becomes "too big and furiously powerful" on big swell** → lay day / go deep-water reef. (msg 297, 299, 331)
- minSkill: advanced. Tide min ≈ 1.5m, optimal 1.8–2.4m rising. directionPref rising.

### Keramas — Car Park (point, reef rockshelf, "swell magnet")
- **"Car park is a swell magnet, good option for small days."** (msg 207)
- Good reference: **07:30 am at 2.0m rising** worked; smaller swell → a touch less water over the rockshelf. (msg 208)
- **Hard tide minimum 1.5m** (1.3m rejected as too shallow). "wait until 1.5 meter of tide. Otherwise good call." (msg 265/270)
- Hollow/powerful — avoid when protecting an ear. (msg 286–287)
- minSkill: advanced. Tide min 1.5m, optimal 1.8–2.2m rising. Best small-to-medium swell.

### Cucukan (reef) — Julien's favourite
- **"Tide is perfect for several spots including Kubur and cucukan"** at 06:00 am. (msg 50)
- Reef; early window before tide drops: **"finish your session before 08:30 am"**, else fall back to Kubur. (msg 328)
- Authoritative GPS pin: **-8.5893559, 115.3495048**. (msg 57)
- minSkill: intermediate. Rising morning, mid-high tide. Tide min ≈ 1.3m, optimal 1.4–2.0m rising.

### Klotok — Right (deep-water reef point) — the Morocco-like wall
- **"Long open face right-hander point, closer from what can be found in Morocco."** (msg 71)
- **High-enough & slowly dropping keeps consistency**: "tide level is high enough and slowly dropping which won't push the waves to less consistency like last time but the contrary." (msg 134)
- Also called a **low-tide-capable spot** (msg 198) — wide tolerance because deep water. On bigger/powerful days wants **more water**: chose 1.6m over 1.3m for easier lineup. (msg 254)
- **Deep water → holds big swell** when reef breaks max out; breaks even on peak Fridays. (msg 331)
- BUT **big swell + very high tide early = hardcore/dangerous paddle-out, "water mountains" outside** (needs 7'6"–8'0" guns). (msg 336)
- Sunrise 05:45 meetings. minSkill: intermediate-advanced. Tide min ≈ 1.2m, optimal 1.4–2.0m, direction any (handles rising and dropping); avoid very-high tide on big swell.

### Klotok — Left (separate spot, low-tide)
- "starts to be low enough to get the option of surfing Klotok's left... entirely different spot, different access." (msg 203) → low-tide preference. (Secondary; user's list says "Klotok deep water reef" = the right.)

### Kubur (beach break, black sand)
- "Tide is perfect... including Kubur" (msg 50); typical **08:00–09:30 rising mid-morning**. (msg 122, 170)
- **Wide tide tolerance**: good on low tide (msg 198) AND "high tide like 12:00 start but high chance of onshore wind." (msg 290)
- Forgiving back-up option. (msg 328)
- minSkill: intermediate. Tide min ≈ 0.8m, optimal 1.0–2.2m, direction any. Beach break = most tide/skill tolerant.

### Lembang / Lembeng (beach break, Ketewel — temple peak + sandbank peak)
- **Good when swell drops a bit** (smaller-swell spot). (msg 73)
- **Lower / dropping tide spot**: "low tide spot like... Lembeng" (msg 198); "later I would try Lembeng because the tide will have dropped by then." (msg 329)
- Two peaks: temple peak + sandbank peak in front of the warung, meet at the "boat statue." (msg 336)
- minSkill: intermediate. Tide min ≈ 0.6m, optimal 0.7–1.6m, **direction: falling preferred**.

## Big-day escape options (for completeness, not in user's 6-spot list)
- **Galak Beach** day when normal spots unmanageable. (msg 331)
- **Sanur baby reef** (inside coral barrier S of Sanur, lefthander, boat from Mertasari): retreat spot, ⅓–½ Keramas size, for small/recovery days — but **dies in onshore wind**. (msg 287, 302)

## Approx coordinates (for forecast + tide; spots share one ~8km Open-Meteo cell)
| Spot | lat | lon | source |
|------|-----|-----|--------|
| Cucukan | -8.58936 | 115.34950 | Julien pin (msg 57) |
| Keramas Peak | -8.5908 | 115.3450 | Komune Keramas (web) |
| Keramas Car Park | -8.5885 | 115.3470 | just N of peak (web) |
| Kubur | -8.5840 | 115.3520 | KFC cluster (web) |
| Lembang/Lembeng | -8.6050 | 115.3150 | Ketewel (web) |
| Klotok | -8.5440 | 115.4030 | Klotok beach Klungkung (web) |

Tide station reference: Sanur ≈ -8.6833, 115.2670.
