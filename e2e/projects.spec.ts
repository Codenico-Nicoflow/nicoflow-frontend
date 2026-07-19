/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, AREA_SENTINEL, bestEffortDelete, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

// @core Projects — a real user adding a project inside an area, opening it, and
// deleting it. Everything is driven through the UI (add-project on the sentinel
// area card → dialog → row → open → header delete); the API is only teardown.
test.describe('@core Projects (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('add a project to an area, open it, then delete it', async ({ page }, testInfo) => {
    const name = `e2e-project-${uniqueSuffix(testInfo.retry)}`;

    const api = await playwrightRequest.newContext();
    const token = getToken();
    // Resolve the sentinel area's id so we target the right card's add-project.
    const areaId = await resolveSentinelAreaId(token);
    let projectId: string | undefined;

    try {
      await page.goto('/areas');
      const areaCard = page.getByTestId(`area-card-${areaId}`);
      await expect(areaCard).toBeVisible();

      // "Add project" inside the sentinel card opens the create dialog with the
      // area pre-selected.
      await page.getByTestId(`area-card-${areaId}-add-project`).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('name-input').fill(name);
      await dialog.getByTestId('form-dialog-submit-button').click();

      // The new project row appears inside the area card.
      const row = areaCard.getByText(name, { exact: true });
      await expect(row).toBeVisible();

      projectId = await resolveProjectIdByName(token, name);
      expect(projectId, 'created project not found via API').toBeTruthy();

      // Open it — the row navigates to the project view.
      await page.getByTestId(`project-row-${projectId}`).click();
      await expect(page).toHaveURL(new RegExp(`/projects/${projectId}`));
      await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();

      // Delete from the project header → confirm → back on the board.
      await page.getByTestId('project-header-delete').click();
      await page.getByTestId('confirm-dialog-confirm-button').click();
      await expect(page).toHaveURL(/\/areas/);
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);
      projectId = undefined;
    } finally {
      if (projectId) await bestEffortDelete(api, token, `/projects/${projectId}`);
      await api.dispose();
    }
  });
});

async function resolveSentinelAreaId(token: string): Promise<string> {
  const api = await playwrightRequest.newContext();
  try {
    // /areas/with-projects returns a bare array (unlike the paginated /areas).
    const res = await api.get(`${apiBase}/areas/with-projects`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    const area = (body.data as { id: string; name: string }[]).find(a => a.name === AREA_SENTINEL);
    if (!area) throw new Error(`sentinel area '${AREA_SENTINEL}' missing — run scripts/seed-e2e.sh`);
    return area.id;
  } finally {
    await api.dispose();
  }
}

async function resolveProjectIdByName(token: string, name: string): Promise<string | undefined> {
  const api = await playwrightRequest.newContext();
  try {
    const res = await api.get(`${apiBase}/areas/with-projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    for (const a of (body.data ?? []) as { projects?: { id: string; name: string }[] }[]) {
      const hit = (a.projects ?? []).find(p => p.name === name);
      if (hit) return hit.id;
    }
    return undefined;
  } finally {
    await api.dispose();
  }
}
