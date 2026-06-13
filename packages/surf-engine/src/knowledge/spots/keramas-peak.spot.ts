import type { SurfRules } from '../../types/surf-rules';

const CAPTURED = '2026-06-13';

/** Keramas — The Peak. World-class right-hand reef point, river-mouth paddle-out. */
export const keramasPeak: SurfRules = {
  spotSlug: 'keramas-peak',
  displayName: 'Keramas',
  section: 'The Peak',
  region: 'east-bali',
  latitude: -8.5908,
  longitude: 115.345,
  facingBearing: 130,
  breakType: 'reef',
  bottomType: 'reef',
  minSkill: 'advanced',
  tide: {
    minMeters: 1.5,
    optimalBand: [1.8, 2.4],
    directionPref: 'rising',
    moreWaterWhenBig: true,
    provenance: {
      source: 'julien-whatsapp',
      quote:
        "just enough of tide to break good but not yet be too shallow. And it'll be rising so getting safer.",
      ref: 'msg189',
      confidence: 'high',
      capturedAt: CAPTURED,
    },
  },
  swell: {
    centerBearing: 200,
    halfWidthDeg: 35,
    idealHeight: [1.3, 2.4],
    idealPeriod: [8, 16],
    minHeightM: 1.1,
    provenance: {
      source: 'julien-whatsapp',
      quote: 'too big and furiously powerful — better to schedule elsewhere on solid days.',
      ref: 'msg297,msg331',
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
      note: 'Shallow volcanic rock reef; paddle out via the river bed alongside the break.',
      provenance: { source: 'julien-whatsapp', quote: 'it breaks alongside the bed of a river that you should use to paddle out.', ref: 'msg189', confidence: 'high', capturedAt: CAPTURED },
    },
    {
      kind: 'big-swell-dangerous',
      note: 'On big swell the Keramas area gets too big and powerful — lay day or go deep-water reef (Klotok).',
      provenance: { source: 'julien-whatsapp', quote: 'the Keramas area will be too big and furiously powerful', ref: 'msg297', confidence: 'high', capturedAt: CAPTURED },
    },
    {
      kind: 'crowd',
      note: 'Premier east-coast wave; gets crowded. First-light starts beat the crowd.',
      provenance: { source: 'web', confidence: 'medium', capturedAt: CAPTURED },
    },
  ],
  notes: [
    'Advanced reef point. Best small-to-medium on a rising tide from first light (~06:00).',
    'Night surfing available under lights (Komune).',
  ],
  version: 2,
  updatedAt: '2026-06-15',
};
