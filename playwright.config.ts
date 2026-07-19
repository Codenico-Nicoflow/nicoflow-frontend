import { defineConfig, devices } from '@playwright/test';

// PLAYWRIGHT_BASE_URL lets a live run (e.g. nightly against staging) point the
// suite at an already-deployed frontend instead of spinning up a local dev
// server. When it's set we skip the webServer entirely. See e2e/auth.spec.ts for
// the E2E_LIVE-gated tests that require a real backend behind that URL.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const useExternalServer = !!process.env.PLAYWRIGHT_BASE_URL;
const isLive = !!process.env.E2E_LIVE;

export default defineConfig({
  testDir: './e2e',
  // Live runs share one staging account — serialize so specs don't fight over it.
  fullyParallel: !isLive,
  workers: isLive ? 1 : undefined,
  // Live login once in global-setup; the token is reused across specs.
  globalSetup: isLive ? './e2e/helpers/global-setup.ts' : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only manage a local dev server when we're not targeting an external URL.
  webServer: useExternalServer
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
