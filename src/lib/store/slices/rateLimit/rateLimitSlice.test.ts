import { describe, expect, it } from 'vitest';

import reducer, { clearRateLimit, setRateLimited } from './rateLimitSlice';

describe('rateLimitSlice', () => {
  it('starts with no retry time', () => {
    expect(reducer(undefined, { type: '@@init' })).toEqual({ retryAt: null });
  });

  it('sets the retry time', () => {
    const next = reducer({ retryAt: null }, setRateLimited(1000));
    expect(next.retryAt).toBe(1000);
  });

  it('keeps the furthest-out retry time on a burst of 429s', () => {
    const first = reducer({ retryAt: null }, setRateLimited(2000));
    const second = reducer(first, setRateLimited(1500));
    expect(second.retryAt).toBe(2000);
  });

  it('clears the retry time', () => {
    expect(reducer({ retryAt: 5000 }, clearRateLimit()).retryAt).toBeNull();
  });
});
