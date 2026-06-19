import { describe, it, expect } from 'vitest';
import { formatPlan, formatWindow, formatVerify } from '../src/format';
import type { SessionPlan, DayPlan } from '../src/types/session-plan';
import type { ModelAgreement } from '../src/types/model-agreement';
import type { ScoredWindow } from '../src/types/scored-window';
import type { NormalizedForecastHour } from '../src/forecast/types';
import type { SurferProfile } from '../src/types/surfer-profile';

// ---------------------------------------------------------------------------
// Minimal fixtures
// ---------------------------------------------------------------------------

function makeForecast(overrides: Partial<NormalizedForecastHour> = {}): NormalizedForecastHour {
  return {
    time: '2026-06-19T07:00',
    swellHeightM: 1.4,
    swellPeriodS: 12,
    swellDirDeg: 200,
    windKnots: 6,
    windGustKnots: 9,
    windDirDeg: 300,
    tideMeters: 1.8,
    tideState: 'rising',
    tideSource: 'open-meteo',
    tideUncertaintyM: 0.25,
    waterTempC: 28,
    ...overrides,
  };
}

function makeWindow(overrides: Partial<ScoredWindow> = {}): ScoredWindow {
  return {
    spotSlug: 'keramas-carpark',
    displayName: 'Keramas',
    time: '2026-06-19T07:00',
    safety: { safe: true, reasons: [], warnings: [] },
    score: 75,
    factors: [],
    summary: 'Offshore ESE, mid tide, quality swell',
    forecast: makeForecast(),
    ...overrides,
  };
}

const surfer: SurferProfile = {
  name: 'Yahya',
  level: 'advanced-intermediate',
  board: { lengthCm: 188, volumeL: 35, type: 'hybrid' },
  maxComfortableSwellM: 2.6,
};

function makeAgreement(level: ModelAgreement['level'], extras: Partial<ModelAgreement> = {}): ModelAgreement {
  return {
    level,
    heightDiffPct: level === 'agree' ? 8 : level === 'caution' ? 25 : level === 'diverge' ? 47 : null,
    periodDiffS: level === 'agree' ? 0.8 : level === 'caution' ? 2.0 : level === 'diverge' ? 4.2 : null,
    primaryHeight: 1.4,
    secondaryHeight: level === 'unavailable' || level === 'horizon' ? null : 1.8,
    secondaryModel: 'ecmwf_wam025',
    ...extras,
  };
}

function makePlan(days: DayPlan[]): SessionPlan {
  return {
    surfer,
    range: { from: days[0].date, to: days[days.length - 1].date },
    byDay: days,
    topPick: null,
    generatedAt: '2026-06-19T00:00:00.000Z',
  };
}

function makeDay(date: string, ma: ModelAgreement | null): DayPlan {
  return {
    date,
    ranked: [],
    modelAgreement: ma,
  };
}

// ---------------------------------------------------------------------------
// formatPlan — day header tags
// ---------------------------------------------------------------------------

describe('formatPlan — agreement tags in day headers', () => {
  it('agree: day header starts with ✓', () => {
    const plan = makePlan([makeDay('2026-06-19', makeAgreement('agree'))]);
    const out = formatPlan(plan);
    expect(out).toMatch(/##\s+✓/);
  });

  it('caution: day header starts with ⚠', () => {
    const plan = makePlan([makeDay('2026-06-19', makeAgreement('caution'))]);
    const out = formatPlan(plan);
    expect(out).toMatch(/##\s+⚠/);
  });

  it('diverge: header starts with ⚠', () => {
    const plan = makePlan([makeDay('2026-06-19', makeAgreement('diverge'))]);
    const out = formatPlan(plan);
    expect(out).toMatch(/##\s+⚠/);
  });

  it('horizon: day header starts with ?', () => {
    const plan = makePlan([makeDay('2026-06-28', makeAgreement('horizon'))]);
    const out = formatPlan(plan);
    expect(out).toMatch(/##\s+\?/);
  });

  it('unavailable: day header starts with ‼', () => {
    const plan = makePlan([makeDay('2026-06-19', makeAgreement('unavailable'))]);
    const out = formatPlan(plan);
    expect(out).toMatch(/##\s+‼/);
  });

  it('null modelAgreement: no tag prepended', () => {
    const plan = makePlan([makeDay('2026-06-19', null)]);
    const out = formatPlan(plan);
    // Day header should have no leading symbol
    expect(out).not.toMatch(/##\s+[✓⚠‼?]/);
  });
});

// ---------------------------------------------------------------------------
// formatWindow — wind label
// ---------------------------------------------------------------------------

describe('formatWindow — wind: seasonal default label', () => {
  it('shows [wind: seasonal default] when windSource is seasonal-default', () => {
    const w = makeWindow({ forecast: makeForecast({ windSource: 'seasonal-default', windKnots: 15, windDirDeg: 112 }) });
    const out = formatWindow(w);
    expect(out).toContain('[wind: seasonal default]');
  });

  it('no label when windSource is model', () => {
    const w = makeWindow({ forecast: makeForecast({ windSource: 'model' }) });
    const out = formatWindow(w);
    expect(out).not.toContain('[wind: seasonal default]');
  });

  it('no label when windSource is undefined (existing sessions without field)', () => {
    const w = makeWindow({ forecast: makeForecast() }); // windSource absent
    const out = formatWindow(w);
    expect(out).not.toContain('[wind: seasonal default]');
  });
});

// ---------------------------------------------------------------------------
// formatVerify — standalone cross-check table
// ---------------------------------------------------------------------------

describe('formatVerify — standalone cross-check output', () => {
  it('renders agree, caution, diverge, unavailable, horizon rows', () => {
    const map = new Map<string, ModelAgreement>([
      ['2026-06-19', makeAgreement('agree')],
      ['2026-06-20', makeAgreement('caution')],
      ['2026-06-21', makeAgreement('diverge')],
      ['2026-06-22', makeAgreement('unavailable')],
      ['2026-06-28', makeAgreement('horizon')],
    ]);
    const out = formatVerify(map);
    expect(out).toContain('✓');
    expect(out).toContain('⚠');
    expect(out).toContain('‼');
    expect(out).toContain('?');
    expect(out).toContain('2026-06-19');
    expect(out).toContain('2026-06-28');
  });
});
