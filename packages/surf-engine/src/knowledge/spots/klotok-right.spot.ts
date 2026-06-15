import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Klotok's Right — long open-face deep-water reef point. Morocco-like wall; holds size. */
export const klotokRight: SurfRules = {
  spotSlug: 'klotok-right',
  displayName: "Klotok's Right",
  region: 'east-bali',
  latitude: -8.5753, // Julien's pin (Pantai Batu Tumpeng); corrected from satellite — was ~3.5km inland
  longitude: 115.4112,
  facingBearing: 185, // faces ~S — takes the SSW swell more squarely than the SE-facing reefs (why it holds size)
  breakType: 'point',
  bottomType: 'deep-reef',
  minSkill: 'intermediate',
  tide: {
    // Deep water → wide tolerance. Wants enough water for consistency; on big
    // swell + very high tide the paddle-out gets dangerous.
    minMeters: 1.2,
    // Heuristic ceiling — Julien confirmed there's "no rule of thumb", it's
    // multifactorial: swell (size/dir/period) = power on the way in; offshore
    // wind makes the shorebreak more barreling/dangerous; and shifting sand
    // platforms change the exit regularly. We model swell size + offshore wind
    // and treat the sand as irreducible uncertainty — ALWAYS reality-check on
    // site. Baseline from his scheduled exits (2.30m fine @2.2m swell, msg71) vs
    // his refusal (~2.0m "dangerous" @2.5m swell, msg336).
    maxTide: {
      ceiling: 2.4, // tightened 2.5→2.4: surfer logged a hairy 2.2m exit on 1.7m swell (15/06)
      refSwellM: 2.2,
      swellSensitivity: 1.75, // 2.2m swell→2.5m, 2.5m swell→~1.98m, 2.6m swell→1.8m
      offshoreWindSensitivity: 0.02, // offshore wind hollows the shorebreak exit (~-0.2m at 10kn)
      floorCeiling: 1.6,
      provenance: {
        source: 'julien-whatsapp',
        quote:
          'No rule of thumb — highly multi-factorial: swell size/direction/period (power coming back to land); offshore wind makes the shorebreak more barreling/dangerous (onshore safer); and ever-changing sand platforms we enter/exit on. "No exact science there… theory VS reality check when we get on site."',
        ref: 'reply 14/06 (multifactorial); surfer session 15/06 (2.2m exit hairy on 1.7m swell — heavy shorebreak, 7ft+ set caught the lull on exit → ceiling 2.5→2.4, optimal top 2.0→1.9); msg71, msg336',
        confidence: 'high',
        capturedAt: '2026-06-14',
      },
    },
    optimalBand: [1.4, 1.9], // top trimmed 2.0→1.9 after the 15/06 hairy 2.2m exit
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
    offshoreBearing: 345, // S-facing coast → offshore is ~N/NNW (land is due north here)
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
    'High-tide exit danger is a heuristic, not a hard line (Julien): worse with bigger swell AND with offshore wind (hollower shorebreak), and the sand exit platforms shift — eyeball the shorebreak/exit on site before committing.',
    'Julien (14/06): on ~1.7m swell, 2.2m tide is the start of "tricky time"; bigger swell → lower tricky tide; big waves push the ACTUAL tide above the chart; onshore morning trades (e.g. Mon/Sat this week) hurt wave quality but HELP the exit. Check the inside in front of the stairs from ~07:45.',
  ],
  version: 2,
  updatedAt: '2026-06-15',
};
