/// <reference types="node" />
import { expect, test } from '@playwright/test';

// The notification panel flow (bell → open → mark read → badge decrements) needs a
// real backend behind the frontend AND a seeded, verified account with unread
// notifications. Like the other live journeys it stays inert in the mocked CI run
// and turns on when the suite is pointed at a live deployment with E2E_LIVE set
// (the nightly-against-staging epic). Kept here so the coverage lands the moment
// that infra exists — no rewrite needed.
const LIVE = !!process.env['E2E_LIVE'];

const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Password1test';
const PASSWORD_PLACEHOLDER = '••••••••';

test.describe('Notification panel', () => {
  test.skip(!LIVE, 'requires a live backend + a seeded account with unread notifications');

  test('bell opens the panel; marking a notification read decrements the badge', async ({ page }) => {
    // Sign in.
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/sign-in/);

    const bell = page.getByTestId('notification-bell');
    await expect(bell).toBeVisible();

    // Capture the starting unread count from the badge (assumes ≥1 unread seeded).
    const badge = page.getByTestId('notification-badge');
    await expect(badge).toBeVisible();
    const before = Number((await badge.textContent())?.replace('+', '') ?? '0');
    expect(before).toBeGreaterThan(0);

    // Open the panel and mark the first unread notification read.
    await bell.click();
    await expect(page.getByTestId('notification-panel')).toBeVisible();
    await page.getByTestId('notification-row').first().hover();
    await page.getByTestId('mark-read-button').first().click();

    // The badge count should drop (or the badge disappears when it hits zero).
    await expect
      .poll(async () => {
        if (!(await badge.isVisible())) return 0;
        return Number((await badge.textContent())?.replace('+', '') ?? '0');
      })
      .toBeLessThan(before);
  });
});
