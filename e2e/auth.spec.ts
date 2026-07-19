/// <reference types="node" />
import { expect, test } from '@playwright/test';

import { LIVE, loginViaUI } from './helpers/e2e-live';

const PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';
const PASSWORD_PLACEHOLDER = '••••••••';

test.describe('@core Auth journey (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('login lands in the app then logout returns to sign-in', async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL(/quick-access/);

    // Avatar menu → "Log out" item → confirm dialog → "Log out" accept.
    // Exact match so "Log out" doesn't also grab "Log out all devices".
    await page.getByRole('button', { name: /account menu/i }).click();
    await page.getByRole('menuitem', { name: 'Log out', exact: true }).click();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/sign-in/);
  });

  test('register shows the check-your-email screen', async ({ page }) => {
    const uid = `${process.env['GITHUB_RUN_ID'] ?? 'local'}-${Date.now()}`;
    const email = `e2e+${uid}@nicoflow.test`;
    // Username is alphanumeric-only (max 20) — strip the hyphen/plus from uid.
    const username = `e2e${uid}`.replace(/[^a-z0-9]/gi, '').slice(0, 20);

    await page.goto('/sign-up');
    await page.getByPlaceholder('yourname').fill(username);
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).first().fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText(/check your email/i)).toBeVisible();
  });
});
