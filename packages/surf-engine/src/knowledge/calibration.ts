import type { TideSourceName } from '../forecast/types';

/**
 * Tide datum calibration.
 *
 * Julien quotes tide in absolute "metres of tide" off a local table
 * (high ≈ 2.4m, mid ≈ 1.3–1.6m, low ≈ 0). Open-Meteo's `sea_level_height_msl`
 * is model MSL-relative (can be negative) AND its tidal *range* here is damped.
 * We use Julien's datetime+height quotes as ground truth to fit a per-source
 * affine map  julienM = a * sourceM + b  and to measure residual error.
 *
 * FINDING (baked from a live Open-Meteo pull, see .research/julien-extraction.md):
 * Open-Meteo cannot match Julien within the 0.2m safety margin — two mornings
 * (May 28 vs May 31) show ~identical OM values (1.28 vs 1.275m) yet Julien quoted
 * 2.40m vs 2.00m. That 0.4m spread is irreducible by any affine fit, so the
 * Open-Meteo tide is a DEGRADED FALLBACK only (we add a safety buffer when using
 * it). A real harmonic source (WorldTides) is expected to win decisively and
 * should be wired as primary — see forecast/tide.ts.
 */

export interface CalibrationPair {
  /** Local datetime (Asia/Makassar, UTC+8). */
  localDatetime: string;
  /** Tide height Julien stated, metres on the local table datum. */
  julienM: number;
  state: 'rising' | 'falling' | 'high' | 'low';
  spot: string;
  ref: string;
  confidence: 'high' | 'medium' | 'low';
  /** Open-Meteo sea_level_height_msl at this datetime (interpolated, baked live). */
  openMeteoM: number;
  /** WorldTides height at this datetime — filled by `surf calibrate` once a key exists. */
  worldtidesM?: number;
  note?: string;
}

export const CALIBRATION_PAIRS: CalibrationPair[] = [
  { localDatetime: '2026-05-28T08:42', julienM: 2.4, state: 'high', spot: 'keramas-peak', ref: 'msg180', confidence: 'high', openMeteoM: 1.28 },
  { localDatetime: '2026-05-31T07:30', julienM: 2.0, state: 'rising', spot: 'keramas-carpark', ref: 'msg208', confidence: 'high', openMeteoM: 1.275 },
  { localDatetime: '2026-06-04T08:15', julienM: 1.6, state: 'rising', spot: 'klotok-right', ref: 'msg254', confidence: 'high', openMeteoM: 0.79 },
  { localDatetime: '2026-06-04T06:20', julienM: 1.3, state: 'rising', spot: 'klotok-right', ref: 'msg254', confidence: 'low', openMeteoM: 0.2, note: '"this morning" — fuzzy time reference' },
  { localDatetime: '2026-06-05T07:00', julienM: 1.3, state: 'rising', spot: 'keramas-carpark', ref: 'msg265', confidence: 'medium', openMeteoM: 0.27, note: 'Julien: too low — minimum 1.5m' },
];

export interface AffineFit {
  a: number;
  b: number;
  rmseM: number;
  maxResidualM: number;
  n: number;
}

/** Ordinary least-squares fit of julienM = a*x + b over the given (x, julienM) samples. */
export function fitAffine(samples: Array<{ x: number; julienM: number }>): AffineFit {
  const n = samples.length;
  if (n < 2) throw new Error('need at least 2 samples to fit');
  const meanX = samples.reduce((s, p) => s + p.x, 0) / n;
  const meanY = samples.reduce((s, p) => s + p.julienM, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of samples) {
    sxy += (p.x - meanX) * (p.julienM - meanY);
    sxx += (p.x - meanX) ** 2;
  }
  const a = sxx === 0 ? 0 : sxy / sxx;
  const b = meanY - a * meanX;
  let sse = 0;
  let maxR = 0;
  for (const p of samples) {
    const r = p.julienM - (a * p.x + b);
    sse += r * r;
    maxR = Math.max(maxR, Math.abs(r));
  }
  return { a, b, rmseM: Math.sqrt(sse / n), maxResidualM: maxR, n };
}

/** Fit the affine map for a source from the baked calibration pairs. */
export function calibrateSource(source: TideSourceName): AffineFit | null {
  const samples = CALIBRATION_PAIRS.flatMap((p) => {
    const x = source === 'open-meteo' ? p.openMeteoM : p.worldtidesM;
    return x === undefined ? [] : [{ x, julienM: p.julienM }];
  });
  if (samples.length < 2) return null;
  return fitAffine(samples);
}

/** Pick the source with the lower residual error (the one we trust for the safety gate). */
export function bestTideSource(): { source: TideSourceName; fit: AffineFit } {
  const om = calibrateSource('open-meteo');
  const wt = calibrateSource('worldtides');
  if (wt && (!om || wt.rmseM <= om.rmseM)) return { source: 'worldtides', fit: wt };
  if (!om) throw new Error('no calibratable tide source');
  return { source: 'open-meteo', fit: om };
}

/** Tide uncertainty (± metres) we attach to readings from a source, from its fit residual. */
export function tideUncertaintyFor(source: TideSourceName): number {
  const fit = calibrateSource(source);
  if (fit) return Math.max(0.1, Number(fit.rmseM.toFixed(2)));
  // No fitted samples: WorldTides is harmonic (inherently ~0.1m); Open-Meteo ~0.3m.
  return source === 'worldtides' ? 0.1 : 0.3;
}
