/// <reference types="node" />
import { expect, test } from '@playwright/test';

import { LIVE, loginViaUI } from './helpers/e2e-live';

// @extended (nightly, not PR): Focus needs a seeded account with at least one
// live task. Non-blocking edge journey — runs in the nightly full suite.

test.describe('@extended Focus — happy path (live)', () => {
  test.skip(!LIVE, 'requires a live backend + seeded verified account with live tasks — set E2E_LIVE');

  // Pick a time window → ranked list → Start the top task into the NOW card →
  // Done runs the loop, all without leaving Focus.
  test('pick 30m → ranked list → Start → Done the current task', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/quick-access/focus');

    // Default state: prompt to pick time first, no list yet.
    await expect(page.getByTestId('focus-time-prompt')).toBeVisible();

    await page.getByTestId('focus-time-m30').click();

    const list = page.getByTestId('focus-list');
    const empty = page.getByTestId('focus-empty');
    await expect(list.or(empty)).toBeVisible();

    if (await list.isVisible()) {
      await list
        .getByTestId(/^focus-start-/)
        .first()
        .click();
      // Start opens the NOW card in-place — Focus stays put.
      await expect(page.getByTestId('focus-now-card')).toBeVisible();

      await page.getByTestId('focus-done').click();
      // Loop continues: either the next NOW card or the encouraging empty.
      await expect(page.getByTestId('focus-now-card').or(empty)).toBeVisible();
    } else {
      // Over-budget empties must stay encouraging, never a dead end.
      await expect(page.getByTestId('focus-empty-clear')).toBeVisible();
    }
  });
});
