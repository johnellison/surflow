import { describe, it, expect } from 'vitest';
import {
  fitAffine,
  calibrateSource,
  bestTideSource,
  tideUncertaintyFor,
  CALIBRATION_PAIRS,
} from '../src/knowledge/calibration';

describe('tide calibration', () => {
  it('fitAffine recovers a known line', () => {
    const fit = fitAffine([
      { x: 0, julienM: 1 },
      { x: 1, julienM: 3 },
      { x: 2, julienM: 5 },
    ]);
    expect(fit.a).toBeCloseTo(2, 6);
    expect(fit.b).toBeCloseTo(1, 6);
    expect(fit.rmseM).toBeCloseTo(0, 6);
  });

  it('fits Open-Meteo against Julien’s quoted tide heights', () => {
    const fit = calibrateSource('open-meteo')!;
    expect(fit).not.toBeNull();
    expect(fit.n).toBe(CALIBRATION_PAIRS.length);
    // Documents the empirical finding: OM is usable but cannot hit the 0.2m
    // safety margin here — residual is meaningfully > 0.1m.
    expect(fit.rmseM).toBeGreaterThan(0.05);
    expect(fit.rmseM).toBeLessThan(0.35);
    // eslint-disable-next-line no-console
    console.log(`Open-Meteo tide fit: a=${fit.a.toFixed(3)} b=${fit.b.toFixed(3)} rmse=${fit.rmseM.toFixed(3)}m max=${fit.maxResidualM.toFixed(3)}m`);
  });

  it('falls back to Open-Meteo until WorldTides samples exist', () => {
    expect(calibrateSource('worldtides')).toBeNull();
    expect(bestTideSource().source).toBe('open-meteo');
  });

  it('exposes a non-trivial tide uncertainty for the safety buffer', () => {
    expect(tideUncertaintyFor('open-meteo')).toBeGreaterThanOrEqual(0.1);
  });
});
