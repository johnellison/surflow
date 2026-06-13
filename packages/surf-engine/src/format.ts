import type { ScoredWindow } from './types/scored-window';
import type { SessionPlan } from './types/session-plan';

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
  const cond = `${f.swellHeightM.toFixed(1)}m @ ${f.swellPeriodS.toFixed(0)}s, wind ${f.windKnots.toFixed(
    0,
  )}kn, tide ${f.tideMeters.toFixed(2)}m ${f.tideState}`;
  const flag = w.safety.safe ? '' : ' ⛔';
  return `${hhmm(w.time)}  ${stars(w.score)} ${String(w.score).padStart(3)}  ${cond}${flag}\n      ${w.summary}`;
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
    lines.push(`\n## ${dayName(day.date)} ${day.date}`);
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
