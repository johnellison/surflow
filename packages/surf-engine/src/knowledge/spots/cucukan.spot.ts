import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Cucukan — clean fast right-hand reef. Julien's favourite; early-morning, mid-high tide. */
export const cucukan: SurfRules = {
  spotSlug: 'cucukan',
  displayName: 'Cucukan',
  region: 'east-bali',
  latitude: -8.58936, // Julien's dropped pin (msg57)
  longitude: 115.3495,
  facingBearing: 130,
  breakType: 'reef',
  bottomType: 'reef',
  minSkill: 'intermediate',
  tide: {
    minMeters: 1.3,
    optimalBand: [1.4, 2.0],
    directionPref: 'rising',
    moreWaterWhenBig: true,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'Tide is perfect for several spots including Kubur and cucukan.',
      ref: 'msg50',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  swell: {
    centerBearing: 200,
    halfWidthDeg: 35,
    idealHeight: [0.8, 1.8],
    idealPeriod: [8, 16],
    provenance: {
      source: 'web',
      quote: 'Clean, fast, rippable right-hander; best head-high+. Strictly a higher-tide reef.',
      confidence: 'medium',
      capturedAt: CAPTURED,
    },
  },
  wind: {
    offshoreBearing: 300,
    toleranceDeg: 60,
    maxKnots: 12,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'softer and better direction of the wind in the morning.',
      ref: 'msg126',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  hazards: [
    {
      kind: 'reef',
      note: 'Sharp reef — wants water on it; surf the early window before the tide drops.',
      provenance: { source: 'julien-whatsapp', quote: 'if you can finish your session before 08:30 am I would try Cucukan.', ref: 'msg328', confidence: 'high', capturedAt: CAPTURED },
    },
  ],
  notes: [
    "One of Julien's favourite spots — isolated, surrounded by rice fields.",
    'Surf the dawn→08:30 window on a rising tide; if it gets difficult, fall back to Kubur.',
  ],
  version: 1,
  updatedAt: CAPTURED,
};
