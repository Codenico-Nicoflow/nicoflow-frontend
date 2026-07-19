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
  const res = await ctx.post(`${apiBase}/auth/login`, {
    data: { identifier: email, password, remember: true },
  });
  const body = await res.json();
  await ctx.dispose();

  if (!body?.data?.token) {
    throw new Error(`global-setup login failed: ${JSON.stringify(body?.error ?? body)}`);
  }

  mkdirSync(dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, body.data.token, 'utf8');
}
