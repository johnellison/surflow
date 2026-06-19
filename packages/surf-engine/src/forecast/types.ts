import type { TideState } from '@surflow/core';

/** Which tide source produced a tide reading, and how much to trust it. */
export type TideSourceName = 'worldtides' | 'open-meteo';

/**
 * One hour of normalized conditions at a spot. Units are fixed here once:
 * metres, seconds, degrees-FROM, knots, celsius. Maps 1:1 onto the existing
 * `forecasts` Drizzle table so a later persistence adapter needs no reshaping.
 */
export interface NormalizedForecastHour {
  time: string; // ISO, Asia/Makassar (UTC+8)
  swellHeightM: number;
  swellPeriodS: number;
  swellDirDeg: number; // direction FROM
  windKnots: number;
  windGustKnots: number;
  windDirDeg: number; // direction FROM
  tideMeters: number; // calibrated to the local table datum
  tideState: TideState;
  tideSource: TideSourceName;
  /** ± metres uncertainty on the tide reading (drives the safety buffer). */
  tideUncertaintyM: number;
  waterTempC: number;
  /** Set when the Jun–Sep seasonal trade-wind bias correction fired (raw model showed <8 kn). */
  windSource?: 'model' | 'seasonal-default';
}
