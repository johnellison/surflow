import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Lembang (Lembeng, Ketewel) — black-sand beach break. Smaller-swell, lower/dropping tide. */
export const lembang: SurfRules = {
  spotSlug: 'lembang',
  displayName: 'Lembang',
  region: 'east-bali',
  latitude: -8.605,
  longitude: 115.315,
  facingBearing: 125,
  breakType: 'beach',
  bottomType: 'sand',
  minSkill: 'intermediate',
  tide: {
    minMeters: 0.6,
    optimalBand: [0.7, 1.6],
    directionPref: 'falling',
    moreWaterWhenBig: false,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'later I would try Lembeng because the tide will have dropped by then.',
      ref: 'msg329',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  swell: {
    centerBearing: 200,
    halfWidthDeg: 45,
    idealHeight: [0.6, 1.6],
    idealPeriod: [7, 15],
    provenance: {
      source: 'julien-whatsapp',
      quote: 'the swell drops a bit so which is good to surf yet another spot: « Lembeng ».',
      ref: 'msg73',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  wind: {
    offshoreBearing: 300,
    toleranceDeg: 70,
    maxKnots: 12,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'softer and better direction of the wind in the morning.',
      ref: 'msg126',
      confidence: 'medium',
      capturedAt: CAPTURED,
    },
  },
  hazards: [
    {
      kind: 'crowd',
      note: 'Two peaks: a temple peak and a sandbank peak in front of the warung (meet at the "boat statue").',
      provenance: { source: 'julien-whatsapp', quote: 'the temple peak ... and the sand bank peak in front of the Warung to choose from.', ref: 'msg336', confidence: 'high', capturedAt: CAPTURED },
    },
  ],
  notes: [
    'Beach break for smaller swell and lower/dropping tide — the "later in the morning" option once the tide has run off.',
    'A safe Ketewel alternative when Klotok is too big on a high tide (msg336).',
  ],
  version: 1,
  updatedAt: CAPTURED,
};
