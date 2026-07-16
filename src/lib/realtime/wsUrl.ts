// Derive the WebSocket URL + token from the same base the REST client uses, so
// there's one source of truth for the API origin. `VITE_API_URL` is an http(s)
// origin ending in `/v1`; swap the scheme to ws(s) and append `/ws?token=`.
// A dedicated `VITE_WS_URL` overrides it when the socket lives on another host.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1';

export const buildWsUrl = (token: string): string => {
  const explicit = import.meta.env.VITE_WS_URL;
  const base = explicit ?? `${API_BASE.replace(/^http/, 'ws')}/ws`;
  return `${base}?token=${encodeURIComponent(token)}`;
};
