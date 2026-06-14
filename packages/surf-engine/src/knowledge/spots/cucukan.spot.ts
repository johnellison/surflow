import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Cucukan — clean fast right-hand reef. Julien's favourite; early-morning, mid-high tide. */
export const cucukan: SurfRules = {
  spotSlug: 'cucukan',
  displayName: 'Cucukan',
  region: 'east-bali',
  latitude: -8.58936, // Julien's dropped pin (msg57)
  longitude: 115.3495,
  facingBearing: 120, // ESE-facing (satellite-verified) — slightly more east than the others
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
    idealHeight: [1.5, 2.4],
    idealPeriod: [8, 16],
    minHeightM: 1.4,
    provenance: {
      source: 'julien-whatsapp',
      quote:
        'When it’s too small Cucukan only breaks further inside where the reef is shallow — needs size to break in the makeable zone. (Julien, relayed by surfer 2026-06-15)',
      ref: 'user-relay',
      confidence: 'high',
      capturedAt: '2026-06-15',
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
    'Take off at the PEAK only — no take-off on the bowl (Julien, 14/06).',
  ],
  version: 2,
  updatedAt: '2026-06-15',
};
