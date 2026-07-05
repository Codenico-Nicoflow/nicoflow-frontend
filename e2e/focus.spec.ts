/// <reference types="node" />
import { expect, type Page, test } from '@playwright/test';

// Mirrors e2e/areas-projects.spec.ts: this journey needs a real backend (or a
// staging URL via PLAYWRIGHT_BASE_URL) AND a seeded, pre-verified account with
// at least one live task, so it stays skipped in the mocked CI run and turns on
// for the nightly-against-staging epic via E2E_LIVE.
const LIVE = !!process.env['E2E_LIVE'];
const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Password1test';
const PASSWORD_PLACEHOLDER = '••••••••';

async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/sign-in/);
}

test.describe('Focus — happy path (live)', () => {
  test.skip(!LIVE, 'requires a live backend + seeded verified account with live tasks — set E2E_LIVE');

  // NIC-1386 AC1+AC2: open Focus, pick 30m/Low, Start the top task.
  test('pick 30m/Low → ranked list → Start the top task', async ({ page }) => {
    await signIn(page);
    await page.goto('/quick-access/focus');

    await page.getByTestId('focus-time-m30').click();
    await page.getByTestId('focus-energy-low').click();

    const list = page.getByTestId('focus-list');
    const empty = page.getByTestId('focus-empty');
    await expect(list.or(empty)).toBeVisible();

    if (await list.isVisible()) {
      const startButtons = list.getByTestId(/^focus-start-/);
      await startButtons.first().click();
      // Start commits: the task becomes active + scheduled today (toast confirms).
      await expect(page.getByText(/started/i).first()).toBeVisible();
    } else {
      // Over-budget empties must stay encouraging, never a dead end.
      await expect(page.getByTestId('focus-empty-clear')).toBeVisible();
    }
  });
});
