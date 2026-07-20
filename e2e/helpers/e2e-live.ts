/// <reference types="node" />
import { type APIRequestContext, type Browser, type BrowserContext, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const LIVE = !!process.env['E2E_LIVE'];

const EMAIL = process.env['E2E_TEST_EMAIL'] ?? 'e2e@nicoflow.test';
const PASSWORD = process.env['E2E_TEST_PASSWORD'] ?? 'Aa123456';
const API = process.env['E2E_API_STAGING'] ?? 'http://localhost:8080/v1';
const PASSWORD_PLACEHOLDER = '••••••••';

// A second seeded staging account on the FREE plan, for the plan-limit prompt
// cases (areas ≥3, projects ≥5). Absent creds ⇒ those specs skip, so the suite
// still runs on a machine without the free account provisioned.
const FREE_EMAIL = process.env['E2E_FREE_EMAIL'];
const FREE_PASSWORD = process.env['E2E_FREE_PASSWORD'];
export const freePlanConfigured = (): boolean => !!(FREE_EMAIL && FREE_PASSWORD);

// Frontend origin the UI specs run against. Live builds serve the branch bundle
// on :4173 (see playwright.config); PLAYWRIGHT_BASE_URL overrides for a run that
// targets an already-deployed frontend.
export const baseURL =
  process.env['PLAYWRIGHT_BASE_URL'] ?? (process.env['E2E_LIVE'] ? 'http://localhost:4173' : 'http://localhost:5173');

// The direct staging API (used by global-setup, which runs before the proxy is up).
export const apiDirect = API;

// Specs' own API calls (fixture setup / teardown / id lookups) go through the
// same :4173 proxy the browser uses, so they inherit its 429-retry and don't
// trip staging's burst limiter independently. Falls back to direct when not
// served through the local preview (e.g. targeting a deployed frontend).
export const apiBase = process.env['E2E_LIVE'] && !process.env['PLAYWRIGHT_BASE_URL'] ? `${baseURL}/v1` : API;

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
  type P = { id: string; name: string };
  type A = { projects?: P[] };
  const body = await authGetJson<{ data?: A[] }>(request, token, '/areas/with-projects', 'resolveProjectId');
  for (const a of body.data ?? []) {
    const hit = (a.projects ?? []).find(p => p.name === name);
    if (hit) return hit.id;
  }
  throw new Error(`sentinel project '${name}' not found — run scripts/seed-e2e.sh`);
}

// Best-effort teardown DELETE; never throws (sweep is the safety net).
export async function bestEffortDelete(request: APIRequestContext, token: string, path: string): Promise<void> {
  try {
    const bypass = process.env['E2E_BYPASS_TOKEN'];
    await request.delete(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}`, ...(bypass ? { 'X-E2E-Bypass': bypass } : {}) },
    });
  } catch {
    /* swallow */
  }
}

async function parseJson<T = unknown>(res: Awaited<ReturnType<APIRequestContext['get']>>, label: string): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${label}: non-JSON response (HTTP ${res.status()}): ${text.slice(0, 120)}`);
  }
}

// Auth headers for every spec API call. Carries the rate-limit bypass token
// directly too (not only via the serve-e2e proxy) so a call that reaches staging
// on any path still skips the burst limiter — the batch suite fans out far more
// writes than the ~7-req burst window allows.
function authHeaders(token: string): Record<string, string> {
  const bypass = process.env['E2E_BYPASS_TOKEN'];
  return { Authorization: `Bearer ${token}`, ...(bypass ? { 'X-E2E-Bypass': bypass } : {}) };
}

const RETRYABLE = [429, 502, 503, 504];

// Authenticated GET → parsed JSON, retrying transient non-OK responses (502/503/429
// from a cold or throttled staging) with a short backoff before giving up.
export async function authGetJson<T = unknown>(
  request: APIRequestContext,
  token: string,
  path: string,
  label = `GET ${path}`
): Promise<T> {
  let last = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await request.get(`${apiBase}${path}`, { headers: authHeaders(token) });
    if (res.ok()) return parseJson<T>(res, label);
    last = `HTTP ${res.status()}`;
    if (!RETRYABLE.includes(res.status())) return parseJson<T>(res, label); // let caller inspect a real error body
    await new Promise(r => setTimeout(r, 400 * 2 ** attempt));
  }
  throw new Error(`${label} failed (${last})`);
}

