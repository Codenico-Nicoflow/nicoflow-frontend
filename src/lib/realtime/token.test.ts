import { describe, expect, it } from 'vitest';

import { isTokenExpiring, jwtExpiryMs } from './token';

// Build a JWT with the given exp (seconds). Only the payload segment matters here —
// signature is irrelevant to a client-side exp read.
const jwtWithExp = (expSeconds: number): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'u1', exp: expSeconds }));
  return `${header}.${payload}.sig`;
};

describe('jwtExpiryMs', () => {
  it('reads exp (ms) from a well-formed token', () => {
    expect(jwtExpiryMs(jwtWithExp(1_700_000_000))).toBe(1_700_000_000_000);
  });

  it('returns null for a non-JWT or missing exp', () => {
    expect(jwtExpiryMs('garbage')).toBeNull();
    expect(jwtExpiryMs(`${btoa('{}')}.${btoa(JSON.stringify({ sub: 'u1' }))}.s`)).toBeNull();
  });
});

describe('isTokenExpiring', () => {
  it('is true for a null token', () => {
    expect(isTokenExpiring(null)).toBe(true);
  });

  it('is true within the skew window, false comfortably ahead', () => {
    const soon = Math.floor((Date.now() + 10_000) / 1000); // 10s out, inside 30s skew
    const later = Math.floor((Date.now() + 120_000) / 1000); // 2min out
    expect(isTokenExpiring(jwtWithExp(soon))).toBe(true);
    expect(isTokenExpiring(jwtWithExp(later))).toBe(false);
  });

  it('treats an unreadable exp as fresh (never wedges the socket)', () => {
    expect(isTokenExpiring('not-a-jwt')).toBe(false);
  });
});
