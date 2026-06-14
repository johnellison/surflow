import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Klotok's Right — long open-face deep-water reef point. Morocco-like wall; holds size. */
export const klotokRight: SurfRules = {
  spotSlug: 'klotok-right',
  displayName: "Klotok's Right",
  region: 'east-bali',
  latitude: -8.544,
  longitude: 115.403,
  facingBearing: 135,
  breakType: 'point',
  bottomType: 'deep-reef',
  minSkill: 'intermediate',
  tide: {
    // Deep water → wide tolerance. Wants enough water for consistency; on big
    // swell + very high tide the paddle-out gets dangerous.
    minMeters: 1.2,
    // Swell-dependent ceiling: ~2.5m on normal days, dropping to ~1.8m as swell
    // hits ~2.6m (heavier shorebreak). Reverse-engineered from Julien's scheduled
    // exits vs his "too dangerous" refusals — see .research/julien-extraction.md.
    maxTide: {
      ceiling: 2.5,
      refSwellM: 2.2,
      swellSensitivity: 1.75, // 2.2m swell→2.5m, 2.5m swell→~1.98m, 2.6m swell→1.8m
      floorCeiling: 1.6,
      provenance: {
        source: 'julien-whatsapp',
        quote:
          'Scheduled Klotok exits hit 2.30m at 2.2m swell (msg71, 19/05); refused Klotok as "very hardcore/dangerous paddle out" at ~2.0m tide on 2.5m swell (msg336, 11/06).',
        ref: 'msg71,msg336',
        confidence: 'medium',
        capturedAt: '2026-06-15',
      },
    },
    optimalBand: [1.4, 2.0],
    directionPref: 'any',
    moreWaterWhenBig: true,
    provenance: {
      source: 'julien-whatsapp',
      quote:
        "tide level is high enough and slowly dropping which won't push the waves to less consistency like last time but the contrary.",
      ref: 'msg134',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  swell: {
    centerBearing: 200,
    halfWidthDeg: 40,
    idealHeight: [1.5, 2.8], // deep water holds bigger swell than the reef breaks
    idealPeriod: [9, 18],
    minHeightM: 1.1,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'a long open face right-hander point, closer from what can be found in Morocco.',
      ref: 'msg71',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  wind: {
    offshoreBearing: 300,
    toleranceDeg: 60,
    maxKnots: 14,
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
      kind: 'big-swell-dangerous',
      note: 'On big swell + high tide the paddle-out is hardcore/dangerous; "water mountains" break outside (gun territory).',
      provenance: { source: 'julien-whatsapp', quote: "Klotok will probably be a very hardcore/ dangerous paddle out ... unless in semi guns like 7'6-8'0 boards.", ref: 'msg336', confidence: 'high', capturedAt: CAPTURED },
    },
    {
      kind: 'reef',
      note: 'Deep-water reef point; holds big swell when the inside reefs max out.',
      provenance: { source: 'julien-whatsapp', quote: "Klotok's right will break", ref: 'msg331', confidence: 'high', capturedAt: CAPTURED },
    },
    {
      kind: 'shallow-lowtide',
      note: 'On too-high a tide the exit is forced over the rocks under heavy shorebreak — incredibly dangerous. Get out before the tide tops out.',
      provenance: { source: 'julien-whatsapp', quote: 'high-tide rock exit under heavy shorebreak (surfer-relayed)', ref: 'user-relay', confidence: 'high', capturedAt: '2026-06-15' },
    },
  ],
  notes: [
    'The wall closest to a Moroccan point — long open-face rights, intermediate-friendly at moderate size.',
    'Sunrise meetings (~05:45). On the biggest days it still works but becomes an advanced/gun wave.',
    "Klotok's Left is a separate spot that wants LOW tide — different access entirely.",
  ],
  version: 2,
  updatedAt: '2026-06-15',
};
