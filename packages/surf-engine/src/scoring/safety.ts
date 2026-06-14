import type { SurfRules } from '../types/surf-rules';
import { LEVEL_RANK, type SurferProfile } from '../types/surfer-profile';
import type { SafetyVerdict } from '../types/scored-window';
import type { NormalizedForecastHour } from '../forecast/types';
import { effectiveTideCeiling } from '../tide-ceiling';

/**
 * Hard safety gate. Runs before quality scoring and short-circuits ranking.
 *
 * Dominant gate: tide must clear the spot's reef-exposure minimum. When the tide
 * source is degraded (Open-Meteo), we require an extra buffer equal to the
 * reading's uncertainty so a noisy tide can't green-light a too-shallow reef.
 */
export function assessSafety(
  rules: SurfRules,
  hour: NormalizedForecastHour,
  surfer: SurferProfile,
): SafetyVerdict {
  const reasons: string[] = [];
  const warnings: string[] = [];

  // --- Tide floor (+ uncertainty buffer) ---
  const buffer = hour.tideSource === 'worldtides' ? 0 : hour.tideUncertaintyM;
  const effectiveMin = rules.tide.minMeters + buffer;
  if (hour.tideMeters < effectiveMin) {
    const bufNote = buffer > 0 ? ` (incl. ±${buffer.toFixed(2)}m ${hour.tideSource} buffer)` : '';
    reasons.push(
      `Tide ${hour.tideMeters.toFixed(2)}m is below the ${rules.tide.minMeters.toFixed(
        2,
      )}m minimum for ${rules.displayName}${rules.section ? ` (${rules.section})` : ''}${bufNote} — reef too exposed.`,
    );
  }

  // --- Tide ceiling (swell-dependent; dangerous rock exit under heavy shorebreak) ---
  const ceiling = effectiveTideCeiling(rules, hour.swellHeightM);
  if (ceiling !== undefined && hour.tideMeters > ceiling - buffer) {
    reasons.push(
      `Tide ${hour.tideMeters.toFixed(2)}m is over ${rules.displayName}'s ~${ceiling.toFixed(
        1,
      )}m ceiling at ${hour.swellHeightM.toFixed(1)}m swell — exit forced onto the rocks under heavy shorebreak.`,
    );
  }

  // --- Reef size floor: too small only breaks far inside on shallow/dry reef ---
  if (rules.swell.minHeightM && hour.swellHeightM < rules.swell.minHeightM) {
    reasons.push(
      `Swell ${hour.swellHeightM.toFixed(1)}m is under ${rules.displayName}'s ~${rules.swell.minHeightM}m floor — it'll only break far inside on shallow reef.`,
    );
  }

  // --- Oversized for the surfer (forecasts here often over-call, so warn before excluding) ---
  if (surfer.maxComfortableHeightM) {
    const ceil = surfer.maxComfortableHeightM;
    if (hour.swellHeightM > ceil + 0.4) {
      reasons.push(
        `Swell ${hour.swellHeightM.toFixed(1)}m is over your ${ceil}m ceiling — sit this one out.`,
      );
    } else if (hour.swellHeightM > ceil) {
      warnings.push(
        `Swell ${hour.swellHeightM.toFixed(1)}m is at the top of your ${ceil}m range (forecasts here often over-call size).`,
      );
    }
  }
  const bigDanger = rules.hazards.find((h) => h.kind === 'big-swell-dangerous');
  if (bigDanger && surfer.maxComfortableHeightM && hour.swellHeightM > surfer.maxComfortableHeightM - 0.3) {
    warnings.push(`Big-swell hazard: ${bigDanger.note}`);
  }

  // --- Skill gap ---
  const need = LEVEL_RANK[rules.minSkill] ?? 1;
  const have = LEVEL_RANK[surfer.level] ?? 1;
  if (have < need) {
    const msg = `${rules.displayName} wants ${rules.minSkill} level (you: ${surfer.level}).`;
    if (need - have >= 2) reasons.push(msg + ' Out of range.');
    else warnings.push(msg);
  }

  // --- Tide-conditional hazards ---
  if (hour.tideMeters < rules.tide.optimalBand[0]) {
    const shallow = rules.hazards.find((h) => h.kind === 'shallow-lowtide');
    if (shallow) warnings.push(`Below optimal tide — ${shallow.note}`);
  }
  const onshore = rules.hazards.find((h) => h.kind === 'crowd' && /onshore/i.test(h.note));
  if (onshore) warnings.push(onshore.note);

  return { safe: reasons.length === 0, reasons, warnings };
}
