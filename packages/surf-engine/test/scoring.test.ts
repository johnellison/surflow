import { describe, it, expect } from 'vitest';
import { scoreWindow } from '../src/scoring/window';
import { getSpot } from '../src/knowledge/index';
import { DEFAULT_SURFER } from '../src/types/surfer-profile';
import type { NormalizedForecastHour } from '../src/forecast/types';

function hour(p: Partial<NormalizedForecastHour>): NormalizedForecastHour {
  return {
    time: '2026-06-14T07:00',
    swellHeightM: 1.3,
    swellPeriodS: 12,
    swellDirDeg: 200,
    windKnots: 6,
    windGustKnots: 9,
    windDirDeg: 300,
    tideMeters: 1.8,
    tideState: 'rising',
    tideSource: 'open-meteo',
    tideUncertaintyM: 0.25,
    waterTempC: 28,
    ...p,
  };
}

describe('scoring — Julien ground truth replay', () => {
  const carpark = getSpot('keramas-carpark')!;

  it('flags Car Park at 1.3m rising as UNSAFE (Julien: "wait until 1.5m")', () => {
    // msg265/270: user proposed 1.3m rising; Julien said too low.
    const w = scoreWindow(carpark, hour({ tideMeters: 1.3, swellHeightM: 1.3, swellPeriodS: 6 }), DEFAULT_SURFER);
    expect(w.safety.safe).toBe(false);
    expect(w.score).toBe(0);
    expect(w.safety.reasons.join(' ')).toMatch(/minimum/i);
    expect(w.summary.startsWith('⛔')).toBe(true);
  });

  it('passes Car Park at 2.0m rising (Julien: good at 07:30am, 2.0m)', () => {
    // msg208: good session at 2.0m rising.
    const w = scoreWindow(carpark, hour({ tideMeters: 2.0, swellHeightM: 1.0 }), DEFAULT_SURFER);
    expect(w.safety.safe).toBe(true);
    expect(w.score).toBeGreaterThan(55);
    const tideDir = w.factors.find((f) => f.factor === 'tideDir')!;
    expect(tideDir.score).toBe(1); // rising matches the spot preference
  });

  it('prefers more water on Klotok: 1.6m beats 1.3m on a punchy day', () => {
    // msg254: Julien chose 1.6m over 1.3m for an easier lineup. Use the harmonic
    // tide source so both clear the floor and we isolate the tide-band scoring.
    const klotok = getSpot('klotok-right')!;
    const wt = { tideSource: 'worldtides' as const, tideUncertaintyM: 0.05, swellHeightM: 1.8, tideState: 'rising' as const };
    const low = scoreWindow(klotok, hour({ ...wt, tideMeters: 1.3 }), DEFAULT_SURFER);
    const high = scoreWindow(klotok, hour({ ...wt, tideMeters: 1.6 }), DEFAULT_SURFER);
    expect(low.safety.safe).toBe(true);
    expect(high.safety.safe).toBe(true);
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('flags Cucukan as UNSAFE when swell is below its reef size floor', () => {
    // Julien (relayed): too small → only breaks far inside on shallow reef.
    const cucukan = getSpot('cucukan')!;
    const small = scoreWindow(
      cucukan,
      hour({ swellHeightM: 1.0, tideMeters: 1.7, tideSource: 'worldtides', tideUncertaintyM: 0.05 }),
      DEFAULT_SURFER,
    );
    expect(small.safety.safe).toBe(false);
    expect(small.safety.reasons.join(' ')).toMatch(/floor|inside/i);
    // Same spot with real size clears the floor.
    const proper = scoreWindow(
      cucukan,
      hour({ swellHeightM: 1.8, tideMeters: 1.7, tideSource: 'worldtides', tideUncertaintyM: 0.05 }),
      DEFAULT_SURFER,
    );
    expect(proper.safety.safe).toBe(true);
  });

  it('cites Julien in the explanation when tide is decisive', () => {
    const w = scoreWindow(carpark, hour({ tideMeters: 2.0, swellHeightM: 1.0 }), DEFAULT_SURFER);
    expect(w.summary).toContain('Julien');
  });

  it('marks a clean offshore dawn as a strong window', () => {
    const w = scoreWindow(carpark, hour({ tideMeters: 1.9, swellHeightM: 1.2, swellPeriodS: 13, windKnots: 4, swellDirDeg: 200 }), DEFAULT_SURFER);
    expect(w.safety.safe).toBe(true);
    expect(w.score).toBeGreaterThan(70);
  });
});
