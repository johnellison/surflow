/**
 * Tests for the Bukit Peninsula swell shadowing correction.
 */
import { describe, it, expect } from 'vitest';
import { bukitShadowSeverity, bukitShadow } from '../src/forecast/shadowing';

describe('bukitShadowSeverity', () => {
  it('dead center (210° SSW) → severity 1.0', () => {
    expect(bukitShadowSeverity(210)).toBe(1);
  });

  it('shadow edge (190° and 230°) → severity 0 (no shadow)', () => {
    expect(bukitShadowSeverity(190)).toBe(0);
    expect(bukitShadowSeverity(230)).toBe(0);
  });

  it('halfway between center and edge (200°) → severity 0.5', () => {
    expect(bukitShadowSeverity(200)).toBeCloseTo(0.5, 1);
  });

  it('well outside shadow (180° S, 270° W) → 0', () => {
    expect(bukitShadowSeverity(180)).toBe(0);
    expect(bukitShadowSeverity(270)).toBe(0);
    expect(bukitShadowSeverity(90)).toBe(0);
  });

  it('wraps around 360° correctly (30° is far from 210°)', () => {
    expect(bukitShadowSeverity(30)).toBe(0);
  });
});

describe('bukitShadow', () => {
  it('returns null outside the shadow zone', () => {
    expect(bukitShadow(180)).toBeNull();
    expect(bukitShadow(90)).toBeNull();
    expect(bukitShadow(270)).toBeNull();
  });

  it('at dead center (210°): height retains ~35%, period retains ~75%', () => {
    const s = bukitShadow(210)!;
    expect(s.severity).toBe(1);
    expect(s.heightFactor).toBeCloseTo(0.35, 2);
    expect(s.periodFactor).toBeCloseTo(0.75, 2);
  });

  it('2.3m @ 210° → effective ~0.8m (65% discount)', () => {
    const s = bukitShadow(210)!;
    const effective = 2.3 * s.heightFactor;
    expect(effective).toBeCloseTo(0.805, 1);
  });

  it('16s period @ 210° → effective ~12s', () => {
    const s = bukitShadow(210)!;
    const effective = 16 * s.periodFactor;
    expect(effective).toBeCloseTo(12, 0);
  });

  it('at shadow edge (190°): no shadow applied', () => {
    expect(bukitShadow(190)).toBeNull();
  });

  it('between center and edge (205°): moderate discount', () => {
    const s = bukitShadow(205)!;
    expect(s.severity).toBeCloseTo(0.75, 2);
    // Height factor between 0.35 and 1.0
    expect(s.heightFactor).toBeGreaterThan(0.35);
    expect(s.heightFactor).toBeLessThan(1.0);
  });
});
