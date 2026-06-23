/// <reference types="node" />
import { expect, test } from '@playwright/test';

const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Password1test';
const TEST_USERNAME = process.env['E2E_TEST_USERNAME'] ?? 'e2etestuser';

// E2E_LIVE marks tests that need a real backend behind the frontend (not the
// mocked CI build). They stay inert in the default mocked CI run and turn on
// when the suite is pointed at a live deployment — e.g. a nightly run against
// staging with PLAYWRIGHT_BASE_URL set. Tests that additionally need a *seeded,
// pre-verified* account stay fully skipped until the nightly epic provides one.
const LIVE = !!process.env['E2E_LIVE'];

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

  // Fully skipped (not just live-gated): needs a real backend AND a *pre-verified*
  // seeded account (staging enforces REQUIRE_EMAIL_VERIFICATION, so you can't
  // register-then-login in one run — the email link must be clicked). Un-skip when
  // the nightly-against-staging epic provides a seeded verified test user; it'll
  // also supply E2E_TEST_EMAIL / E2E_TEST_PASSWORD. Tracked: nightly E2E epic.
  test.skip('login with valid credentials navigates to app', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/quick-access\/bucket/);
  });

  // Fully skipped: same seeded-verified-account dependency as the login test
  // above, plus it exercises the cross-site refresh cookie on reload. Un-skip with
  // the nightly-against-staging epic. (The cross-site cookie + reload behaviour was
  // already verified manually against staging.)
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

  // Live-only: needs a real backend (registers a fresh, unique account each run),
  // but NOT a pre-seeded one — so it runs whenever E2E_LIVE is set. Skipped in the
  // default mocked CI run. Register no longer logs the user in: it stays on
  // /sign-up and shows a "check your email" confirmation; the user must verify,
  // then sign in.
  test(
    LIVE ? 'register shows the check-your-email panel (no auto-login)' : 'register [live-only, skipped]',
    async ({ page }) => {
      test.skip(!LIVE, 'requires a live backend — set E2E_LIVE (e.g. nightly against staging)');
      const uniqueEmail = `e2e+${Date.now()}@nicoflow.test`;
      await page.goto('/sign-up');
      await page.getByLabel(/username/i).fill(TEST_USERNAME);
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /create account/i }).click();
      await expect(page.getByText(/check your email/i)).toBeVisible();
      await expect(page).toHaveURL(/sign-up/);
    }
  );
});
