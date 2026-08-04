/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import { bestEffortDelete, getToken, LIVE, PROJECT_SENTINEL, resolveProjectId, uniqueSuffix } from './helpers/e2e-live';

// @core Project Notes — the loop that proves the feature end to end: create a
// note from the project page, type a title and formatted body, then reload and
// confirm the autosaved document came back from the server rather than from
// anything the client was holding.
test.describe('@core Project Notes (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('create a note, write formatted content, and have it survive a reload', async ({ page }, testInfo) => {
    const title = `e2e-note-${uniqueSuffix(testInfo.retry)}`;
    const body = `reference material ${uniqueSuffix(testInfo.retry)}`;

    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let noteId: string | undefined;

    try {
      // The create button renders only after the notes list GET resolves.
      const listed = page.waitForResponse(
        response => response.url().includes('/v1/notes?projectId=') && response.request().method() === 'GET'
      );
      await page.goto(`/projects/${projectId}`);
      await listed;

      const created = page.waitForResponse(
        response => response.url().endsWith('/v1/notes') && response.request().method() === 'POST'
      );
      await page.getByTestId('notes-create').click();
      const createResponse = await created;
      noteId = ((await createResponse.json()) as { data: { id: string } }).data.id;

      await expect(page).toHaveURL(new RegExp(`/notes/${noteId}$`));

      await page.getByTestId('note-title').fill(title);

      const editor = page.getByRole('textbox', { name: 'Note content' });
      await editor.click();
      await page.keyboard.type(body);

      // Bold the body so the reload assertion covers a mark, not just text —
      // proving the document JSON round-tripped, not merely a string.
      await page.keyboard.press('Control+A');
      await page.getByRole('button', { name: 'Bold' }).click();

      // Wait for the autosave PATCH rather than a fixed sleep, so the reload
      // can't race the debounce window.
      await page.waitForResponse(
        response => response.url().includes(`/v1/notes/${noteId}`) && response.request().method() === 'PATCH'
      );
      await expect(page.getByRole('status')).toHaveText('Saved');

      await page.reload();

      // Everything below comes from GET /v1/notes/:id — the scalar is the only
      // endpoint that carries the body.
      await expect(page.getByTestId('note-title')).toHaveValue(title);
      await expect(page.getByText(body)).toBeVisible();
      await expect(editor.locator('strong')).toContainText(body);
    } finally {
      if (noteId) await bestEffortDelete(api, token, `/notes/${noteId}`);
      await api.dispose();
    }
  });

  test('delete a note and see it leave the project list', async ({ page }, testInfo) => {
    const title = `e2e-note-del-${uniqueSuffix(testInfo.retry)}`;

    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let noteId: string | undefined;

    try {
      const listed = page.waitForResponse(
        response => response.url().includes('/v1/notes?projectId=') && response.request().method() === 'GET'
      );
      await page.goto(`/projects/${projectId}`);
      await listed;

      const created = page.waitForResponse(
        response => response.url().endsWith('/v1/notes') && response.request().method() === 'POST'
      );
      await page.getByTestId('notes-create').click();
      const createResponse = await created;
      noteId = ((await createResponse.json()) as { data: { id: string } }).data.id;

      await page.getByTestId('note-title').fill(title);
      await page.waitForResponse(
        response => response.url().includes(`/v1/notes/${noteId}`) && response.request().method() === 'PATCH'
      );

      await page.getByTestId('note-delete').click();
      const deleted = page.waitForResponse(
        response => response.url().includes(`/v1/notes/${noteId}`) && response.request().method() === 'DELETE'
      );
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await deleted;

      await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
      await expect(page.getByText(title)).toHaveCount(0);
      noteId = undefined;
    } finally {
      if (noteId) await bestEffortDelete(api, token, `/notes/${noteId}`);
      await api.dispose();
    }
  });
});
