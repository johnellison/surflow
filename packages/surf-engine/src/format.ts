import type { ScoredWindow } from './types/scored-window';
import type { SessionPlan, PlannedSpotDay } from './types/session-plan';
import type { SurfRules } from './types/surf-rules';
import type { ModelAgreement } from './types/model-agreement';
import { effectiveTideCeiling } from './tide-ceiling';
import { waveCheckMinutes } from './wave-check';

const hhmm = (iso: string) => iso.slice(11, 16);
const dayName = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

function stars(score: number): string {
  const n = Math.max(0, Math.min(5, Math.round(score / 20)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/** One window as a compact line. */
export function formatWindow(w: ScoredWindow): string {
  const f = w.forecast;
  const cond = `${f.swellHeightM.toFixed(1)}m @ ${f.swellPeriodS.toFixed(0)}s, wind ${f.windKnots.toFixed(0)}kn, tide ${f.tideMeters.toFixed(2)}m ${f.tideState}`;
  const flag = w.safety.safe ? '' : ' ⛔';
  const check = `wave-check ~${waveCheckMinutes(f.swellHeightM)}min (be on the spot 20–30min early)`;
  return `${hhmm(w.time)}  ${stars(w.score)} ${String(w.score).padStart(3)}  ${cond}${flag}\n      ${w.summary}\n      ${check}`;
}

function agreementTag(ma: ModelAgreement | null | undefined): string {
  if (!ma) return '';
  switch (ma.level) {
    case 'agree':       return '✓ ';
    case 'caution':     return '⚠ ';
    case 'diverge':     return '⚠ ';
    case 'unavailable': return '‼ ';
    case 'horizon':     return '? ';
  }
}

/** A full plan as a readable markdown report (used by the CLI and the /surf-plan skill). */
export function formatPlan(plan: SessionPlan): string {
  const lines: string[] = [];
  const tideSrc = plan.byDay[0]?.ranked[0]?.best?.forecast.tideSource ?? 'open-meteo';
  lines.push(`# 🏄 East Bali surf plan — ${plan.range.from} → ${plan.range.to}`);
  lines.push(
    `Surfer: ${plan.surfer.name ?? 'you'} (${plan.surfer.level}, ${plan.surfer.board.lengthCm}cm/${plan.surfer.board.volumeL}L ${plan.surfer.board.type}) · tide source: ${tideSrc}`,
  );
  if (tideSrc === 'open-meteo') {
    lines.push(
      `> ⚠️ Tide from Open-Meteo (degraded ~±0.25m here). Safety minimums carry an extra buffer. Add a WorldTides key for harmonic-grade tide.`,
    );
  }
  lines.push(
    `> 📏 Swell = deep-water height sampled offshore (matches Surfline). East Bali forecasts often over-call size — treat heights as upper bounds.`,
  );

  if (plan.topPick) {
    lines.push(`\n## ⭐ Top pick — ${dayName(plan.topPick.date)} ${plan.topPick.date}`);
    lines.push(
      `**${title(plan.topPick.window)}** · ${stars(plan.topPick.window.score)} (${plan.topPick.window.score}/100)`,
    );
    lines.push(formatWindow(plan.topPick.window));
  } else {
    lines.push(`\n_No safe window found in range._`);
  }

  for (const day of plan.byDay) {
    lines.push(`\n## ${agreementTag(day.modelAgreement)}${dayName(day.date)} ${day.date}`);
    const surfable = day.ranked.filter((s) => s.best);
    if (surfable.length === 0) {
      lines.push('_Nothing safe today._');
      continue;
    }
    for (const spot of surfable.slice(0, 4)) {
      const b = spot.best!;
      lines.push(`- **${title(b)}** — ${stars(b.score)} ${b.score}/100 @ ${hhmm(b.time)}`);
      lines.push(`    ${b.summary}`);
      if (b.safety.warnings.length) lines.push(`    ⚠️ ${b.safety.warnings.join(' · ')}`);
    }
    const unsafe = day.ranked.filter((s) => !s.best);
    if (unsafe.length) {
      lines.push(`- _Out today: ${unsafe.map((s) => s.displayName + (s.section ? ` ${s.section}` : '')).join(', ')}_`);
    }
  }
  return lines.join('\n');
}

function title(w: ScoredWindow): string {
  return w.section ? `${w.displayName} — ${w.section}` : w.displayName;
}

const spotTitle = (s: { displayName: string; section?: string }) =>
  s.section ? `${s.displayName} — ${s.section}` : s.displayName;

/**
 * ASCII tide curve for one spot across a day. Bars scaled 0–3m, with the spot's
 * min/max safety lines and a per-hour surfable verdict. `windows` should be the
 * full day's scored hours (daylight + night), time-ascending.
 */
export function formatTideDay(rules: SurfRules, windows: ScoredWindow[], date: string): string {
  const W = 22;
  const MAXM = 3;
  const lines: string[] = [];
  const t = rules.tide;
  const peakSwell = windows.reduce((mx, w) => Math.max(mx, w.forecast.swellHeightM), 0);
  const ceilM = effectiveTideCeiling(rules, peakSwell);
  const ceil = ceilM !== undefined ? ` · max ~${ceilM.toFixed(1)}m ⚠ (@${peakSwell.toFixed(1)}m swell)` : '';
  lines.push(
    `🌊 ${spotTitle(rules)} — tide ${dayName(date)} ${date}  (min ${t.minMeters}m · sweet ${t.optimalBand[0]}–${t.optimalBand[1]}m${ceil})`,
  );
  for (const w of windows) {
    const m = w.forecast.tideMeters;
    const filled = Math.max(0, Math.min(W, Math.round((m / MAXM) * W)));
    const bar = '█'.repeat(filled) + '·'.repeat(W - filled);
    const inBand = m >= t.optimalBand[0] && m <= t.optimalBand[1];
    let flag: string;
    if (!w.safety.safe) {
      const r = w.safety.reasons[0] ?? '';
      flag = /ceiling|rocks|shorebreak/i.test(r) ? '⛔ too high — rock exit' : /minimum|exposed/i.test(r) ? '⛔ too low — reef' : '⛔ ' + short(r);
    } else {
      flag = inBand ? '✓ sweet spot' : '✓ ok';
    }
    lines.push(`${hhmm(w.time)}  ${m.toFixed(2)}m ▕${bar}▏ ${w.forecast.tideState.padEnd(7)} ${flag}`);
  }
  return lines.join('\n');
}

/** Side-by-side head-to-head of two spots on one day (best window + hourly scores). */
export function formatCompare(a: PlannedSpotDay, b: PlannedSpotDay, date: string): string {
  const lines: string[] = [];
  const nameA = spotTitle(a);
  const nameB = spotTitle(b);
  lines.push(`⚖️  ${nameA}  vs  ${nameB} — ${dayName(date)} ${date}\n`);

  const best = (s: PlannedSpotDay) => {
    if (!s.best) return 'no safe window';
    const f = s.best.forecast;
    return `${hhmm(s.best.time)} (${s.best.score}) · ${f.swellHeightM.toFixed(1)}m@${f.swellPeriodS.toFixed(0)}s · wind ${f.windKnots.toFixed(0)}kn · tide ${f.tideMeters.toFixed(2)}m ${f.tideState}`;
  };
  lines.push(`Best  A: ${best(a)}`);
  lines.push(`Best  B: ${best(b)}`);
  lines.push(`\nHour   ${pad(nameA)} ${pad(nameB)}`);

  const byHour = (s: PlannedSpotDay) => {
    const map = new Map<string, ScoredWindow>();
    for (const w of s.windows) map.set(hhmm(w.time), w);
    return map;
  };
  const ha = byHour(a);
  const hb = byHour(b);
  const hours = [...new Set([...ha.keys(), ...hb.keys()])].sort();
  for (const h of hours) {
    lines.push(`${h}   ${pad(cell(ha.get(h)))} ${pad(cell(hb.get(h)))}`);
  }
  return lines.join('\n');
}

const DIR_LABEL: Record<number, string> = {
  0: 'N', 23: 'NNE', 45: 'NE', 68: 'ENE', 90: 'E', 113: 'ESE',
  135: 'SE', 158: 'SSE', 180: 'S', 203: 'SSW', 225: 'SW', 248: 'WSW',
  270: 'W', 293: 'WNW', 315: 'NW', 338: 'NNW',
};
function compassDir(deg: number): string {
  const buckets = Object.keys(DIR_LABEL).map(Number);
  const closest = buckets.reduce((a, b) => (Math.abs(b - (deg % 360)) < Math.abs(a - (deg % 360)) ? b : a));
  return DIR_LABEL[closest] ?? `${deg}°`;
}

/** Full plan as a markdown table — one section per day, scannable in any MD viewer. */
export function formatPlanTable(plan: SessionPlan): string {
  const tideSrc = plan.byDay[0]?.ranked[0]?.best?.forecast.tideSource ?? 'open-meteo';
  const tideNote = tideSrc === 'worldtides' ? 'WorldTides ±0.05m' : 'Open-Meteo ±0.25m ⚠';
  const lines: string[] = [
    `# 🏄 East Bali Surf Plan — ${plan.range.from} → ${plan.range.to}`,
    ``,
    `**Surfer:** ${plan.surfer.name ?? 'Yahya'} · ${plan.surfer.level} · ${plan.surfer.board.lengthCm}cm/${plan.surfer.board.volumeL}L ${plan.surfer.board.type}`,
    `**Tide:** ${tideNote} · **Swell:** offshore reference — treat as upper bound`,
    `**Tags:** ✓ models agree · ⚠ caution/diverge · ‼ check failed · ? >7d horizon · ⚑ wind seasonal default (ESE 15 kn Jun–Sep)`,
  ];

  if (plan.topPick) {
    const tp = plan.topPick.window;
    const f = tp.forecast;
    const windStr = `${f.windKnots.toFixed(0)} kn ${compassDir(f.windDirDeg)}`;
    lines.push(``);
    lines.push(`## ⭐ Top Pick — ${dayName(plan.topPick.date)} ${plan.topPick.date}`);
    lines.push(`**${title(tp)}** · ${stars(tp.score)} · ${tp.score}/100 · ${hhmm(tp.time)}`);
    lines.push(`Swell ${f.swellHeightM.toFixed(1)}m @ ${f.swellPeriodS.toFixed(0)}s · Wind ${windStr} · Tide ${f.tideMeters.toFixed(2)}m ${f.tideState}`);
  }

  lines.push(``);
  lines.push(`---`);

  for (const day of plan.byDay) {
    const tag = agreementTag(day.modelAgreement) || '';
    lines.push(``);
    lines.push(`## ${tag}${dayName(day.date)} ${day.date}`);

    const surfable = day.ranked.filter((s) => s.best);
    const unsafe = day.ranked.filter((s) => !s.best);

    if (surfable.length === 0) {
      lines.push(`_Nothing safe today._`);
    } else {
      lines.push(`| # | Spot | Score | Time | Swell | Wind | Tide | Condition |`);
      lines.push(`|---|------|------:|------|-------|------|------|-----------|`);
      surfable.slice(0, 5).forEach((spot, i) => {
        const b = spot.best!;
        const f = b.forecast;
        const windStr = `${f.windKnots.toFixed(0)} kn ${compassDir(f.windDirDeg)}`;
        const tideStr = `${f.tideMeters.toFixed(2)}m ${f.tideState === 'rising' ? '↗' : f.tideState === 'falling' ? '↘' : '→'}`;
        const swellStr = `${f.swellHeightM.toFixed(1)}m @ ${f.swellPeriodS.toFixed(0)}s`;
        const safeFlag = b.safety.safe ? '' : ' ⛔';
        const warnFlag = b.safety.warnings.length ? ' ⚠️' : '';
        const note = shortNote(b.summary);
        lines.push(`| ${i + 1} | **${title(b)}**${safeFlag}${warnFlag} | ${stars(b.score)} ${b.score} | ${hhmm(b.time)} | ${swellStr} | ${windStr} | ${tideStr} | ${note} |`);
      });
    }

    if (unsafe.length) {
      lines.push(`**Out:** ${unsafe.map((s) => spotTitle(s)).join(', ')}`);
    }
  }

  return lines.join('\n');
}

function shortNote(summary: string): string {
  // "Only ding: X" is the key limitation — surface it directly.
  const dingMatch = summary.match(/Only ding: (.+?)(?:\.|$)/);
  if (dingMatch) return dingMatch[1].trim();
  // Otherwise: first sentence before the Julien quote, truncated at a word boundary.
  const beforeJulien = summary.split('Julien:')[0].trim().replace(/\.$/, '');
  if (beforeJulien.length <= 65) return beforeJulien;
  const cut = beforeJulien.slice(0, 62);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

/** Standalone cross-model verification table for `surf verify`. */
export function formatVerify(agreementMap: Map<string, ModelAgreement>): string {
  const lines: string[] = ['# Cross-model agreement (Open-Meteo best_match vs ECMWF WAM025)'];
  lines.push('');
  for (const [date, ma] of [...agreementMap.entries()].sort()) {
    const tag = agreementTag(ma) || '  ';
    let detail = '';
    if ((ma.level === 'diverge' || ma.level === 'caution') && (ma.heightDiffPct !== null || ma.periodDiffS !== null)) {
      const hStr = ma.heightDiffPct !== null ? `height Δ${ma.heightDiffPct.toFixed(0)}%` : '';
      const pStr = ma.periodDiffS !== null ? `period Δ${ma.periodDiffS.toFixed(1)}s` : '';
      detail = `  (${[hStr, pStr].filter(Boolean).join(', ')})`;
    } else if (ma.level === 'unavailable') {
      detail = '  (secondary model fetch failed or timed out)';
    } else if (ma.level === 'horizon') {
      detail = '  (>7-day model horizon — high uncertainty regardless)';
    } else if (ma.level === 'agree' && ma.heightDiffPct !== null) {
      detail = `  (height Δ${ma.heightDiffPct.toFixed(0)}%, period Δ${(ma.periodDiffS ?? 0).toFixed(1)}s)`;
    }
    lines.push(`${tag}${date}${detail}`);
  }
  return lines.join('\n');
}

function cell(w?: ScoredWindow): string {
  if (!w) return '—';
  if (!w.safety.safe) {
    const r = w.safety.reasons[0] ?? '';
    return /ceiling|rocks/i.test(r) ? '⛔ high' : /minimum/i.test(r) ? '⛔ low' : '⛔';
  }
  return `${w.score}`;
}
const pad = (s: string) => s.padEnd(22).slice(0, 22);
const short = (s: string) => (s.length > 22 ? s.slice(0, 21) + '…' : s);
