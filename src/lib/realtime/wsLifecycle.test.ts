import { afterEach, describe, expect, it, vi } from 'vitest';

import { createWebWSLifecycleAdapter } from './wsLifecycle';

// jsdom's `document.visibilityState` is a getter with no public setter; stub it
// per test the way the app's own visibility-driven code already does elsewhere.
const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

describe('createWebWSLifecycleAdapter', () => {
  afterEach(() => {
    setVisibility('visible');
  });

  it('isForeground reflects the current visibilityState', () => {
    setVisibility('visible');
    expect(createWebWSLifecycleAdapter().isForeground()).toBe(true);

    setVisibility('hidden');
    expect(createWebWSLifecycleAdapter().isForeground()).toBe(false);
  });

  it('onForeground fires only when visibilityState becomes visible', () => {
    const adapter = createWebWSLifecycleAdapter();
    const cb = vi.fn();
    adapter.onForeground(cb);

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).not.toHaveBeenCalled();

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onBackground fires only when visibilityState becomes hidden', () => {
    const adapter = createWebWSLifecycleAdapter();
    const cb = vi.fn();
    adapter.onBackground(cb);

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).not.toHaveBeenCalled();

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('the returned unsubscribe function stops further callbacks', () => {
    const adapter = createWebWSLifecycleAdapter();
    const cb = vi.fn();
    const unsubscribe = adapter.onForeground(cb);

    unsubscribe();

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(cb).not.toHaveBeenCalled();
  });

  it('onForeground and onBackground on the same adapter are independent subscriptions', () => {
    const adapter = createWebWSLifecycleAdapter();
    const onFg = vi.fn();
    const onBg = vi.fn();
    adapter.onForeground(onFg);
    adapter.onBackground(onBg);

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onBg).toHaveBeenCalledTimes(1);
    expect(onFg).not.toHaveBeenCalled();

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onFg).toHaveBeenCalledTimes(1);
    expect(onBg).toHaveBeenCalledTimes(1);
  });
});
