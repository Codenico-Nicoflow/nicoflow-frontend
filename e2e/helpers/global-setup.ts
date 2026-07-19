/// <reference types="node" />
import { request } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { apiDirect, baseURL, STORAGE_STATE, TOKEN_FILE } from './e2e-live';

// Authenticate ONCE per run, then hand every spec a ready-to-use browser session
// via Playwright storageState — no per-spec login, so staging's login rate limit
// (~10/min/IP) is never a factor.
//
// The app keeps the access token in memory only and rehydrates the rest of the
// auth slice from localStorage `persist:root` on load. We exploit that: we seed
// `persist:root` with { user, token } so a fresh browser context boots already
// authenticated — no /auth/refresh-token round-trip, so the rotating refresh
// cookie is never consumed and reuse-detection can't fire across specs.
//
// Also writes the raw token to TOKEN_FILE for the API-only teardown/precondition
// calls the specs make (create fixtures, delete leftovers).
export default async function globalSetup(): Promise<void> {
  if (!process.env['E2E_LIVE']) return;

  const email = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
  const password = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';

  const ctx = await request.newContext();

  // Retry on a transient rate-limit (login is IP-throttled): back off and retry
  // rather than fail the whole run on a 429.
  let token: string | undefined;
  let user: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const bypass = process.env['E2E_BYPASS_TOKEN'];
    const res = await ctx.post(`${apiDirect}/auth/login`, {
      data: { identifier: email, password, remember: true },
      headers: bypass ? { 'X-E2E-Bypass': bypass } : {},
    });
    const body = await res.json();
    token = body?.data?.token;
    user = body?.data?.user;
    if (token && user) break;
    if (res.status() === 429 && attempt < 4) {
      await new Promise(r => setTimeout(r, 15_000));
      continue;
    }
    await ctx.dispose();
    throw new Error(`global-setup login failed (HTTP ${res.status()}): ${JSON.stringify(body?.error ?? body)}`);
  }
  await ctx.dispose();

  mkdirSync(dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, token!, 'utf8');

  // redux-persist stores each whitelisted slice as its own JSON string inside
  // `persist:root`. Seed the auth slice so PrivateRoutes sees a user and
  // prepareHeaders sees a token — the app is authed on first paint.
  const persistRoot = JSON.stringify({
    auth: JSON.stringify({ user, token, isLoading: false }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL).origin,
        localStorage: [{ name: 'persist:root', value: persistRoot }],
      },
    ],
  };

  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  writeFileSync(STORAGE_STATE, JSON.stringify(storageState), 'utf8');
}
