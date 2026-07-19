/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, getToken, LIVE } from './helpers/e2e-live';

// @core Settings persistence: change theme → verify it persisted → RESTORE the
// original in finally (this mutates the shared account, so it must clean up its
// change, not a row).

test.describe('@core Settings persistence (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('changing theme persists, then is restored', async () => {
    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };

    const profile = await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json();
    const originalTheme = profile.data.theme as string;
    const nextTheme = originalTheme === 'dark' ? 'light' : 'dark';

    try {
      const patched = await api.patch(`${apiBase}/users/me`, { headers: auth, data: { theme: nextTheme } });
      expect(patched.ok()).toBeTruthy();
      expect((await patched.json()).data.theme).toBe(nextTheme);

      const after = await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json();
      expect(after.data.theme).toBe(nextTheme);
    } finally {
      await api.patch(`${apiBase}/users/me`, { headers: auth, data: { theme: originalTheme } });
      await api.dispose();
    }
  });
});
