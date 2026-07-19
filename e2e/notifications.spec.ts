/// <reference types="node" />
import { expect, test } from '@playwright/test';

import { LIVE, loginViaUI } from './helpers/e2e-live';

// @extended (nightly, not PR): the notification panel flow (bell → open → mark
// read → badge decrements) needs a seeded account with unread notifications.
// Non-blocking edge journey — runs in the nightly full suite.

test.describe('@extended Notification panel (live)', () => {
  test.skip(!LIVE, 'requires a live backend + a seeded account with unread notifications');

  test('bell opens the panel; marking a notification read decrements the badge', async ({ page }) => {
    await loginViaUI(page);

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
