/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, getToken, LIVE } from './helpers/e2e-live';

// @core Settings — a real user switching the theme in Preferences and seeing the
// app repaint. Asserts the DOM effect (the `dark` class on <html>). Theme
// persists to the shared account, so the original is restored in finally.
test.describe('@core Settings preferences (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('switching the theme to dark applies it, then restores', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const auth = { Authorization: `Bearer ${token}` };
    const originalTheme = (await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json()).data
      .theme as string;

    try {
      await page.goto('/settings');

      // Pick "dark" from the theme select.
      await page.getByTestId('settings-theme-select').click();
      await page.getByTestId('settings-theme-dark').click();

      // next-themes writes the class onto <html>; the app is now dark.
      await expect(page.locator('html')).toHaveClass(/dark/);

      // And it persisted to the account.
      const after = await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json();
      expect(after.data.theme).toBe('dark');
    } finally {
      await api.patch(`${apiBase}/users/me`, { headers: auth, data: { theme: originalTheme } });
      await api.dispose();
    }
  });
});
