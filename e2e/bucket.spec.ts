/// <reference types="node" />
import { expect, type Page, request as playwrightRequest, test } from '@playwright/test';

import { apiBase, apiDirect, baseURL, bestEffortDelete, getToken, LIVE, uniqueSuffix } from './helpers/e2e-live';

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

  // B3 — the capture button is disabled while the input is empty (no item created).
  test('empty capture keeps the submit button disabled', async ({ page }) => {
    await page.goto('/quick-access/bucket');
    const panel = page.getByTestId('bucket-inbox-panel');
    const submit = panel.getByRole('button', { name: /add to bucket/i });
    await expect(submit).toBeDisabled();

    // Typing enables it; clearing disables it again.
    const input = panel.getByRole('textbox');
    await input.fill('x');
    await expect(submit).toBeEnabled();
    await input.fill('');
    await expect(submit).toBeDisabled();
  });
});

test.describe('@extended Bucket (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  // B4 — edit an inbox item's content; the row re-renders with the new text.
  test('edit an inbox item; it re-renders', async ({ page }, testInfo) => {
    const content = `e2e-inbox-${uniqueSuffix(testInfo.retry)}`;
    const edited = `${content}-edited`;
    const api = await playwrightRequest.newContext();
    const token = getToken();

    try {
      await createBucketViaApi(api, token, content);
      await page.goto('/quick-access/bucket');
      const item = page.locator(`[data-testid="bucket-item"][data-bucket-content="${content}"]`);
      await expect(item).toBeVisible();

      await item.click();
      await page.getByRole('menuitem', { name: /edit/i }).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('description-textarea').fill(edited);
      await dialog.getByTestId('form-dialog-submit-button').click();

      await expect(page.locator(`[data-testid="bucket-item"][data-bucket-content="${edited}"]`)).toBeVisible();
    } finally {
      await cleanupBucketByContent(api, token, content);
      await cleanupBucketByContent(api, token, edited);
      await api.dispose();
    }
  });

  // B5 — delete an inbox item via its menu → confirm; the row is gone.
  test('delete an inbox item', async ({ page }, testInfo) => {
    const content = `e2e-inbox-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();

    try {
      await createBucketViaApi(api, token, content);
      await page.goto('/quick-access/bucket');
      const item = page.locator(`[data-testid="bucket-item"][data-bucket-content="${content}"]`);
      await expect(item).toBeVisible();

      await item.click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await page.getByTestId('confirm-dialog-confirm-button').click();

      await expect(item).toHaveCount(0);
    } finally {
      await cleanupBucketByContent(api, token, content);
      await api.dispose();
    }
  });

  // B6 — capturing content over the 500-char limit shows an inline max error.
  test('capture content over the limit shows an inline error', async ({ page }) => {
    await page.goto('/quick-access/bucket');
    const panel = page.getByTestId('bucket-inbox-panel');
    await panel.getByRole('textbox').fill('x'.repeat(501));
    await panel.getByRole('button', { name: /add to bucket/i }).click();

    await expect(panel.getByRole('alert').first()).toBeVisible();
  });

  // B8 — after processing, the item shows under the Archived tab.
  test('processed item appears in the Archived tab', async ({ page }, testInfo) => {
    const content = `e2e-inbox-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();

    try {
      await captureInboxItem(page, content);
      const item = page.locator(`[data-testid="bucket-item"][data-bucket-content="${content}"]`);
      await expect(item).toBeVisible();

      // Process to a task (Task is the default type, first project auto-selected).
      await item.click();
      await page.getByRole('menuitem', { name: /process/i }).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();
      await dialog.getByTestId('form-dialog-submit-button').click();
      await expect(item).toHaveCount(0);

      // Open the Archived tab — the processed content is listed there.
      await page.getByTestId('bucket-tab-archived').click();
      await expect(page.getByTestId('bucket-archived-panel').getByText(content)).toBeVisible();
    } finally {
      await cleanupBucketByContent(api, token, content);
      await api.dispose();
    }
  });
});

// B7 — process-to-task on an account with zero projects shows the "no projects"
// alert and blocks submit. Needs a dedicated zero-project account; skips without it.
test.describe('@extended Bucket — zero projects (live)', () => {
  const ZERO_EMAIL = process.env['E2E_ZERO_PROJECT_EMAIL'];
  const ZERO_PASSWORD = process.env['E2E_ZERO_PROJECT_PASSWORD'];
  test.skip(!LIVE, 'requires live staging');
  test.skip(
    !(ZERO_EMAIL && ZERO_PASSWORD),
    'requires a seeded account with zero projects — set E2E_ZERO_PROJECT_EMAIL / E2E_ZERO_PROJECT_PASSWORD'
  );

  test('process-to-task with no projects shows the no-projects alert', async ({ browser }) => {
    const api = await playwrightRequest.newContext();
    const res = await api.post(`${apiDirect}/auth/login`, {
      data: { identifier: ZERO_EMAIL, password: ZERO_PASSWORD, remember: true },
      headers: process.env['E2E_BYPASS_TOKEN'] ? { 'X-E2E-Bypass': process.env['E2E_BYPASS_TOKEN'] } : {},
    });
    const body = await res.json();
    const token = body?.data?.token as string;
    const user = body?.data?.user as unknown;
    const persistRoot = JSON.stringify({
      auth: JSON.stringify({ user, token, isLoading: false }),
      _persist: JSON.stringify({ version: -1, rehydrated: true }),
    });
    const ctx = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: 'persist:root', value: persistRoot }] }],
      },
    });
    const content = `e2e-inbox-noproj-${Date.now()}`;

    try {
      const page = await ctx.newPage();
      await createBucketViaApi(api, token, content);
      await page.goto('/quick-access/bucket');
      const item = page.locator(`[data-testid="bucket-item"][data-bucket-content="${content}"]`);
      await expect(item).toBeVisible();

      await item.click();
      await page.getByRole('menuitem', { name: /process/i }).click();
      const dialog = page.getByTestId('form-dialog-content');
      await expect(dialog).toBeVisible();

      // Task is the default type → the no-projects alert shows and submit is blocked.
      await expect(dialog.getByRole('alert')).toBeVisible();
      await expect(dialog.getByTestId('form-dialog-submit-button')).toBeDisabled();
    } finally {
      await cleanupBucketByContent(api, token, content);
      await ctx.close();
      await api.dispose();
    }
  });
});

// Creates a bucket item straight through the API so edit/delete specs start from a
// known row without re-driving capture (that's B1's job).
async function createBucketViaApi(
  api: Awaited<ReturnType<typeof playwrightRequest.newContext>>,
  token: string,
  content: string
): Promise<string> {
  const res = await api.post(`${apiBase}/bucket`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { content },
  });
  const body = await res.json();
  const id = body?.data?.id as string | undefined;
  if (!id) throw new Error(`create bucket failed: ${JSON.stringify(body?.error ?? body)}`);
  return id;
}

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