// Authenticated write (POST/PATCH) → parsed JSON, with the same transient retry.
export async function authSendJson<T = unknown>(
  request: APIRequestContext,
  token: string,
  method: 'post' | 'patch',
  path: string,
  data: unknown,
  label = `${method.toUpperCase()} ${path}`
): Promise<T> {
  let last = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await request[method](`${apiBase}${path}`, { headers: authHeaders(token), data });
    if (res.ok()) return parseJson<T>(res, label);
    last = `HTTP ${res.status()}`;
    if (!RETRYABLE.includes(res.status())) return parseJson<T>(res, label);
    await new Promise(r => setTimeout(r, 400 * 2 ** attempt));
  }
  throw new Error(`${label} failed (${last})`);
}

// Shared fixture creators — every spec seeds tasks/areas/projects the same way, so
// they live here once (retrying + bypass-carrying via authSendJson) instead of
// being copy-pasted per file where a stray raw res.json() can crash on a 429.
type Created = { data?: { id?: string }; error?: unknown };

export async function createTask(
  request: APIRequestContext,
  token: string,
  projectId: string,
  title: string
): Promise<string> {
  const body = await authSendJson<Created>(
    request,
    token,
    'post',
    '/tasks',
    { projectId, title, priority: 'low', energy: 'medium' },
    'createTask'
  );
  const id = body?.data?.id;
  if (!id) throw new Error(`create task failed: ${JSON.stringify(body?.error ?? body)}`);
  return id;
}

export async function createArea(request: APIRequestContext, token: string, name: string): Promise<string> {
  const body = await authSendJson<Created>(
    request,
    token,
    'post',
    '/areas',
    { name, color: '#6366f1', icon: 'folder' },
    'createArea'
  );
  const id = body?.data?.id;
  if (!id) throw new Error(`create area failed: ${JSON.stringify(body?.error ?? body)}`);
  return id;
}

export async function createProject(
  request: APIRequestContext,
  token: string,
  areaId: string,
  name: string
): Promise<string> {
  const body = await authSendJson<Created>(
    request,
    token,
    'post',
    `/areas/${areaId}/projects`,
    { name },
    'createProject'
  );
  const id = body?.data?.id;
  if (!id) throw new Error(`create project failed: ${JSON.stringify(body?.error ?? body)}`);
  return id;
}

// Log the free-plan account in directly against the API and return its token.
// Guarded by freePlanConfigured(); callers must skip when it's false.
export async function loginFreePlan(request: APIRequestContext): Promise<{ token: string; user: unknown }> {
  const res = await request.post(`${apiDirect}/auth/login`, {
    data: { identifier: FREE_EMAIL, password: FREE_PASSWORD, remember: true },
    headers: process.env['E2E_BYPASS_TOKEN'] ? { 'X-E2E-Bypass': process.env['E2E_BYPASS_TOKEN'] } : {},
  });
  const body = await res.json();
  const token = body?.data?.token as string | undefined;
  const user = body?.data?.user;
  if (!token || !user) throw new Error(`free-plan login failed: ${JSON.stringify(body?.error ?? body)}`);
  return { token, user };
}

// Build a browser context already authenticated as the free-plan account, using
// the same in-memory-token seed trick global-setup uses for the Pro account (so
// no /refresh-token round-trip consumes the rotating cookie). Caller closes it.
export async function newFreePlanContext(browser: Browser, request: APIRequestContext): Promise<BrowserContext> {
  const { token, user } = await loginFreePlan(request);
  const persistRoot = JSON.stringify({
    auth: JSON.stringify({ user, token, isLoading: false }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });
  return browser.newContext({
    storageState: {
      cookies: [],
      origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: 'persist:root', value: persistRoot }] }],
    },
  });
}
