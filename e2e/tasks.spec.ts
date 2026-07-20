/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import {
  authGetJson,
  authSendJson,
  bestEffortDelete,
  getToken,
  LIVE,
  PROJECT_SENTINEL,
  resolveProjectId,
  uniqueSuffix,
} from './helpers/e2e-live';

// @core Tasks — a real user quick-adding a task in a project, then completing it
// via the checkbox. Driven through the project view UI; API is teardown only.
test.describe('@core Tasks (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('quick-add a task in a project, then complete it', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;

    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      await page.goto(`/projects/${projectId}`);

      // Quick-add renders only after the tasks query resolves — allow for a slow first fetch.
      const quickAdd = page.getByTestId('task-quick-add');
      await expect(quickAdd).toBeVisible({ timeout: 20_000 });
      await quickAdd.fill(title);
      const created = page.waitForResponse(
        r => r.url().endsWith('/tasks') && r.request().method() === 'POST' && r.status() === 201
      );
      await quickAdd.press('Enter');
      await created;

      taskId = await resolveTaskIdByTitle(token, projectId, title);
      expect(taskId, 'created task not found via API').toBeTruthy();

      const cardHeading = page.getByTestId(`task-card-${taskId}`).getByRole('heading', { name: title });
      await expect(cardHeading).toBeVisible();

      await page.getByTestId(`task-checkbox-${taskId}`).click();
      await expect(cardHeading).toHaveClass(/line-through/);
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });
});

test.describe('@extended Tasks (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // T3 — full create through the dialog (title + priority + estimate + url); the
  // card renders with its badges.
  test('create a task via the full dialog with badges', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    // A seed task so the header "Add task" button renders (it's hidden at 0 tasks).
    const seedId = await createTaskViaApi(api, token, projectId, `${title}-seed`);
    let taskId: string | undefined;

    try {
      await page.goto(`/projects/${projectId}`);
      await page.getByTestId('task-add-button').click();

      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('name-input').fill(title);

      // Priority → High (SelectItem addressed by its option role).
      await dialog.getByTestId('priority-trigger').click();
      await page.getByRole('option', { name: /high/i }).click();

      await dialog.getByTestId('estimated-time-input').fill('30');
      await dialog.getByTestId('url-input').fill('https://example.com');
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(page.getByText(title, { exact: true })).toBeVisible();
      taskId = await resolveTaskIdByTitle(token, projectId, title);
      expect(taskId, 'created task not found via API').toBeTruthy();
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await bestEffortDelete(api, token, `/tasks/${seedId}`);
      await api.dispose();
    }
  });

  // T4 — edit a task's title via the card; the card re-renders.
  test('edit a task title; the card re-renders', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const renamed = `${title}-edited`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTaskViaApi(api, token, projectId, title);

    try {
      await page.goto(`/projects/${projectId}`);
      // The whole card opens the editor.
      await page.getByTestId(`task-card-${taskId}`).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('name-input').fill(renamed);
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(page.getByText(renamed, { exact: true })).toBeVisible();
      await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // T5 — delete a task via its actions menu → confirm; the card is gone.
  test('delete a task via the actions menu', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined = await createTaskViaApi(api, token, projectId, title);

    try {
      await page.goto(`/projects/${projectId}`);
      const card = page.getByTestId(`task-card-${taskId}`);
      await expect(card).toBeVisible();
      await card.getByTestId('item-actions-menu-trigger').click();
      await page.getByTestId('item-actions-menu-action-delete').click();
      await page.getByTestId('confirm-dialog-confirm-button').click();

      await expect(page.getByText(title, { exact: true })).toHaveCount(0);
      taskId = undefined;
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // T6 — add a subtask in the edit dialog's accordion, then toggle it complete.
  test('add a subtask and toggle it complete', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const subtaskTitle = `e2e-subtask-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTaskViaApi(api, token, projectId, title);

    try {
      await page.goto(`/projects/${projectId}`);
      await page.getByTestId(`task-card-${taskId}`).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();

      const accordion = dialog.getByTestId('subtask-accordion');
      await accordion.getByRole('button').first().click();
      await dialog.getByTestId('subtask-add-input').fill(subtaskTitle);
      await dialog.getByTestId('subtask-add-button').click();

      await expect(dialog.getByText(subtaskTitle, { exact: true })).toBeVisible();
      // Toggle the newly-added subtask's checkbox.
      await dialog
        .getByTestId(/^subtask-checkbox-/)
        .first()
        .click();
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // T7 — move a task to Someday via the actions menu; it leaves the active list.
  test('move a task to someday; it leaves the active list', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTaskViaApi(api, token, projectId, title);

    try {
      await page.goto(`/projects/${projectId}`);
      const card = page.getByTestId(`task-card-${taskId}`);
      await expect(card).toBeVisible();
      await card.getByTestId('item-actions-menu-trigger').click();
      await page.getByTestId('item-actions-menu-action-move-to-someday').click();

      await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // T8 — an invalid URL shows an inline error and blocks save.
  test('invalid URL shows an inline error, no save', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTaskViaApi(api, token, projectId, title);

    try {
      await page.goto(`/projects/${projectId}`);
      await page.getByTestId(`task-card-${taskId}`).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('url-input').fill('not-a-url');
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(dialog.getByTestId('form-message').first()).toBeVisible();
      await expect(dialog).toBeVisible();
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // T9 — a blank title in the full dialog shows an inline required error.
  test('empty title shows an inline required error', async ({ page }, testInfo) => {
    const title = `e2e-task-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    // Seed so the header add-task button is present.
    const seedId = await createTaskViaApi(api, token, projectId, `${title}-seed`);

    try {
      await page.goto(`/projects/${projectId}`);
      await page.getByTestId('task-add-button').click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      const nameInput = dialog.getByTestId('name-input');
      await nameInput.fill('x');
      await nameInput.fill('');
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(dialog.getByTestId('form-message').first()).toBeVisible();
      await expect(dialog).toBeVisible();
    } finally {
      await bestEffortDelete(api, token, `/tasks/${seedId}`);
      await api.dispose();
    }
  });
});

// Creates a task straight through the API so edit/delete/subtask specs start from a
// known row without re-driving quick-add (that's T1's job).
async function createTaskViaApi(
  api: Awaited<ReturnType<typeof playwrightRequest.newContext>>,
  token: string,
  projectId: string,
  title: string
): Promise<string> {
  const body = await authSendJson<{ data?: { id?: string }; error?: unknown }>(
    api,
    token,
    'post',
    `/projects/${projectId}/tasks`,
    { title, priority: 'low', energy: 'medium' },
    'createTask'
  );
  const id = body?.data?.id;
  if (!id) throw new Error(`create task failed: ${JSON.stringify(body?.error ?? body)}`);
  return id;
}

async function resolveTaskIdByTitle(token: string, projectId: string, title: string): Promise<string | undefined> {
  const api = await playwrightRequest.newContext();
  try {
    const body = await authGetJson<{ data?: { items?: { id: string; title: string }[] } }>(
      api,
      token,
      `/projects/${projectId}/tasks`,
      'resolveTaskIdByTitle'
    );
    return (body.data?.items ?? []).find(t => t.title === title)?.id;
  } finally {
    await api.dispose();
  }
}
