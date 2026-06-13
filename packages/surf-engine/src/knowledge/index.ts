import { SurfRules } from '../types/surf-rules';
import { keramasPeak } from './spots/keramas-peak.spot';
import { keramasCarpark } from './spots/keramas-carpark.spot';
import { cucukan } from './spots/cucukan.spot';
import { klotokRight } from './spots/klotok-right.spot';
import { kubur } from './spots/kubur.spot';
import { lembang } from './spots/lembang.spot';

const RAW: SurfRules[] = [keramasPeak, keramasCarpark, cucukan, klotokRight, kubur, lembang];

/**
 * Load and validate the East Bali knowledge base. Throws (fail-fast) if any
 * spot file violates the SurfRules schema — keeps the safety-critical data honest.
 */
export function loadKnowledgeBase(): SurfRules[] {
  return RAW.map((s) => SurfRules.parse(s));
}

export function getSpot(slug: string): SurfRules | undefined {
  return loadKnowledgeBase().find((s) => s.spotSlug === slug);
}

export const SPOT_SLUGS = RAW.map((s) => s.spotSlug);
