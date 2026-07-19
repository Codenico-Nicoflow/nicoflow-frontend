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

// @core Bucket — THE product loop (capture → process → task). process→task
// transmutes the inbox item into a TASK in another domain; the response carries
// createdTaskId, so finally deletes by that id. taskDetails.title (not the bucket
// content) becomes the task title, so it must also carry the e2e- prefix for the
// sweep to net it.

test.describe('@core Bucket → process to task (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // eslint-disable-next-line no-empty-pattern
  test('capture an inbox item and process it into a task', async ({}, testInfo) => {
    const uid = uniqueSuffix(testInfo.retry);
    const content = `e2e-inbox-${uid}`;

    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let createdTaskId: string | undefined;

    try {
      const created = await api.post(`${apiBase}/bucket`, { headers: auth, data: { content } });
      expect(created.ok()).toBeTruthy();
      const item = (await created.json()).data as { id: string };

      const processed = await api.post(`${apiBase}/bucket/${item.id}/process`, {
        headers: auth,
        data: { processingResult: 'task', projectId, taskDetails: { title: content } },
      });
      expect(processed.ok()).toBeTruthy();
      createdTaskId = (await processed.json()).data.createdTaskId as string;
      expect(createdTaskId).toBeTruthy();

      const tasks = await (await api.get(`${apiBase}/projects/${projectId}/tasks`, { headers: auth })).json();
      const titles = (tasks.data.items as { title: string }[]).map(t => t.title);
      expect(titles).toContain(content);
    } finally {
      if (createdTaskId) await bestEffortDelete(api, token, `/tasks/${createdTaskId}`);
      await api.dispose();
    }
  });

  // eslint-disable-next-line no-empty-pattern
  test('capture an inbox item and trash it', async ({}, testInfo) => {
    const uid = uniqueSuffix(testInfo.retry);
    const content = `e2e-inbox-${uid}`;

    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };
    let itemId: string | undefined;

    try {
      const created = await api.post(`${apiBase}/bucket`, { headers: auth, data: { content } });
      expect(created.ok()).toBeTruthy();
      itemId = (await created.json()).data.id as string;

      const processed = await api.post(`${apiBase}/bucket/${itemId}/process`, {
        headers: auth,
        data: { processingResult: 'trash' },
      });
      expect(processed.ok()).toBeTruthy();
      expect((await processed.json()).data.processingResult).toBe('trash');
    } finally {
      // Trashed item is marked processed, not deleted — clean it up.
      if (itemId) await bestEffortDelete(api, token, `/bucket/${itemId}`);
      await api.dispose();
    }
  });
});
