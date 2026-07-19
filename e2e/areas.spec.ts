/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, bestEffortDelete, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

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
});

// Maps the just-created area's name → id via the API. Only a lookup for the
// id-keyed testid + teardown — not the assertion under test.
async function resolveAreaId(token: string, name: string): Promise<string | undefined> {
  const api = await playwrightRequest.newContext();
  try {
    // /areas/with-projects returns a bare array (unlike the paginated /areas).
    const res = await api.get(`${apiBase}/areas/with-projects`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    return (body.data as { id: string; name: string }[]).find(a => a.name === name)?.id;
  } finally {
    await api.dispose();
  }
}
