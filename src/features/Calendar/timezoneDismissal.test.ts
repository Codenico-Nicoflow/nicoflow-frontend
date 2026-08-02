import { beforeEach, describe, expect, it } from 'vitest';

import { clearDriftDismissal, dismissDrift, isDriftDismissed } from './timezoneDismissal';

describe('timezone drift dismissal', () => {
  beforeEach(() => window.localStorage.clear());

  it('is not dismissed by default', () => {
    expect(isDriftDismissed('Asia/Jerusalem', 'Europe/London')).toBe(false);
  });

  it('remembers a dismissed pair', () => {
    dismissDrift('Asia/Jerusalem', 'Europe/London');
    expect(isDriftDismissed('Asia/Jerusalem', 'Europe/London')).toBe(true);
  });

  it('still prompts for a different browser zone', () => {
    // Waving away one trip must not silence the banner for the next one.
    dismissDrift('Asia/Jerusalem', 'Europe/London');
    expect(isDriftDismissed('Asia/Jerusalem', 'America/New_York')).toBe(false);
  });

  it('still prompts when the account zone changes', () => {
    dismissDrift('Asia/Jerusalem', 'Europe/London');
    expect(isDriftDismissed('UTC', 'Europe/London')).toBe(false);
  });

  it('clears a recorded dismissal', () => {
    dismissDrift('Asia/Jerusalem', 'Europe/London');
    clearDriftDismissal();
    expect(isDriftDismissed('Asia/Jerusalem', 'Europe/London')).toBe(false);
  });
});
