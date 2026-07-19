/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, AREA_SENTINEL, bestEffortDelete, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

// @core Projects CRUD against live staging: create → edit → delete under the
// sentinel __E2E_DEFAULT_AREA__ (resolved by name), verified via the API.

test.describe('@core Projects CRUD (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // eslint-disable-next-line no-empty-pattern
  test('create, edit, then delete a project under the default area', async ({}, testInfo) => {
    const uid = uniqueSuffix(testInfo.retry);
    const name = `e2e-project-${uid}`;
    const renamed = `e2e-project-${uid}-edited`;

    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };
    let projectId: string | undefined;

    try {
      const tree = await (await api.get(`${apiBase}/areas/with-projects`, { headers: auth })).json();
      const area = (tree.data as { id: string; name: string }[]).find(a => a.name === AREA_SENTINEL);
      expect(area, `sentinel area '${AREA_SENTINEL}' missing — run seed-e2e.sh`).toBeTruthy();

      const created = await api.post(`${apiBase}/areas/${area!.id}/projects`, { headers: auth, data: { name } });
      expect(created.ok()).toBeTruthy();
      projectId = (await created.json()).data.id as string;

      const edited = await api.patch(`${apiBase}/projects/${projectId}`, { headers: auth, data: { name: renamed } });
      expect(edited.ok()).toBeTruthy();
      expect((await edited.json()).data.name).toBe(renamed);

      const deleted = await api.delete(`${apiBase}/projects/${projectId}`, { headers: auth });
      expect(deleted.ok()).toBeTruthy();

      const gone = await api.get(`${apiBase}/projects/${projectId}`, { headers: auth });
      expect(gone.status()).toBe(404);
      projectId = undefined;
    } finally {
      if (projectId) await bestEffortDelete(api, token, `/projects/${projectId}`);
      await api.dispose();
    }
  });
});
