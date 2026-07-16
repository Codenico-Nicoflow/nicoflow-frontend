// Decode the `exp` (seconds since epoch) out of a JWT without a dependency: split
// on '.', base64url-decode the payload, read `exp`. Returns null for anything that
// isn't a well-formed JWT with a numeric exp — callers treat null as "unknown, don't
// block" so a parse quirk never wedges the socket.
export const jwtExpiryMs = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { exp?: unknown };
    return typeof claims.exp === 'number' ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
};

// True when the token is missing, unparseable, already expired, or within `skewMs`
// of expiry — the signal to refresh before opening the socket (a token that expires
// mid-handshake gets a 1008 close). Unknown expiry (null) is treated as fresh: we
// don't hold the connection hostage over a decode we couldn't do.
export const isTokenExpiring = (token: string | null, skewMs = 30_000): boolean => {
  if (!token) return true;
  const expMs = jwtExpiryMs(token);
  if (expMs === null) return false;
  return expMs - Date.now() <= skewMs;
};
