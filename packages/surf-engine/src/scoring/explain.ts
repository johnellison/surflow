import type { SurfRules } from '../types/surf-rules';
import type { FactorScore, SafetyVerdict } from '../types/scored-window';

/**
 * One-line WHY: lead with the safety verdict if unsafe, else stitch the biggest
 * helper and biggest hurter. Cite Julien when the deciding factor is tide/swell.
 */
export function summarize(rules: SurfRules, safety: SafetyVerdict, factors: FactorScore[]): string {
  if (!safety.safe) return `⛔ ${safety.reasons[0]}`;

  const ranked = [...factors].sort((a, b) => b.weight * (b.score - 0.5) - a.weight * (a.score - 0.5));
  const helper = ranked.find((f) => f.impact === 'helped');
  const hurter = [...ranked].reverse().find((f) => f.impact === 'hurt');

  const parts: string[] = [];
  if (helper) parts.push(helper.reason);
  if (hurter && hurter.factor !== helper?.factor) parts.push(`Only ding: ${lower(hurter.reason)}`);
  if (!helper && !hurter) parts.push('Middling across the board — surfable, nothing standout.');

  const cite = julienCite(rules, helper, hurter);
  if (cite) parts.push(cite);
  return parts.join(' ');
}

const CAUTION = /too big|dangerous|powerful|furiously|avoid|hardcore|gun/i;

function julienCite(rules: SurfRules, helper?: FactorScore, hurter?: FactorScore): string | null {
  const decisive = helper ?? hurter;
  if (!decisive) return null;
  const factorSrc =
    decisive.factor === 'tideBand' || decisive.factor === 'tideDir'
      ? rules.tide.provenance
      : decisive.factor === 'swellDir' || decisive.factor === 'size' || decisive.factor === 'period'
        ? rules.swell.provenance
        : decisive.factor === 'wind'
          ? rules.wind.provenance
          : undefined;

  // Prefer the decisive factor's quote, but never cite a *warning* quote as if it
  // explained a good window. Fall back to a universally-apt rule (tide, then wind).
  const candidates = [factorSrc, rules.tide.provenance, rules.wind.provenance];
  for (const src of candidates) {
    if (src?.source === 'julien-whatsapp' && src.quote && !(decisive.impact === 'helped' && CAUTION.test(src.quote))) {
      return `Julien: “${src.quote}”`;
    }
  }
  return null;
}

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
