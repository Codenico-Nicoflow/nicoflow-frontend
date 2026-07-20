/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { freePlanConfigured, LIVE, newFreePlanContext } from './helpers/e2e-live';

// @extended Plan limits — FREE-plan upgrade prompts via a separate free-plan
// context. That account must be seeded at its limits (≥3 areas, ≥5 projects).
test.describe('@extended Plan limits (live)', () => {
  test.skip(!LIVE, 'requires live staging');
  test.skip(!freePlanConfigured(), 'requires a seeded FREE-plan account — set E2E_FREE_EMAIL / E2E_FREE_PASSWORD');

  // AR6 — a free user at the area limit sees the new-area button disabled and the
  // upgrade prompt, not a generic error.
  test('free user at the area limit sees the upgrade prompt, not a create button', async ({ browser }) => {
    const api = await playwrightRequest.newContext();
    const ctx = await newFreePlanContext(browser, api);
    try {
      const page = await ctx.newPage();
      await page.goto('/areas');

      await expect(page.getByTestId('board-new-area')).toBeDisabled();
      await expect(page.getByTestId('plan-limit-alert')).toBeVisible();
    } finally {
      await ctx.close();
      await api.dispose();
    }
  });

  // P8 — a free user at the project limit sees the add-project affordance disabled
  // and the same upgrade prompt.
  test('free user at the project limit sees the add-project control disabled', async ({ browser }) => {
    const api = await playwrightRequest.newContext();
    const ctx = await newFreePlanContext(browser, api);
    try {
      const page = await ctx.newPage();
      await page.goto('/areas');

      // The board-level add-project button (header) is disabled at the limit, and
      // the upgrade prompt is shown.
      await expect(page.getByTestId('board-new-project')).toBeDisabled();
      await expect(page.getByTestId('plan-limit-alert')).toBeVisible();
    } finally {
      await ctx.close();
      await api.dispose();
    }
  });
});
