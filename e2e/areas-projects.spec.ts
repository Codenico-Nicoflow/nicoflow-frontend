/// <reference types="node" />
import { expect, type Page, test } from '@playwright/test';

// Mirrors e2e/auth.spec.ts: these journeys need a real backend on :8080 (or a
// staging URL via PLAYWRIGHT_BASE_URL) AND a seeded, pre-verified account, so
// they stay skipped in the mocked CI run and turn on for the nightly-against-
// staging epic that supplies E2E_LIVE + the credentials. They are written now so
// that epic only has to flip the flag, not author the flows.
const LIVE = !!process.env['E2E_LIVE'];
const TEST_EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const TEST_PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Password1test';
const PASSWORD_PLACEHOLDER = '••••••••';

async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/sign-in/);
}

// Unique suffix so reruns against a persistent staging DB don't collide on the
// (user_id, name) unique constraint.
const uniq = () => Date.now().toString().slice(-6);

test.describe('Areas & Projects — board journeys (live)', () => {
  test.skip(!LIVE, 'requires a live backend + seeded verified account — set E2E_LIVE (nightly against staging)');

  // #33 / R16: create area (color + icon) → add project (with description) →
  // open it → ProjectView shows the header + description.
  test('create area with color → add project with description → open it', async ({ page }) => {
    await signIn(page);
    await page.goto('/areas');

    const areaName = `Work ${uniq()}`;
    const projectName = `Q3 Launch ${uniq()}`;
    const description = 'Ship the Q3 launch milestone.';

    // New area
    await page.getByTestId('board-new-area').click();
    await page.getByPlaceholder('Enter area name').fill(areaName);
    await page.getByTestId('color-trigger').click();
    await page.getByLabel('Ember').click();
    await page.getByTestId('form-dialog-submit-button').click();

    const card = page.getByText(areaName);
    await expect(card).toBeVisible();

    // Add a project into that area, with a description
    await page
      .getByRole('button', { name: /add project/i })
      .first()
      .click();
    await page.getByPlaceholder('Enter your project name').fill(projectName);
    await page.getByPlaceholder(/description/i).fill(description);
    await page.getByTestId('form-dialog-submit-button').click();

    // Project row appears, open it → ProjectView header + description render
    const projectRow = page.getByText(projectName);
    await expect(projectRow).toBeVisible();
    await projectRow.click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });

  // #34: rename an area via its actions menu, then delete it via the confirm
  // dialog — the area (and, with the cascade, its projects) leaves the board.
  test('rename then delete an area end-to-end', async ({ page }) => {
    await signIn(page);
    await page.goto('/areas');

    const areaName = `Temp ${uniq()}`;
    const renamed = `${areaName} Renamed`;

    // Create
    await page.getByTestId('board-new-area').click();
    await page.getByPlaceholder('Enter area name').fill(areaName);
    await page.getByTestId('form-dialog-submit-button').click();
    await expect(page.getByText(areaName)).toBeVisible();

    // Rename via the card's actions menu
    const card = page.locator('[data-testid^="area-card-"]', { hasText: areaName });
    await card
      .getByRole('button', { name: /open menu|actions/i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.getByPlaceholder('Enter area name').fill(renamed);
    await page.getByTestId('form-dialog-submit-button').click();
    await expect(page.getByText(renamed)).toBeVisible();

    // Delete via the confirm dialog
    const renamedCard = page.locator('[data-testid^="area-card-"]', { hasText: renamed });
    await renamedCard
      .getByRole('button', { name: /open menu|actions/i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.getByRole('button', { name: /delete area/i }).click();
    await expect(page.getByText(renamed)).not.toBeVisible();
  });
});
