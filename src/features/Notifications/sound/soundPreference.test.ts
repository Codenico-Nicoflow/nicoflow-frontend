import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSoundMuted, setSoundMuted, subscribeSoundMuted } from './soundPreference';

afterEach(() => {
  localStorage.clear();
  setSoundMuted(false);
  localStorage.clear();
});

describe('soundPreference', () => {
  it('defaults to not muted', () => {
    expect(isSoundMuted()).toBe(false);
  });

  it('persists the muted flag to localStorage', () => {
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
    expect(localStorage.getItem('nicoflow-notification-sound-muted')).toBe('true');

    setSoundMuted(false);
    expect(isSoundMuted()).toBe(false);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const fn = vi.fn();
    const unsubscribe = subscribeSoundMuted(fn);

    setSoundMuted(true);
    expect(fn).toHaveBeenCalledTimes(1);

    unsubscribe();
    setSoundMuted(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
