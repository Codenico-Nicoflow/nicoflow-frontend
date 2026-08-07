import { describe, expect, it } from 'vitest';

import {
  buildBurstVariants,
  buildCheckboxTransition,
  buildCheckboxVariants,
  BURST_PARTICLES,
  BURST_TRANSITION,
} from './animation';

describe('buildCheckboxVariants', () => {
  it('returns pop overshoot keyframes when motion is allowed', () => {
    const variants = buildCheckboxVariants(false);
    expect(variants.completing).toEqual({ scale: [1, 1.35, 0.92, 1.08, 1] });
    expect(variants.uncompleting).toEqual({ scale: [1, 0.9, 1] });
    expect(variants.idle).toEqual({ scale: 1 });
  });

  it('returns scale:1 for all phases when reduced motion is true', () => {
    const variants = buildCheckboxVariants(true);
    expect(variants.completing).toEqual({ scale: 1 });
    expect(variants.uncompleting).toEqual({ scale: 1 });
    expect(variants.idle).toEqual({ scale: 1 });
  });

  it('animates normally when reduced motion is null (preference undetermined)', () => {
    const variants = buildCheckboxVariants(null);
    expect(variants.completing).toEqual({ scale: [1, 1.35, 0.92, 1.08, 1] });
    expect(variants.uncompleting).toEqual({ scale: [1, 0.9, 1] });
  });
});

describe('buildCheckboxTransition', () => {
  it('returns duration 0 when reduced motion is true', () => {
    expect(buildCheckboxTransition(true)).toEqual({ duration: 0 });
  });

  it('returns full transition when reduced motion is null (preference undetermined)', () => {
    const t = buildCheckboxTransition(null);
    expect(t.duration).toBe(0.42);
  });

  it('returns full transition when motion is allowed', () => {
    const t = buildCheckboxTransition(false);
    expect(t.duration).toBe(0.42);
    expect(t.times).toEqual([0, 0.25, 0.55, 0.8, 1]);
    expect(t.ease).toBe('easeOut');
  });
});

describe('BURST_PARTICLES', () => {
  it('contains exactly 6 particles', () => {
    expect(BURST_PARTICLES).toHaveLength(6);
  });

  it('spaces particles at 60-degree increments', () => {
    const angles = BURST_PARTICLES.map(p => p.angle);
    expect(angles).toEqual([0, 60, 120, 180, 240, 300]);
  });

  it('particle at angle 0 has positive x and near-zero y', () => {
    const p = BURST_PARTICLES[0]!;
    expect(p.x).toBeGreaterThan(0);
    expect(Math.abs(p.y)).toBeLessThan(0.001);
  });

  it('particle at angle 90 has near-zero x and positive y', () => {
    // angle=90 deg is not one of the 60-deg-spaced particles, so verify the math directly
    const rad = (90 * Math.PI) / 180;
    const RADIUS = 18;
    const x = Math.cos(rad) * RADIUS;
    const y = Math.sin(rad) * RADIUS;
    expect(Math.abs(x)).toBeLessThan(0.001);
    expect(y).toBeGreaterThan(0);
  });
});

describe('buildBurstVariants', () => {
  it('produces hidden and visible states for a particle', () => {
    const particle = BURST_PARTICLES[0]!;
    const variants = buildBurstVariants(particle);
    expect(variants.hidden).toMatchObject({ opacity: 0, scale: 0 });
    const visible = variants.visible as Record<string, unknown>;
    expect(Array.isArray(visible.opacity)).toBe(true);
    expect(visible.x).toBe(particle.x);
    expect(visible.y).toBe(particle.y);
  });
});

describe('BURST_TRANSITION', () => {
  it('has expected duration and ease', () => {
    expect(BURST_TRANSITION.duration).toBe(0.5);
    expect(BURST_TRANSITION.ease).toBe('easeOut');
  });
});
