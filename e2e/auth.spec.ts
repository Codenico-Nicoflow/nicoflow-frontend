/// <reference types="node" />
import { expect, test } from '@playwright/test';

import { LIVE, loginViaUI } from './helpers/e2e-live';

const EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';
const PASSWORD_PLACEHOLDER = '••••••••';

// A fresh, syntactically valid but unregistered username/email for register specs.
function freshIdentity(): { email: string; username: string } {
  const uid = `${process.env['GITHUB_RUN_ID'] ?? 'local'}-${Date.now()}`;
  return {
    email: `e2e+${uid}@nicoflow.test`,
    // Username is alphanumeric-only (max 20) — strip the hyphen/plus from uid.
    username: `e2e${uid}`.replace(/[^a-z0-9]/gi, '').slice(0, 20),
  };
}

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
    const { email, username } = freshIdentity();

    await page.goto('/sign-up');
    await page.getByPlaceholder('yourname').fill(username);
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).first().fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  // A4 — wrong password stays on sign-in and surfaces an error (no navigation).
  test('login with a wrong password shows an error and stays on sign-in', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill('Wrong-Password-123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // An error toast appears and we never leave /sign-in.
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('@extended Auth edge cases (live)', () => {
  test.skip(!LIVE, 'requires live staging');

  // A5 — invalid username (contains a symbol) blocks submit with an inline error.
  test('register with an invalid username shows an inline error, no submit', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByPlaceholder('yourname').fill('bad!name');
    await page.getByPlaceholder('you@example.com').fill('e2e+badusername@nicoflow.test');
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).first().fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Inline validation error (FormMessage → role=alert); still on the form.
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText(/check your email/i)).toHaveCount(0);
  });

  // A6 — weak password (no uppercase) shows an inline password error.
  test('register with a weak password shows an inline error', async ({ page }) => {
    const { email, username } = freshIdentity();
    await page.goto('/sign-up');
    await page.getByPlaceholder('yourname').fill(username);
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).first().fill('alllowercase1');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText(/check your email/i)).toHaveCount(0);
  });

  // A7 — registering the existing account's email surfaces an error (no enumeration leak).
  test('register with a duplicate email surfaces an error', async ({ page }) => {
    const { username } = freshIdentity();
    await page.goto('/sign-up');
    await page.getByPlaceholder('yourname').fill(username);
    await page.getByPlaceholder('you@example.com').fill(EMAIL);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).first().fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Server rejects → error toast; we don't reach the check-your-email screen.
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    await expect(page.getByText(/check your email/i)).toHaveCount(0);
  });

  // A8 — forgot-password with a known email returns the neutral "check inbox" confirmation.
  test('forgot-password with a known email shows the neutral confirmation', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByPlaceholder('you@example.com').fill(EMAIL);
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  // A9 — forgot-password with a malformed email shows an inline email error.
  test('forgot-password with an invalid email shows an inline error', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByPlaceholder('you@example.com').fill('not-an-email');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText(/check your inbox/i)).toHaveCount(0);
  });

  // A10 — a protected route while logged out redirects to /sign-in, preserving `from`.
  test('visiting a protected route while logged out redirects to sign-in', async ({ page }) => {
    await page.goto('/areas');
    await expect(page).toHaveURL(/sign-in/);
  });

  // A11 — mismatched new/confirm on the reset page is caught client-side, before any API
  // call, so a dummy token is enough to render the form (the mismatch error fires first).
  test('reset-password with mismatched passwords shows an error', async ({ page }) => {
    await page.goto('/reset-password?token=e2e-dummy-token');
    const inputs = page.getByPlaceholder(PASSWORD_PLACEHOLDER);
    await inputs.nth(0).fill(PASSWORD);
    await inputs.nth(1).fill('Different-Password-123');
    await page.getByRole('button', { name: /reset password/i }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/reset-password/);
  });
});
