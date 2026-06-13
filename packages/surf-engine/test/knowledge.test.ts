import { describe, it, expect } from 'vitest';
import { loadKnowledgeBase, SPOT_SLUGS } from '../src/knowledge/index';

describe('knowledge base', () => {
  const kb = loadKnowledgeBase();

  it('loads and validates all six East Bali spots', () => {
    expect(kb).toHaveLength(6);
    expect(SPOT_SLUGS).toEqual(
      expect.arrayContaining([
        'keramas-peak',
        'keramas-carpark',
        'cucukan',
        'klotok-right',
        'kubur',
        'lembang',
      ]),
    );
  });

  it('has unique slugs', () => {
    expect(new Set(SPOT_SLUGS).size).toBe(SPOT_SLUGS.length);
  });

  it('every safety-critical rule carries provenance', () => {
    for (const s of kb) {
      expect(s.tide.provenance.capturedAt).toBeTruthy();
      expect(s.swell.provenance.capturedAt).toBeTruthy();
      expect(s.wind.provenance.capturedAt).toBeTruthy();
      // reef spots must define a real tide floor
      if (s.bottomType.includes('reef')) expect(s.tide.minMeters).toBeGreaterThan(0);
    }
  });

  it('encodes Julien’s Car Park 1.5m tide minimum', () => {
    const carpark = kb.find((s) => s.spotSlug === 'keramas-carpark')!;
    expect(carpark.tide.minMeters).toBe(1.5);
    expect(carpark.tide.provenance.ref).toContain('msg270');
  });
});
