import { expect, test } from '@playwright/test';

test('app loads and redirects unauthenticated user to sign-in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/nicoflow/i);
  await expect(page).toHaveURL(/sign-in/);
});
