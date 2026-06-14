import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Keramas — Car Park. Right-hand reef-shelf point, a "swell magnet" for small days. */
export const keramasCarpark: SurfRules = {
  spotSlug: 'keramas-carpark',
  displayName: 'Keramas',
  section: 'Car Park',
  region: 'east-bali',
  latitude: -8.5885,
  longitude: 115.347,
  facingBearing: 140, // SE-facing (satellite-verified)
  breakType: 'point',
  bottomType: 'reef',
  minSkill: 'advanced',
  tide: {
    minMeters: 1.5,
    optimalBand: [1.8, 2.2],
    directionPref: 'rising',
    moreWaterWhenBig: true,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'Yes but maybe wait until 1,5 meter of tide. Otherwise good call.',
      ref: 'msg270',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  swell: {
    centerBearing: 200,
    halfWidthDeg: 40,
    idealHeight: [1.0, 2.2],
    idealPeriod: [7, 16],
    provenance: {
      source: 'julien-whatsapp',
      quote: 'car parc is a swell magnet, good option for small days.',
      ref: 'msg207',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  wind: {
    offshoreBearing: 320, // SE-facing → offshore ~NW
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
      note: 'Breaks over a rock shelf — needs water over it; reference: good at 07:30am on 2.0m rising.',
      provenance: { source: 'julien-whatsapp', quote: 'around 07:30 am at 2.0 meter of tide ... a little less water above the rockshelf', ref: 'msg208', confidence: 'high', capturedAt: CAPTURED },
    },
    {
      kind: 'shallow-lowtide',
      note: 'Hollow/powerful when shallow — risky on a low tide or for ear/health recovery.',
      provenance: { source: 'julien-whatsapp', quote: 'avoid hollow/ powerful spots like carpark', ref: 'msg287', confidence: 'high', capturedAt: CAPTURED },
    },
  ],
  notes: [
    'Picks up the most swell of the Keramas spots — first choice on small days.',
    'Hard floor 1.5m of tide; really wants ~1.8–2.0m+ over the shelf.',
  ],
  version: 2,
  updatedAt: '2026-06-15',
};
