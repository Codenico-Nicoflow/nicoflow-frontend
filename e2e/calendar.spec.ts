/// <reference types="node" />
import { expect, request as playwrightRequest, test } from '@playwright/test';

import {
  authGetJson,
  authSendJson,
  bestEffortDelete,
  createTask,
  getToken,
  LIVE,
  PROJECT_SENTINEL,
  resolveProjectId,
  uniqueSuffix,
} from './helpers/e2e-live';

// Calendar drag scheduling (NIC-1808) — seed a timed task via API, drag its
// block on the day grid, and assert the snapped time persisted server-side.

// yyyy-MM-dd for local "today" (matches the calendar's day keying).
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// One grid hour is 48px (HOUR_HEIGHT_PX) — two hours of drag travel.
const TWO_HOURS_PX = 96;

test.describe('@extended Calendar — drag to a specific time (live)', () => {
  test.skip(!LIVE, 'requires live staging + seeded Pro account');

  test('dragging a block two hours down persists the snapped time', async ({ page }, testInfo) => {
    const title = `e2e-cal-drag-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      taskId = await createTask(api, token, projectId, title);
      await authSendJson(
        api,
        token,
        'patch',
        `/tasks/${taskId}/schedule`,
        { scheduledFor: localToday(), scheduledTime: '09:00' },
        'scheduleTaskAtTime'
      );

      await page.goto('/calendar?view=day');
      const block = page.getByTestId(`calendar-block-${taskId}`);
      await expect(block).toBeVisible();

      // Drag the block body: press, cross the 4px arm threshold, travel two
      // hours, release. The block re-renders from the refetched cache after.
      const box = await block.boundingBox();
      if (!box) throw new Error('block has no bounding box');
      const startX = box.x + box.width / 2;
      const startY = box.y + 8;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY + 10, { steps: 3 });
      await page.mouse.move(startX, startY + TWO_HOURS_PX, { steps: 10 });
      await page.mouse.up();

      // 09:00 + 2h = 11:00, snapped — never an off-boundary value.
      await expect(block).toContainText('11:00');
      const stored = await authGetJson<{ data?: { scheduledTime?: string | null } }>(
        api,
        token,
        `/tasks/${taskId}`,
        'getTaskAfterDrag'
      );
      expect(stored.data?.scheduledTime).toBe('11:00');
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });

  test('the dialog is the keyboard path to the same time value', async ({ page }, testInfo) => {
    const title = `e2e-cal-dialog-${uniqueSuffix(testInfo.retry)}`;
    const api = await playwrightRequest.newContext();
    const token = getToken();
    const projectId = await resolveProjectId(api, token, PROJECT_SENTINEL);
    let taskId: string | undefined;

    try {
      taskId = await createTask(api, token, projectId, title);
      await authSendJson(
        api,
        token,
        'patch',
        `/tasks/${taskId}/schedule`,
        { scheduledFor: localToday(), scheduledTime: '09:00' },
        'scheduleTaskAtTime'
      );

      await page.goto('/calendar?view=day');
      // Enter on the focused block opens the shared TaskDialog.
      await page.getByTestId(`calendar-block-${taskId}`).focus();
      await page.keyboard.press('Enter');

      const timeInput = page.getByTestId('scheduled-time-input');
      await expect(timeInput).toHaveValue('09:00');
      await timeInput.fill('14:30');
      await page.getByTestId('form-dialog-submit-button').click();

      const stored = await authGetJson<{ data?: { scheduledTime?: string | null } }>(
        api,
        token,
        `/tasks/${taskId}`,
        'getTaskAfterDialogEdit'
      );
      expect(stored.data?.scheduledTime).toBe('14:30');
    } finally {
      if (taskId) await bestEffortDelete(api, token, `/tasks/${taskId}`);
      await api.dispose();
    }
  });
});
