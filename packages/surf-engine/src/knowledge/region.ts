/**
 * Regional deep-water swell sample point for the East Bali cluster.
 *
 * Open-Meteo's swell height AT a shoreline grid cell is shoaled/depth-damped
 * (it reports the wave in shallow water, not the incoming groundswell). Sampling
 * ~35km offshore in deep water recovers the deep-water swell that surf reports
 * (e.g. Surfline) quote. Validated against the user's logged Surfline readings:
 * on 2026-05-29 Surfline showed 2.1m@16s; this point read 2.06m@12.7s, while the
 * coastal cell read 0.88m. All six spots receive essentially the same Indian
 * Ocean SSW groundswell, so they share one sample point (override per spot via
 * SurfRules.swellSample if ever needed).
 */
export const EAST_BALI_SWELL_POINT = { lat: -8.9, lon: 115.5 };
