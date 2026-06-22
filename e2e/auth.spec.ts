/// <reference types="node" />
import { expect, test } from '@playwright/test';

const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Password1test';
const TEST_USERNAME = process.env['E2E_TEST_USERNAME'] ?? 'e2etestuser';

// Password inputs are wrapped in a relative div for the show/hide toggle.
// getByLabel(/password/i) matches the "Show password" button (aria-label).
// Use the placeholder instead to target the actual <input>.
const PASSWORD_PLACEHOLDER = '••••••••';

test.describe('Auth guard', () => {
  test('unauthenticated user is redirected to /sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('/quick-access/bucket redirects to /sign-in when not logged in', async ({ page }) => {
    await page.goto('/quick-access/bucket');
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Login flow', () => {
  test('shows sign-in form', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(PASSWORD_PLACEHOLDER)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login with bad credentials shows error and stays on sign-in', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill('wrongpassword1A');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/sign-in/);
  });

  test.skip('login with valid credentials navigates to app', async ({ page }) => {
    // Requires a real backend with seeded test credentials.
    // Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars to run.
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/quick-access\/bucket/);
  });

  test.skip('session persists after page reload', async ({ page }) => {
    // Login first
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/quick-access\/bucket/);

    // Reload — should stay in app, not redirect to sign-in
    await page.reload();
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

test.describe('Register flow', () => {
  test('shows register form', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(PASSWORD_PLACEHOLDER)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test.skip('register shows the check-your-email panel (no auto-login)', async ({ page }) => {
    // Requires a live backend; each run needs a unique email.
    // Register no longer logs the user in — it stays on /sign-up and shows a
    // "check your email" confirmation; the user must verify, then sign in.
    const uniqueEmail = `e2e+${Date.now()}@nicoflow.test`;
    await page.goto('/sign-up');
    await page.getByLabel(/username/i).fill(TEST_USERNAME);
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible();
    await expect(page).toHaveURL(/sign-up/);
  });
});
