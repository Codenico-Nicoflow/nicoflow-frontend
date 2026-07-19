import { defineConfig, devices } from '@playwright/test';

import { STORAGE_STATE } from './e2e/helpers/e2e-live';

// Live E2E model: serve THIS branch's built frontend locally and point it at the
// real staging API (VITE_API_URL). That way the UI under test is exactly the code
// in the PR — new data-testids and all — while still exercising the live backend
// and its contract. PLAYWRIGHT_BASE_URL overrides the served URL for a run that
// wants to hit an already-deployed frontend instead (e.g. a smoke against prod).
const isLive = !!process.env.E2E_LIVE;
const LIVE_PREVIEW_URL = 'http://localhost:4173';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? (isLive ? LIVE_PREVIEW_URL : 'http://localhost:5173');
const useExternalServer = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  // Live runs share one staging account — serialize so specs don't fight over it.
  fullyParallel: !isLive,
  workers: isLive ? 1 : undefined,
  // Live: log in once + seed the storageState the authed project reuses.
  globalSetup: isLive ? './e2e/helpers/global-setup.ts' : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: isLive
    ? [
        // auth.spec drives a real login/logout/register, so it must start signed
        // OUT — no seeded session.
        {
          name: 'auth',
          testMatch: /auth\.spec\.ts/,
          use: { ...devices['Desktop Chrome'] },
        },
        // Every other spec starts already authenticated via the seeded
        // storageState from global-setup, then drives the UI as a logged-in user.
        {
          name: 'authed',
          testIgnore: /auth\.spec\.ts/,
          use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ],
  webServer: useExternalServer
    ? undefined
    : isLive
      ? {
          // Serve the pre-built branch bundle AND reverse-proxy /v1 → staging so
          // browser XHR is same-origin (staging CORS allows only the Vercel
          // origin). Build with VITE_API_URL=/v1 so requests hit this proxy.
          command: 'node e2e/serve-e2e.mjs',
          url: LIVE_PREVIEW_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : {
          command: 'pnpm dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
});
