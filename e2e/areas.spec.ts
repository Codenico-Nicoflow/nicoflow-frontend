/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { authGetJson, bestEffortDelete, createArea, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

// @core Areas — a real user creating and deleting an Area through the board UI.
// The browser drives every step (nav → New Area → fill dialog → submit → assert
// card → delete via menu → assert gone); the API is used only as a teardown net.
test.describe('@core Areas board (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('create an area from the board, then delete it', async ({ page }, testInfo) => {
    const name = `e2e-area-${uniqueSuffix(testInfo.retry)}`;

    const api = await playwrightRequest.newContext();
    const token = getToken();
    let areaId: string | undefined;

    try {
      await page.goto('/areas');

      // Wait for the board to finish loading (the sentinel area is always
      // present, so the grid renders — never the empty state). Settling here
      // avoids racing the loading→loaded swap of the "New area" button.
      const newAreaBtn = page.getByTestId('board-new-area');
      await expect(newAreaBtn).toBeVisible();
      await newAreaBtn.click();

      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('name-input').fill(name);
      await dialog.getByTestId('form-dialog-submit-button').click();

      // The new card renders on the board.
      await expect(page.getByTestId('areas-grid').getByText(name, { exact: true })).toBeVisible();

      // Map name → id (the card's actions-menu testid is keyed by id).
      areaId = await resolveAreaId(token, name);
      expect(areaId, 'created area not found via API').toBeTruthy();

      // Delete through the card's actions menu → confirm dialog.
      await page.getByTestId(`area-card-${areaId}-actions-trigger`).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await page.getByTestId('confirm-dialog-confirm-button').click();

      await expect(page.getByText(name, { exact: true })).toHaveCount(0);
      areaId = undefined;
    } finally {
      if (areaId) await bestEffortDelete(api, token, `/areas/${areaId}`);
      await api.dispose();
    }
  });

  // AR3 — submitting the create dialog with a blank name shows an inline required
  // error and the dialog stays open (nothing is created).
  test('creating an area with an empty name shows an inline error', async ({ page }) => {
    await page.goto('/areas');
    const newAreaBtn = page.getByTestId('board-new-area');
    await expect(newAreaBtn).toBeVisible();
    await newAreaBtn.click();

    const dialog = page.getByTestId('form-dialog-content');
    await expect(dialog).toBeVisible();
    // Type then clear so the submit button (disabled on no-changes) enables.
    const nameInput = dialog.getByTestId('name-input');
    await nameInput.fill('x');
    await nameInput.fill('');
    await dialog.getByTestId('form-dialog-submit-button').click();

    await expect(dialog.getByRole('alert').first()).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});

test.describe('@extended Areas board (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // AR4 — edit an area's name and see the card re-render with the new name.
  test('edit an area name; the card re-renders', async ({ page }, testInfo) => {
    const name = `e2e-area-${uniqueSuffix(testInfo.retry)}`;
    const renamed = `${name}-edited`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    let areaId: string | undefined;

    try {
      areaId = await createArea(api, token, name);

      await page.goto('/areas');
      await page.getByTestId(`area-card-${areaId}-actions-trigger`).click();
      await page.getByTestId(`area-card-${areaId}-actions-action-edit`).click();

      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      const nameInput = dialog.getByTestId('name-input');
      await nameInput.fill(renamed);
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(page.getByTestId('areas-grid').getByText(renamed, { exact: true })).toBeVisible();
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    } finally {
      if (areaId) await bestEffortDelete(api, token, `/areas/${areaId}`);
      await api.dispose();
    }
  });

  // AR5 — a name over the 30-char limit shows an inline max error, blocking submit.
  test('area name over the limit shows an inline max error', async ({ page }) => {
    await page.goto('/areas');
    await page.getByTestId('board-new-area').click();
    const dialog = page.getByTestId('form-dialog-content');
    await expect(dialog).toBeVisible();
    await dialog.getByTestId('name-input').fill('x'.repeat(31));
    await dialog.getByTestId('form-dialog-submit-button').click();

    await expect(dialog.getByRole('alert').first()).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});

// Maps the just-created area's name → id via the API. Only a lookup for the
// id-keyed testid + teardown — not the assertion under test.
async function resolveAreaId(token: string, name: string): Promise<string | undefined> {
  const api = await playwrightRequest.newContext();
  try {
    // /areas/with-projects returns a bare array (unlike the paginated /areas).
    const body = await authGetJson<{ data?: { id: string; name: string }[] }>(
      api,
      token,
      '/areas/with-projects',
      'resolveAreaId'
    );
    return (body.data ?? []).find(a => a.name === name)?.id;
  } finally {
    await api.dispose();
  }
}
