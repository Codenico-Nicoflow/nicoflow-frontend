/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import {
  AREA_SENTINEL,
  authGetJson,
  bestEffortDelete,
  createArea,
  createProject,
  getToken,
  LIVE,
  uniqueSuffix,
} from './helpers/e2e-live';

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

  // P3 — add-project dialog with a blank name shows an inline required error.
  test('adding a project with an empty name shows an inline error', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const areaId = await resolveSentinelAreaId(token);
    try {
      await page.goto('/areas');
      await expect(page.getByTestId(`area-card-${areaId}`)).toBeVisible();
      await page.getByTestId(`area-card-${areaId}-add-project`).click();

      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      const nameInput = dialog.getByTestId('name-input');
      await nameInput.fill('x');
      await nameInput.fill('');
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(dialog.getByTestId('form-message').first()).toBeVisible();
      await expect(dialog).toBeVisible();
    } finally {
      await api.dispose();
    }
  });
});

test.describe('@extended Projects (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // P4 — edit a project's name + description; the header and description re-render.
  test('edit a project name and description; the view re-renders', async ({ page }, testInfo) => {
    const name = `e2e-project-${uniqueSuffix(testInfo.retry)}`;
    const renamed = `${name}-edited`;
    const desc = `e2e description ${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const areaId = await resolveSentinelAreaId(token);
    let projectId: string | undefined;

    try {
      projectId = await createProject(api, token, areaId, name);

      await page.goto(`/projects/${projectId}`);
      await page.getByTestId('project-header-edit').click();

      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('name-input').fill(renamed);
      await dialog.getByTestId('description-textarea').fill(desc);
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(page.getByRole('heading', { name: renamed, level: 1 })).toBeVisible();
      await expect(page.getByTestId('project-description')).toContainText(desc);
    } finally {
      if (projectId) await bestEffortDelete(api, token, `/projects/${projectId}`);
      await api.dispose();
    }
  });

  // P5 — move a project to another area via the edit dialog's area select; the row
  // lands under the target area card.
  test('move a project to another area via the edit dialog', async ({ page }, testInfo) => {
    const suffix = uniqueSuffix(testInfo.retry);
    const projectName = `e2e-project-${suffix}`;
    const targetAreaName = `e2e-target-area-${suffix}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const sourceAreaId = await resolveSentinelAreaId(token);
    let projectId: string | undefined;
    let targetAreaId: string | undefined;

    try {
      targetAreaId = await createArea(api, token, targetAreaName);
      projectId = await createProject(api, token, sourceAreaId, projectName);

      await page.goto(`/projects/${projectId}`);
      await page.getByTestId('project-header-edit').click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();

      // Open the area select and pick the target area by its visible name.
      await dialog.getByRole('combobox').click();
      await page.getByRole('option', { name: targetAreaName }).click();
      await dialog.getByTestId('form-dialog-submit-button').click();

      // On the board, the project row now lives inside the target area card.
      await page.goto('/areas');
      const targetCard = page.getByTestId(`area-card-${targetAreaId}`);
      await expect(targetCard.getByText(projectName, { exact: true })).toBeVisible();
    } finally {
      if (projectId) await bestEffortDelete(api, token, `/projects/${projectId}`);
      if (targetAreaId) await bestEffortDelete(api, token, `/areas/${targetAreaId}`);
      await api.dispose();
    }
  });

  // P6 — a project name over the 50-char limit shows an inline max error.
  test('project name over the limit shows an inline max error', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const areaId = await resolveSentinelAreaId(token);
    try {
      await page.goto('/areas');
      await page.getByTestId(`area-card-${areaId}-add-project`).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('name-input').fill('x'.repeat(51));
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(dialog.getByTestId('form-message').first()).toBeVisible();
      await expect(dialog).toBeVisible();
    } finally {
      await api.dispose();
    }
  });

  // P7 — a description over the 2000-char limit shows an inline error.
  test('project description over the limit shows an inline error', async ({ page }, testInfo) => {
    const name = `e2e-project-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const areaId = await resolveSentinelAreaId(token);
    let projectId: string | undefined;

    try {
      projectId = await createProject(api, token, areaId, name);
      await page.goto(`/projects/${projectId}`);
      await page.getByTestId('project-header-edit').click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('description-textarea').fill('x'.repeat(2001));
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(dialog.getByTestId('form-message').first()).toBeVisible();
      await expect(dialog).toBeVisible();
    } finally {
      if (projectId) await bestEffortDelete(api, token, `/projects/${projectId}`);
      await api.dispose();
    }
  });

  // P9 — opening a non-existent project id renders the not-found empty state.
  test('opening a non-existent project shows the not-found state', async ({ page }) => {
    await page.goto('/projects/e2e-does-not-exist-000000');
    await expect(page.getByTestId('project-not-found')).toBeVisible();
  });
});

async function resolveSentinelAreaId(token: string): Promise<string> {
  const api = await playwrightRequest.newContext();
  try {
    // /areas/with-projects returns a bare array (unlike the paginated /areas).
    const body = await authGetJson<{ data?: { id: string; name: string }[] }>(
      api,
      token,
      '/areas/with-projects',
      'resolveSentinelAreaId'
    );
    const area = (body.data ?? []).find(a => a.name === AREA_SENTINEL);
    if (!area) throw new Error(`sentinel area '${AREA_SENTINEL}' missing — run scripts/seed-e2e.sh`);
    return area.id;
  } finally {
    await api.dispose();
  }
}

async function resolveProjectIdByName(token: string, name: string): Promise<string | undefined> {
  const api = await playwrightRequest.newContext();
  try {
    const body = await authGetJson<{ data?: { projects?: { id: string; name: string }[] }[] }>(
      api,
      token,
      '/areas/with-projects',
      'resolveProjectIdByName'
    );
    for (const a of body.data ?? []) {
      const hit = (a.projects ?? []).find(p => p.name === name);
      if (hit) return hit.id;
    }
    return undefined;
  } finally {
    await api.dispose();
  }
}
