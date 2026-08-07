import type { Transition, Variants } from 'framer-motion';

export interface BurstParticle {
  index: number;
  angle: number;
  x: number;
  y: number;
}

const PARTICLE_COUNT = 6;
const BURST_RADIUS = 18;
const BURST_TRANSITION_DURATION = 0.5;

export const BURST_PARTICLES: BurstParticle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i * 360) / PARTICLE_COUNT;
  const rad = (angle * Math.PI) / 180;
  return { index: i, angle, x: Math.cos(rad) * BURST_RADIUS, y: Math.sin(rad) * BURST_RADIUS };
});

export function buildCheckboxVariants(reducedMotion: boolean | null): Variants {
  if (reducedMotion) {
    return {
      idle: { scale: 1 },
      completing: { scale: 1 },
      uncompleting: { scale: 1 },
    };
  }
  return {
    idle: { scale: 1 },
    completing: { scale: [1, 1.35, 0.92, 1.08, 1] },
    uncompleting: { scale: [1, 0.9, 1] },
  };
}

export function buildCheckboxTransition(reducedMotion: boolean | null): Transition {
  if (reducedMotion) return { duration: 0 };
  return { duration: 0.42, times: [0, 0.25, 0.55, 0.8, 1], ease: 'easeOut' };
}

export function buildBurstVariants(particle: BurstParticle): Variants {
  return {
    hidden: { opacity: 0, x: 0, y: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0],
      x: particle.x,
      y: particle.y,
      scale: [0, 1, 0.6],
    },
  };
}

export const BURST_TRANSITION: Transition = { duration: BURST_TRANSITION_DURATION, ease: 'easeOut' };
