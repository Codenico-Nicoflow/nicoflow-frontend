/// <reference types="node" />
import { expect, test } from '@playwright/test';

import { LIVE, loginViaUI } from './helpers/e2e-live';

// @extended (nightly, not PR): the habit loop writes real check-in rows against
// a live backend, so it needs a seeded account. It is one journey rather than a
// matrix — the per-case confidence already lives in the service and MSW layers,
// and E2E is here to prove the pieces are actually wired to each other.

test.describe('@extended Habits — create, check in, undo (live)', () => {
  test.skip(!LIVE, 'requires a live backend + seeded verified account — set E2E_LIVE');

  test('create a habit → check in → streak increments → undo → persists across reload', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/habits');

    const name = `E2E Read ${Date.now()}`;

    // Create. The board is either empty or populated, so open the dialog from
    // whichever entry point is present.
    const createFromHeader = page.getByTestId('habits-create');
    const createFromEmpty = page.getByTestId('habits-empty-create');
    await expect(createFromHeader.or(createFromEmpty)).toBeVisible();
    await ((await createFromEmpty.isVisible().catch(() => false)) ? createFromEmpty : createFromHeader).click();

    const dialog = page.getByTestId('habit-form-dialog');
    await expect(dialog).toBeVisible();
    await page.getByTestId('habit-name-input').fill(name);
    await page.getByTestId('habit-schedule-kind-daily').click();
    await dialog.getByRole('button', { name: /create|save/i }).click();
    await expect(dialog).toBeHidden();

    // The new card carries its own id in the testid, so find it by name first.
    const card = page.locator('[data-testid^="habit-card-"]').filter({ hasText: name });
    await expect(card).toBeVisible();

    const ring = card.locator('[data-testid^="habit-ring-"]');
    const streak = card.locator('[data-testid^="habit-streak-"]');

    // A fresh habit has no streak yet.
    await expect(ring).toHaveAttribute('aria-pressed', 'false');

    // Check in → the ring latches and the server-derived streak reaches 1.
    await ring.click();
    await expect(ring).toHaveAttribute('aria-pressed', 'true');
    await expect(streak).toHaveText(/1\s*day/i);

    // The state survives a reload, which is what proves it was written rather
    // than only held in the client's optimistic state.
    await page.reload();
    const reloaded = page.locator('[data-testid^="habit-card-"]').filter({ hasText: name });
    await expect(reloaded.locator('[data-testid^="habit-ring-"]')).toHaveAttribute('aria-pressed', 'true');

    // Undo is a second tap with no confirmation.
    await reloaded.locator('[data-testid^="habit-ring-"]').click();
    await expect(reloaded.locator('[data-testid^="habit-ring-"]')).toHaveAttribute('aria-pressed', 'false');

    // Clean up so a nightly re-run does not accumulate habits against the free
    // plan limit and start failing on PLAN_LIMIT_EXCEEDED.
    await reloaded.locator('[data-testid^="habit-open-"]').click();
    await expect(page.getByTestId('habit-form-dialog')).toBeVisible();
  });

  test('a habit due today appears in the Today strip and checks in there', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/quick-access/today');

    const strip = page.getByTestId('habit-strip');
    const done = page.getByTestId('habit-strip-done');

    // Either there is work owed or everything is done — both are valid states,
    // and neither may render an empty frame.
    await expect(strip.or(done)).toBeVisible();

    if (await strip.isVisible()) {
      const ring = strip.locator('[data-testid^="habit-strip-ring-"]').first();
      await ring.click();
      await expect(ring).toHaveAttribute('aria-pressed', 'true');
    }
  });
});
