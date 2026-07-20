/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import {
  ACCOUNT_FIRST_NAME_INPUT,
  ACCOUNT_SAVE_BUTTON,
  SECURITY_CONFIRM_PASSWORD_INPUT,
  SECURITY_CURRENT_PASSWORD_INPUT,
  SECURITY_NEW_PASSWORD_INPUT,
  SECURITY_SAVE_BUTTON,
} from '../src/lib/test_ids';

import { apiBase, apiDirect, getToken, LIVE } from './helpers/e2e-live';

const EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';

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

test.describe('@extended Settings (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // S2 — switching language to Hebrew flips the document to RTL and persists.
  test('switching language to Hebrew applies RTL, then restores', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const auth = { Authorization: `Bearer ${token}` };
    const original = (await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json()).data
      .language as string;

    try {
      await page.goto('/settings');
      await page.getByTestId('settings-language-select').click();
      await page.getByTestId('settings-language-he').click();

      // he is RTL — the document direction flips.
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

      const after = await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json();
      expect(after.data.language).toBe('he');
    } finally {
      await api.patch(`${apiBase}/users/me`, { headers: auth, data: { language: original ?? 'en' } });
      await api.dispose();
    }
  });

  // S3 — edit the first name; it persists and shows after reload.
  test('editing the first name persists across reload', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const auth = { Authorization: `Bearer ${token}` };
    const original = (await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json()).data
      .firstName as string;
    const next = `E2E${Date.now() % 100000}`;

    try {
      await page.goto('/settings');
      const input = page.getByTestId(ACCOUNT_FIRST_NAME_INPUT);
      await input.fill(next);
      await page.getByTestId(ACCOUNT_SAVE_BUTTON).click();

      const after = await (await api.get(`${apiBase}/users/profile`, { headers: auth })).json();
      expect(after.data.firstName).toBe(next);

      await page.reload();
      await expect(page.getByTestId(ACCOUNT_FIRST_NAME_INPUT)).toHaveValue(next);
    } finally {
      await api.patch(`${apiBase}/users/me`, { headers: auth, data: { firstName: original } });
      await api.dispose();
    }
  });

  // S4 — a blank first name shows an inline validation error (no save).
  test('a blank first name shows an inline error', async ({ page }) => {
    await page.goto('/settings');
    const input = page.getByTestId(ACCOUNT_FIRST_NAME_INPUT);
    await input.fill('temp');
    await input.fill('');
    await input.blur();
    await page.getByTestId(ACCOUNT_SAVE_BUTTON).click();

    await expect(page.getByTestId('form-message').first()).toBeVisible();
  });

  // S5 — change the password (correct current + valid new), then restore it via the
  // API so the shared account keeps its known password.
  test('change password succeeds, then restores', async ({ page }) => {
    const tempPassword = `E2eTemp-${Date.now()}`;
    const api = await playwrightRequest.newContext();
    let changed = false;

    try {
      await page.goto('/settings');
      await page.getByTestId(SECURITY_CURRENT_PASSWORD_INPUT).fill(PASSWORD);
      await page.getByTestId(SECURITY_NEW_PASSWORD_INPUT).fill(tempPassword);
      await page.getByTestId(SECURITY_CONFIRM_PASSWORD_INPUT).fill(tempPassword);
      await page.getByTestId(SECURITY_SAVE_BUTTON).click();

      await expect(page.locator('[data-sonner-toast]')).toBeVisible();
      changed = true;
    } finally {
      if (changed) {
        // Log in with the temp password to get a fresh token, then change back.
        const login = await api.post(`${apiDirect}/auth/login`, {
          data: { identifier: EMAIL, password: tempPassword, remember: true },
          headers: process.env['E2E_BYPASS_TOKEN'] ? { 'X-E2E-Bypass': process.env['E2E_BYPASS_TOKEN'] } : {},
        });
        const token = (await login.json())?.data?.token as string;
        await api.post(`${apiDirect}/auth/change-password`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { currentPassword: tempPassword, newPassword: PASSWORD, confirmPassword: PASSWORD },
        });
      }
      await api.dispose();
    }
  });

  // S6 — a wrong current password surfaces a field error (server 401 → inline).
  test('change password with a wrong current password shows an error', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId(SECURITY_CURRENT_PASSWORD_INPUT).fill('Wrong-Current-123');
    await page.getByTestId(SECURITY_NEW_PASSWORD_INPUT).fill('BrandNew-Pass-1');
    await page.getByTestId(SECURITY_CONFIRM_PASSWORD_INPUT).fill('BrandNew-Pass-1');
    await page.getByTestId(SECURITY_SAVE_BUTTON).click();

    await expect(page.getByTestId('form-message').first()).toBeVisible();
  });

  // S7 — a new password equal to the current is rejected client-side.
  test('change password with new equal to current shows an error', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId(SECURITY_CURRENT_PASSWORD_INPUT).fill(PASSWORD);
    await page.getByTestId(SECURITY_NEW_PASSWORD_INPUT).fill(PASSWORD);
    await page.getByTestId(SECURITY_CONFIRM_PASSWORD_INPUT).fill(PASSWORD);
    await page.getByTestId(SECURITY_SAVE_BUTTON).click();

    await expect(page.getByTestId('form-message').first()).toBeVisible();
  });
});
