import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Kubur — forgiving black-sand beach break. Wide tide tolerance; the reliable back-up. */
export const kubur: SurfRules = {
  spotSlug: 'kubur',
  displayName: 'Kubur',
  region: 'east-bali',
  latitude: -8.584,
  longitude: 115.352,
  facingBearing: 130,
  breakType: 'beach',
  bottomType: 'sand',
  minSkill: 'intermediate',
  tide: {
    minMeters: 0.8,
    optimalBand: [1.0, 2.2],
    directionPref: 'any',
    moreWaterWhenBig: true,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'low tide spot ... even Kubur could have good waves / kubur at high tide like 12:00 start.',
      ref: 'msg198,msg290',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  swell: {
    centerBearing: 200,
    halfWidthDeg: 45,
    idealHeight: [0.9, 2.2],
    idealPeriod: [7, 15],
    provenance: {
      source: 'julien-whatsapp',
      quote: 'Tide is perfect for several spots including Kubur and cucukan.',
      ref: 'msg50',
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
      quote: 'high tide like 12:00 start but high chance of onshore wind.',
      ref: 'msg290',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  hazards: [
    {
      kind: 'crowd',
      note: 'Black-sand beach break — least crowded and most forgiving of the cluster.',
      provenance: { source: 'web', confidence: 'medium', capturedAt: CAPTURED },
    },
  ],
  notes: [
    'Most tide- and skill-tolerant spot here — the dependable back-up (msg328).',
    'Sand bottom: safe on a wide tide range, but a noon high-tide session risks onshore wind.',
    'Back-up for Lembeng temple peak — on bigger swell Kubur gets super fast, especially the left (Julien, 14/06).',
  ],
  version: 2,
  updatedAt: '2026-06-15',
};
