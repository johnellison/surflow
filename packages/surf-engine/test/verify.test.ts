import { describe, it, expect } from 'vitest';
import { classifyAgreement } from '../src/forecast/verify';

describe('classifyAgreement — boundary cases', () => {
  it('agree: small height diff, small period diff', () => {
    const r = classifyAgreement(1.0, 1.1, 10, 10.8);
    expect(r.level).toBe('agree');
    expect(r.heightDiffPct).toBeCloseTo(10, 1);
    expect(r.periodDiffS).toBeCloseTo(0.8, 1);
  });

  it('caution via height: 25% diff, negligible period', () => {
    const r = classifyAgreement(1.0, 1.25, 10, 10.5);
    expect(r.level).toBe('caution');
  });

  it('caution via period: small height diff, 2s period diff', () => {
    const r = classifyAgreement(1.0, 1.05, 10, 12);
    expect(r.level).toBe('caution');
    expect(r.periodDiffS).toBeCloseTo(2, 1);
  });

  it('diverge via height: >40%', () => {
    const r = classifyAgreement(1.0, 1.5, 10, 10);
    expect(r.level).toBe('diverge');
    expect(r.heightDiffPct).toBeCloseTo(50, 1);
  });

  it('diverge via period: >3s', () => {
    const r = classifyAgreement(1.0, 1.05, 10, 13.5);
    expect(r.level).toBe('diverge');
    expect(r.periodDiffS).toBeCloseTo(3.5, 1);
  });

  it('diverge takes precedence when both height and period exceed thresholds', () => {
    const r = classifyAgreement(1.0, 1.8, 10, 15);
    expect(r.level).toBe('diverge');
  });

  it('unavailable: primary null', () => {
    const r = classifyAgreement(null, 1.0, 10, 10);
    expect(r.level).toBe('unavailable');
    expect(r.heightDiffPct).toBeNull();
    expect(r.periodDiffS).toBeNull();
  });

  it('unavailable: secondary null', () => {
    const r = classifyAgreement(1.0, null, 10, 10);
    expect(r.level).toBe('unavailable');
  });

  it('unavailable: primary=0, secondary>0 (denominator undefined)', () => {
    const r = classifyAgreement(0, 1.2, 10, 10);
    expect(r.level).toBe('unavailable');
    expect(r.heightDiffPct).toBeNull();
  });

  it('agree: both heights zero (both flat, 0% diff)', () => {
    const r = classifyAgreement(0, 0, 8, 8);
    expect(r.level).toBe('agree');
    expect(r.heightDiffPct).toBe(0);
  });

  it('unavailable: primary period null', () => {
    const r = classifyAgreement(1.0, 1.1, null, 10);
    expect(r.level).toBe('unavailable');
  });

  it('agree at exact boundary: height=20%, period=1.5s → caution (>20 or >1.5 is caution)', () => {
    // 20% and 1.5s are the caution thresholds; values AT the boundary do NOT trigger caution
    const r = classifyAgreement(1.0, 1.2, 10, 11.5);
    // heightDiff = 20%, periodDiff = 1.5s — neither strictly > threshold → agree
    expect(r.level).toBe('agree');
  });

  it('caution at just over boundary: height=20.01%', () => {
    const r = classifyAgreement(1.0, 1.2001, 10, 10);
    expect(r.level).toBe('caution');
  });
});
