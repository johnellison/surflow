export interface Daylight {
  sunriseH: number; // local decimal hours
  sunsetH: number;
}

/**
 * NOAA solar-position sunrise/sunset, accurate to a few minutes — plenty for
 * filtering forecast hours to surfable daylight. East Bali ≈ UTC+8.
 */
export function computeDaylight(lat: number, lon: number, dateISO: string, tzOffsetHours = 8): Daylight {
  const date = new Date(`${dateISO}T00:00:00Z`);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0);
  const N = Math.floor((date.getTime() - yearStart) / 86_400_000);
  const gamma = ((2 * Math.PI) / 365) * (N - 1);

  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latR = (lat * Math.PI) / 180;
  const zenith = (90.833 * Math.PI) / 180;
  const cosH = (Math.cos(zenith) - Math.sin(latR) * Math.sin(decl)) / (Math.cos(latR) * Math.cos(decl));
  if (cosH > 1) return { sunriseH: 24, sunsetH: 24 };
  if (cosH < -1) return { sunriseH: 0, sunsetH: 24 };

  const ha = (Math.acos(cosH) * 180) / Math.PI;
  const sunriseUTCmin = 720 - 4 * (lon + ha) - eqtime;
  const sunsetUTCmin = 720 - 4 * (lon - ha) - eqtime;
  const toLocal = (m: number) => (m / 60 + tzOffsetHours + 24) % 24;
  return { sunriseH: toLocal(sunriseUTCmin), sunsetH: toLocal(sunsetUTCmin) };
}
