/// <reference types="node" />
import { request } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { apiBase, TOKEN_FILE } from './e2e-live';

// Logs in ONCE per run and writes the token to disk. Staging rate-limits
// /auth/login (~10/min/IP); fresh-login-per-spec × retries blows that, so every
// spec reuses this single token instead. Runs only for LIVE runs.
export default async function globalSetup(): Promise<void> {
  if (!process.env['E2E_LIVE']) return;

  const email = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
  const password = process.env['E2E_TEST_PASSWORD'] ?? 'Password1test';

  const ctx = await request.newContext();
  // Retry on a transient rate-limit (login is IP-throttled): back off and retry
  // rather than fail the whole run on a 429.
  let token: string | undefined;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await ctx.post(`${apiBase}/auth/login`, {
      data: { identifier: email, password, remember: true },
    });
    const body = await res.json();
    token = body?.data?.token;
    if (token) break;
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
}
