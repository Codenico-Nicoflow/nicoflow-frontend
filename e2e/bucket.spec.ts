/// <reference types="node" />
import { expect, type Page, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, bestEffortDelete, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

// @core Bucket — THE product loop, driven through the UI: capture a thought into
// the inbox, then process it (into a task, or to trash). We assert the item
// leaves the inbox list; API is teardown only.
test.describe('@core Bucket capture & process (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('capture an inbox item and process it into a task', async ({ page }, testInfo) => {
    const content = `e2e-inbox-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();

    try {
      await captureInboxItem(page, content);
      const item = page.locator(`[data-testid="bucket-item"][data-bucket-content="${content}"]`);
      await expect(item).toBeVisible();

      // Open the item menu → Process → the process dialog (Task is the default
      // type, and the first project is auto-selected) → submit.
      await item.click();
      await page.getByRole('menuitem', { name: /process/i }).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('form-dialog-submit-button').click();

      // Processed → it disappears from the inbox list.
      await expect(item).toHaveCount(0);
    } finally {
      await cleanupBucketByContent(api, token, content);
      await api.dispose();
    }
  });

  test('capture an inbox item and trash it', async ({ page }, testInfo) => {
    const content = `e2e-inbox-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();

    try {
      await captureInboxItem(page, content);
      const item = page.locator(`[data-testid="bucket-item"][data-bucket-content="${content}"]`);
      await expect(item).toBeVisible();

      await item.click();
      await page.getByRole('menuitem', { name: /process/i }).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      // Switch the processing type to Trash, then submit.
      await dialog.getByTestId('process-option-trash').click();
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(item).toHaveCount(0);
    } finally {
      await cleanupBucketByContent(api, token, content);
      await api.dispose();
    }
  });
});

// Types into the Bucket quick-input and submits (Enter submits per the component).
async function captureInboxItem(page: Page, content: string): Promise<void> {
  await page.goto('/quick-access/bucket');
  const panel = page.getByTestId('bucket-inbox-panel');
  const input = panel.getByRole('textbox');
  await expect(input).toBeVisible();
  await input.fill(content);
  await input.press('Enter');
}

// Deletes any bucket rows matching this content (processed or not) — the sweep is
// the wider safety net, but keep our own trail clean.
async function cleanupBucketByContent(
  api: Awaited<ReturnType<typeof playwrightRequest.newContext>>,
  token: string,
  content: string
): Promise<void> {
  const res = await api.get(`${apiBase}/bucket`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  const items = (body.data?.items ?? []) as { id: string; content: string; createdTaskId?: string | null }[];
  for (const b of items.filter(b => b.content === content)) {
    if (b.createdTaskId) await bestEffortDelete(api, token, `/tasks/${b.createdTaskId}`);
    await bestEffortDelete(api, token, `/bucket/${b.id}`);
  }
}
