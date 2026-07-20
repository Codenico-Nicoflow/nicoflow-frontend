/// <reference types="node" />
import { expect, type Page, request as playwrightRequest, test } from '@playwright/test';

import {
  bestEffortDelete,
  createArea,
  createProject,
  createTask,
  getToken,
  LIVE,
  PROJECT_SENTINEL,
  resolveProjectId,
  uniqueSuffix,
} from './helpers/e2e-live';

// Notifications — self-seeded: completing a task fires task_completed.

// Complete a task via the UI, awaiting the status PATCH so the notification exists.
async function completeTaskInProject(page: Page, projectId: string, taskId: string): Promise<void> {
  await page.goto(`/projects/${projectId}`);
  const checkbox = page.getByTestId(`task-checkbox-${taskId}`);
  await expect(checkbox).toBeVisible();
  const statusResp = page.waitForResponse(
    r => r.url().includes(`/tasks/${taskId}/status`) && r.request().method() === 'PATCH'
  );
  await checkbox.click();
  await statusResp;
}

function badgeCount(text: string | null): number {
  return Number((text ?? '0').replace('+', '')) || 0;
}

test.describe('@extended Notifications (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // N1 — complete a task, open the bell, see an unread notification in the panel.
  test('completing a task surfaces a notification in the bell', async ({ page }, testInfo) => {
    const title = `e2e-notif-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTask(api, token, projectId, title);

    try {
      await completeTaskInProject(page, projectId, taskId);

      await page.getByTestId('notification-bell').click();
      await expect(page.getByTestId('notification-panel')).toBeVisible();
      await expect(page.getByTestId('notification-row').first()).toBeVisible();
      await expect(page.getByTestId('notification-badge')).toBeVisible();
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // N2 — after seeding via a completion, marking a notification read decrements the badge.
  test('marking a notification read decrements the badge', async ({ page }, testInfo) => {
    const title = `e2e-notif-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTask(api, token, projectId, title);

    try {
      await completeTaskInProject(page, projectId, taskId);

      const badge = page.getByTestId('notification-badge');
      await expect(badge).toBeVisible();
      const before = badgeCount(await badge.textContent());

      await page.getByTestId('notification-bell').click();
      await expect(page.getByTestId('notification-panel')).toBeVisible();
      await page.getByTestId('notification-row').first().hover();
      await page.getByTestId('mark-read-button').first().click();

      await expect
        .poll(async () => ((await badge.isVisible()) ? badgeCount(await badge.textContent()) : 0))
        .toBeLessThan(before);
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // N3 — seed two completions, then "mark all read" drops the badge to zero.
  test('mark all read clears the badge', async ({ page }, testInfo) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const t1 = await createTask(api, token, projectId, `e2e-notif-a-${uniqueSuffix(testInfo.retry)}`);
    const t2 = await createTask(api, token, projectId, `e2e-notif-b-${uniqueSuffix(testInfo.retry)}`);

    try {
      await completeTaskInProject(page, projectId, t1);
      await completeTaskInProject(page, projectId, t2);

      await page.getByTestId('notification-bell').click();
      await expect(page.getByTestId('notification-panel')).toBeVisible();
      await page.getByTestId('mark-all-read-button').click();

      await expect(page.getByTestId('notification-badge')).toHaveCount(0);
    } finally {
      await bestEffortDelete(api, token, `/tasks/${t1}`);
      await bestEffortDelete(api, token, `/tasks/${t2}`);
      await api.dispose();
    }
  });

  // N4 — completing a throwaway project's only task fires a project_completed
  // notification (asserted as a row appearing in the panel).
  test('completing a project last task surfaces a notification', async ({ page }, testInfo) => {
    const suffix = uniqueSuffix(testInfo.retry);
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const areaId = await createArea(api, token, `e2e-notif-area-${suffix}`);
    const projectId = await createProject(api, token, areaId, `e2e-notif-proj-${suffix}`);
    const taskId = await createTask(api, token, projectId, `e2e-notif-last-${suffix}`);

    try {
      await completeTaskInProject(page, projectId, taskId);

      await page.getByTestId('notification-bell').click();
      await expect(page.getByTestId('notification-panel')).toBeVisible();
      await expect(page.getByTestId('notification-row').first()).toBeVisible();
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await bestEffortDelete(api, token, `/projects/${projectId}`);
      await bestEffortDelete(api, token, `/areas/${areaId}`);
      await api.dispose();
    }
  });

  // N5 — seed a notification, then delete its row from the panel.
  test('delete a notification row', async ({ page }, testInfo) => {
    const title = `e2e-notif-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    const taskId = await createTask(api, token, projectId, title);

    try {
      await completeTaskInProject(page, projectId, taskId);

      await page.getByTestId('notification-bell').click();
      await expect(page.getByTestId('notification-panel')).toBeVisible();
      const rows = page.getByTestId('notification-row');
      const before = await rows.count();
      expect(before).toBeGreaterThan(0);

      await rows.first().hover();
      await page.getByTestId('dismiss-button').first().click();

      await expect.poll(async () => rows.count()).toBeLessThan(before);
    } finally {
      await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });
});
