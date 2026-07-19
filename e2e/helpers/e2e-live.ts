/// <reference types="node" />
import { type APIRequestContext, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const LIVE = !!process.env['E2E_LIVE'];

const EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';
const API = process.env['E2E_API_STAGING'] ?? 'http://localhost:8080/v1';
const PASSWORD_PLACEHOLDER = '••••••••';

export const apiBase = API;

// Frontend origin the UI specs run against. Live builds serve the branch bundle
// on :4173 (see playwright.config); PLAYWRIGHT_BASE_URL overrides for a run that
// targets an already-deployed frontend.
export const baseURL =
  process.env['PLAYWRIGHT_BASE_URL'] ?? (process.env['E2E_LIVE'] ? 'http://localhost:4173' : 'http://localhost:5173');

// Written once by global-setup (single login/run — staging rate-limits login).
export const TOKEN_FILE = join(process.cwd(), 'test-results', '.e2e-token');

// Pre-authed browser session seeded by global-setup; the live project loads it so
// every spec starts logged in without hitting /auth/login per test.
export const STORAGE_STATE = join(process.cwd(), 'test-results', '.e2e-storage-state.json');

// Sentinels seeded on staging. Resolve by NAME at runtime; never edit/delete.
export const AREA_SENTINEL = '__E2E_DEFAULT_AREA__';
export const PROJECT_SENTINEL = '__E2E_DEFAULT_PROJECT__';

// Run + retry scoped, so a retry can't collide with a row its prior attempt
// leaked before finally ran.
export function uniqueSuffix(retry: number): string {
  return `${process.env['GITHUB_RUN_ID'] ?? 'local'}-${retry}`;
}

// The shared access token from global-setup. Used for all API setup/teardown.
export function getToken(): string {
  return readFileSync(TOKEN_FILE, 'utf8').trim();
}

// Real UI login — used only by auth.spec (it IS the login test). Everyone else
// uses getToken() to avoid re-logging-in and tripping the login rate limit.
export async function loginViaUI(page: Page): Promise<string> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByPlaceholder(PASSWORD_PLACEHOLDER).fill(PASSWORD);

  const loginResp = page.waitForResponse(r => r.url().includes('/auth/login') && r.request().method() === 'POST', {
    timeout: 30_000,
  });
  await page.getByRole('button', { name: /sign in/i }).click();

  const body = await (await loginResp).json();
  const token = body?.data?.token as string | undefined;
  if (!token) throw new Error(`login failed: ${JSON.stringify(body?.error ?? body)}`);

  await expect(page).not.toHaveURL(/sign-in/, { timeout: 15_000 });
  return token;
}

export async function resolveProjectId(request: APIRequestContext, token: string, name: string): Promise<string> {
  const res = await request.get(`${API}/areas/with-projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  type P = { id: string; name: string };
  type A = { projects?: P[] };
  for (const a of (body.data ?? []) as A[]) {
    const hit = (a.projects ?? []).find(p => p.name === name);
    if (hit) return hit.id;
  }
  throw new Error(`sentinel project '${name}' not found — run scripts/seed-e2e.sh`);
}

// Best-effort teardown DELETE; never throws (sweep is the safety net).
export async function bestEffortDelete(request: APIRequestContext, token: string, path: string): Promise<void> {
  try {
    await request.delete(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    /* swallow */
  }
}
