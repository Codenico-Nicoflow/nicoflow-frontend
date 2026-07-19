/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, bestEffortDelete, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

// @core Areas CRUD against live staging: create → edit → delete, verified via
// the API round-trip (not brittle DOM text) on its OWN e2e-* area.

test.describe('@core Areas CRUD (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // eslint-disable-next-line no-empty-pattern
  test('create, edit, then delete an area', async ({}, testInfo) => {
    const uid = uniqueSuffix(testInfo.retry);
    const name = `e2e-area-${uid}`;
    const renamed = `e2e-area-${uid}-edited`;

    const token = getToken();
    const api = await playwrightRequest.newContext();
    const auth = { Authorization: `Bearer ${token}` };
    let areaId: string | undefined;

    try {
      const created = await api.post(`${apiBase}/areas`, { headers: auth, data: { name } });
      expect(created.ok()).toBeTruthy();
      areaId = (await created.json()).data.id as string;

      const edited = await api.patch(`${apiBase}/areas/${areaId}`, { headers: auth, data: { name: renamed } });
      expect(edited.ok()).toBeTruthy();
      expect((await edited.json()).data.name).toBe(renamed);

      const deleted = await api.delete(`${apiBase}/areas/${areaId}`, { headers: auth });
      expect(deleted.ok()).toBeTruthy();

      const gone = await api.get(`${apiBase}/areas/${areaId}`, { headers: auth });
      expect(gone.status()).toBe(404);
      areaId = undefined;
    } finally {
      if (areaId) await bestEffortDelete(api, token, `/areas/${areaId}`);
      await api.dispose();
    }
  });
});
