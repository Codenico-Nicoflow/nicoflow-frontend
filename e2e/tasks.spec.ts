/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import {
  apiBase,
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

      // Frictionless capture: type into the quick-add and press Enter.
      const quickAdd = page.getByTestId('task-quick-add');
      await expect(quickAdd).toBeVisible();
      await quickAdd.fill(title);
      await quickAdd.press('Enter');

      // The task card renders in the list.
      const card = page.getByText(title, { exact: true });
      await expect(card).toBeVisible();

      taskId = await resolveTaskIdByTitle(token, projectId, title);
      expect(taskId, 'created task not found via API').toBeTruthy();

      // Tick the checkbox → the row shows as completed (title struck through).
      await page.getByTestId(`task-checkbox-${taskId}`).click();
      const heading = page.getByTestId(`task-card-${taskId}`).getByRole('heading', { name: title });
      await expect(heading).toHaveClass(/line-through/);
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });
});

async function resolveTaskIdByTitle(token: string, projectId: string, title: string): Promise<string | undefined> {
  const api = await playwrightRequest.newContext();
  try {
    const res = await api.get(`${apiBase}/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    return (body.data.items as { id: string; title: string }[]).find(t => t.title === title)?.id;
  } finally {
    await api.dispose();
  }
}
