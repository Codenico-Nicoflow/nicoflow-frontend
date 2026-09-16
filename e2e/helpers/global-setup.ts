/// <reference types="node" />
import { request } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { apiDirect, baseURL, STORAGE_STATE, TOKEN_FILE } from './e2e-live';

// Authenticate ONCE per run, then hand every spec a ready-to-use browser session
// via Playwright storageState — no per-spec login, so staging's login rate limit
// (~10/min/IP) is never a factor.
//
// The app keeps the access token in memory only, so a seeded `persist:root`
// token is dropped on boot by design — seeding it is not enough to authenticate
// the browser. The app renders on the persisted `user`, lets the first authed
// query 401, and recovers via the mutex-guarded refresh in baseQuery. That
// refresh authenticates with the HttpOnly refresh cookie, so the cookie is the
// load-bearing part of storageState: without it the refresh fails definitively
// (INVALID_REFRESH_TOKEN), baseQuery clears auth, and every list renders empty.
//
// Also writes the raw token to TOKEN_FILE for the API-only teardown/precondition
// calls the specs make (create fixtures, delete leftovers).
const REFRESH_COOKIE_NAMES = ['__Secure-refresh_token', 'refresh_token'];

export default async function globalSetup(): Promise<void> {
  if (!process.env['E2E_LIVE']) return;

  const email = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
  const password = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';

  const ctx = await request.newContext();
  const browserOrigin = new URL(baseURL);

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

  // The refresh cookie is what actually authenticates the browser session. It is
  // issued for the API origin; the specs drive the app through the preview server
  // that proxies /v1, so re-scope it to that origin or the browser never sends it.
  // Staging names it `__Secure-refresh_token`, development `refresh_token`.
  const issued = (await ctx.storageState()).cookies.find(c => REFRESH_COOKIE_NAMES.includes(c.name));
  await ctx.dispose();

  if (!issued) {
    throw new Error(
      'global-setup: login set no refresh cookie — the browser session cannot refresh and every authed spec will fail'
    );
  }

  // A `__Secure-`-prefixed cookie is only accepted over https. When the specs run
  // against the plain-http preview server, carry the value under the unprefixed
  // name the dev backend uses so the proxied refresh still authenticates.
  const overHttps = browserOrigin.protocol === 'https:';
  const refreshCookie = {
    name: overHttps ? issued.name : issued.name.replace(/^__Secure-/, ''),
    value: issued.value,
    domain: browserOrigin.hostname,
    path: '/v1/auth',
    expires: issued.expires,
    httpOnly: true,
    secure: overHttps,
    sameSite: 'Lax' as const,
  };

  mkdirSync(dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, token!, 'utf8');

  // redux-persist stores each whitelisted slice as its own JSON string inside
  // `persist:root`. Seed the auth slice so PrivateRoutes sees a user and the app
  // renders protected content; the token is seeded too but is dropped on boot
  // (memory-only), so the first authed query 401s and refreshes via the cookie.
  const persistRoot = JSON.stringify({
    auth: JSON.stringify({ user, token, isLoading: false }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });

  const storageState = {
    cookies: [refreshCookie],
    origins: [
      {
        origin: browserOrigin.origin,
        localStorage: [{ name: 'persist:root', value: persistRoot }],
      },
    ],
  };

  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  writeFileSync(STORAGE_STATE, JSON.stringify(storageState), 'utf8');
}
