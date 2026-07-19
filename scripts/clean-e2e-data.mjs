// Local cleanup of leftover e2e-* data via the API (mirrors the nightly SQL
// sweep). Spares the __E2E_*__ sentinels. Run: node scripts/clean-e2e-data.mjs
// Requires env: E2E_API_STAGING, E2E_TEST_EMAIL, E2E_TEST_PASSWORD.
const API = process.env.E2E_API_STAGING;
const EMAIL = process.env.E2E_TEST_EMAIL;
const PW = process.env.E2E_TEST_PASSWORD;
const arr = (x) => (Array.isArray(x) ? x : x?.items ?? []);

const login = async () => {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: EMAIL, password: PW, remember: true }),
  });
  const j = await r.json();
  if (!j.data?.token) throw new Error(`login failed: ${JSON.stringify(j.error ?? j)}`);
  return j.data.token;
};

const token = await login();
const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const del = (path) => fetch(`${API}${path}`, { method: 'DELETE', headers: h });

const tree = await (await fetch(`${API}/areas/with-projects`, { headers: h })).json();
let a = 0,
  p = 0,
  t = 0,
  b = 0;

for (const area of tree.data) {
  for (const proj of arr(area.projects)) {
    if (!proj.name.startsWith('e2e-')) continue;
    const tasks = await (await fetch(`${API}/projects/${proj.id}/tasks`, { headers: h })).json();
    for (const task of arr(tasks.data)) {
      if ((task.title ?? '').startsWith('e2e-')) {
        await del(`/tasks/${task.id}`);
        t++;
      }
    }
    await del(`/projects/${proj.id}`);
    p++;
  }
  if (area.name.startsWith('e2e-')) {
    await del(`/areas/${area.id}`);
    a++;
  }
}

const bucket = await (await fetch(`${API}/bucket`, { headers: h })).json();
for (const item of arr(bucket.data)) {
  if ((item.content ?? '').startsWith('e2e-')) {
    await del(`/bucket/${item.id}`);
    b++;
  }
}

console.log(`cleaned: areas=${a} projects=${p} tasks=${t} bucket=${b}`);
