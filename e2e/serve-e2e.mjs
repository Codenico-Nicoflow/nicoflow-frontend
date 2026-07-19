// @ts-check
/**
 * Live-E2E static server + API proxy.
 *
 * The browser can't call the staging API cross-origin (staging CORS allows only
 * the Vercel origin). So we serve this branch's built bundle AND reverse-proxy
 * `/v1/*` to the staging API from the same origin — every browser XHR is then
 * same-origin (localhost:4173) and CORS never applies. The refresh cookie also
 * rides along on the same origin, so the reload/refresh flow works too.
 *
 * Point the build at `/v1` (VITE_API_URL=/v1) so requests hit this proxy.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.E2E_PREVIEW_PORT ?? 4173);
const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');

// Where /v1 is proxied. E2E_API_STAGING ends in /v1, so strip it to a base URL.
const apiEnv = process.env.E2E_API_STAGING ?? 'http://localhost:8080/v1';
const API = new URL(apiEnv.replace(/\/v1\/?$/, ''));
const upstreamRequest = API.protocol === 'https:' ? httpsRequest : httpRequest;

// Sent on every proxied call so the staging API skips rate limiting for the E2E
// suite (see nicoflow-api middleware.SetRateLimitBypassToken). Empty ⇒ no header,
// so the suite still runs (just subject to the burst limiter).
const BYPASS = process.env.E2E_BYPASS_TOKEN ?? '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const MAX_RETRIES = 5;

/** Proxy one buffered request to staging, retrying on 429 with backoff. */
function proxyWithRetry(res, path, method, headers, body, attempt) {
  const upstream = upstreamRequest(
    {
      protocol: API.protocol,
      hostname: API.hostname,
      port: API.port || (API.protocol === 'https:' ? 443 : 80),
      method,
      path,
      headers: { ...headers, host: API.host, ...(BYPASS ? { 'x-e2e-bypass': BYPASS } : {}) },
    },
    up => {
      // Burst-limited → back off and retry the same request; the browser waits.
      if (up.statusCode === 429 && attempt < MAX_RETRIES) {
        up.resume(); // drain
        const delay = 400 * 2 ** attempt; // 0.4s, 0.8s, 1.6s, 3.2s, 6.4s
        setTimeout(() => proxyWithRetry(res, path, method, headers, body, attempt + 1), delay);
        return;
      }
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    }
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end('proxy error');
  });
  if (body.length) upstream.write(body);
  upstream.end();
}

const server = createServer((req, res) => {
  const url = req.url ?? '/';

  // Proxy the API. Keep the /v1 prefix — staging is mounted there.
  if (url === '/v1' || url.startsWith('/v1/')) {
    // Buffer the body so we can transparently retry on 429 — staging has a tight
    // per-IP burst limiter, and a single page-load fans out ~6-9 parallel /v1
    // calls that trip it. Retrying here means the browser never sees a 429.
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => proxyWithRetry(res, url, req.method ?? 'GET', req.headers, Buffer.concat(chunks), 0));
    return;
  }

  // Static files, with SPA fallback to index.html for client routes.
  const clean = normalize(decodeURIComponent(url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(DIST, clean);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, 'index.html');
  }
  res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => console.log(`e2e preview + /v1 proxy → ${API.href} on http://localhost:${PORT}`));
