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

// @core Tasks: create task → subtask → complete, under __E2E_DEFAULT_PROJECT__.
// Deleting the parent task cascades the subtask, so one finally cleans both.

test.describe('@core Tasks + subtasks (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // eslint-disable-next-line no-empty-pattern
  test('create a task, add a subtask, complete it', async ({}, testInfo) => {
    const uid = uniqueSuffix(testInfo.retry);
    const title = `e2e-task-${uid}`;
    const subtitle = `e2e-subtask-${uid}`;

    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      // create task
      const created = await api.post(`${apiBase}/projects/${projectId}/tasks`, {
        headers: auth,
        data: { title },
      });
      expect(created.ok()).toBeTruthy();
      taskId = (await created.json()).data.id as string;

      const sub = await api.post(`${apiBase}/tasks/${taskId}/subtasks`, {
        headers: auth,
        data: { title: subtitle },
      });
      expect(sub.ok()).toBeTruthy();

      const done = await api.patch(`${apiBase}/tasks/${taskId}/status`, {
        headers: auth,
        data: { status: 'done' },
      });
      expect(done.ok()).toBeTruthy();
      expect((await done.json()).data.status).toBe('done');
    } finally {
      // Deleting the parent task cascades the subtask.
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  // eslint-disable-next-line no-empty-pattern
  test('schedule a task to today and see it in the time spread', async ({}, testInfo) => {
    const uid = uniqueSuffix(testInfo.retry);
    const title = `e2e-task-${uid}`;

    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      const created = await api.post(`${apiBase}/projects/${projectId}/tasks`, { headers: auth, data: { title } });
      expect(created.ok()).toBeTruthy();
      taskId = (await created.json()).data.id as string;

      // schedule endpoint wants an ISO date (YYYY-MM-DD), not the enum. Use
      // today's UTC date so it lands in the time spread's `today` bucket.
      const todayISO = new Date().toISOString().slice(0, 10);
      const scheduled = await api.patch(`${apiBase}/tasks/${taskId}/schedule`, {
        headers: auth,
        data: { scheduledFor: todayISO },
      });
      expect(scheduled.ok()).toBeTruthy();

      const spread = await (await api.get(`${apiBase}/time-spread?tz=UTC`, { headers: auth })).json();
      const todayIds = (spread.data.today as { id: string }[]).map(t => t.id);
      expect(todayIds).toContain(taskId);
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });
});
