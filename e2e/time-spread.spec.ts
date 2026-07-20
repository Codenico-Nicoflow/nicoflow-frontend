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

// Time Spread — the today / tomorrow / next-7 lenses. Tasks are seeded via the API
// (create + schedule to a concrete date), then the browser opens the view and
// asserts the task lands in the right bucket. The view rendering is what's under
// test; the scheduling mechanic is covered by the Tasks dialog specs.
const TODAY_ROUTE = '/quick-access/today';
const TOMORROW_ROUTE = '/quick-access/tomorrow';
const WEEK_ROUTE = '/quick-access/next-7-days';

// yyyy-MM-dd for `now + offsetDays` in local time (matches the picker's format).
function localDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// TS1 was @core, but scheduling a task needs create+schedule writes; that write
// load is nightly-tier. @core stays validation-only to fit the PR-gate budget.
test.describe('@extended Time Spread (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // TS1 — a task scheduled for today shows in the Today view.
  test('a task scheduled today shows in Today', async ({ page }, testInfo) => {
    const title = `e2e-ts-today-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      taskId = await createTaskViaApi(api, token, projectId, title);
      await scheduleTask(api, token, taskId, localDate(0));

      await page.goto(TODAY_ROUTE);
      await expect(page.getByTestId('timespread-list').getByText(title, { exact: true })).toBeVisible();
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // TS2 — a task scheduled for tomorrow shows in Tomorrow, not Today.
  test('a task scheduled tomorrow shows in Tomorrow, not Today', async ({ page }, testInfo) => {
    const title = `e2e-ts-tomorrow-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      taskId = await createTaskViaApi(api, token, projectId, title);
      // rollsOver off so it can't spill into Today.
      await scheduleTask(api, token, taskId, localDate(1), false);

      await page.goto(TOMORROW_ROUTE);
      await expect(page.getByTestId('timespread-list').getByText(title, { exact: true })).toBeVisible();

      await page.goto(TODAY_ROUTE);
      await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // TS3 — a task scheduled within the week shows in the Next-7 view.
  test('a task scheduled within the week shows in Next 7 Days', async ({ page }, testInfo) => {
    const title = `e2e-ts-week-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      taskId = await createTaskViaApi(api, token, projectId, title);
      await scheduleTask(api, token, taskId, localDate(3), false);

      await page.goto(WEEK_ROUTE);
      await expect(page.getByTestId('timespread-week').getByText(title, { exact: true })).toBeVisible();
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // TS4 — completing a task from Today marks it done (line-through), off the active list.
  test('complete a task from Today', async ({ page }, testInfo) => {
    const title = `e2e-ts-complete-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      taskId = await createTaskViaApi(api, token, projectId, title);
      await scheduleTask(api, token, taskId, localDate(0));

      await page.goto(TODAY_ROUTE);
      const checkbox = page.getByTestId(`timespread-checkbox-${taskId}`);
      await expect(checkbox).toBeVisible();
      await checkbox.click();

      // The row is marked done: the checkbox reads checked and the title is struck.
      await expect(checkbox).toBeChecked();
      await expect(page.getByTestId(`timespread-card-${taskId}`).getByText(title, { exact: true })).toHaveClass(
        /line-through/
      );
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // TS5 — the Today view with nothing scheduled renders the empty state.
  // Guarded: skips if the shared account happens to have tasks scheduled today.
  test('Today with nothing scheduled renders the empty state', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    const token = getToken();
    try {
      const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone);
      const body = await authGetJson<{ data?: { today?: unknown[] } }>(
        api,
        token,
        `/time-spread?tz=${tz}`,
        'timeSpread'
      );
      const todayCount = (body.data?.today ?? []).length;
      test.skip(todayCount > 0, 'shared account has tasks scheduled today; empty-state not reachable this run');

      await page.goto(TODAY_ROUTE);
      await expect(page.getByTestId('timespread-empty')).toBeVisible();
    } finally {
      await api.dispose();
    }
  });
});

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
    '/tasks',
    { projectId, title, priority: 'low', energy: 'medium' },
    'createTask'
  );
  const id = body?.data?.id;
  if (!id) throw new Error(`create task failed: ${JSON.stringify(body?.error ?? body)}`);
  return id;
}

// PATCH /tasks/:id/schedule with a concrete date (the picker's yyyy-MM-dd format).
async function scheduleTask(
  api: Awaited<ReturnType<typeof playwrightRequest.newContext>>,
  token: string,
  id: string,
  scheduledFor: string,
  rollsOver = true
): Promise<void> {
  await authSendJson(api, token, 'patch', `/tasks/${id}/schedule`, { scheduledFor, rollsOver }, 'scheduleTask');
}
