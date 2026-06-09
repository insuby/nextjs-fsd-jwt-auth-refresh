/**
 * Minimal JWT helpers. We only READ the `exp` claim to decide when to refresh —
 * we never verify the signature (DummyJSON is the authority; a wrong guess just
 * triggers a refresh or a 401, both handled). Runtime-agnostic (atob + TextDecoder
 * work in Node, the Edge runtime, and jsdom).
 */

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Returns the `exp` claim (seconds since epoch), or null if unreadable. */
export function decodeJwtExp(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * True when the token is expired or within `skewSeconds` of expiring (so the
 * proxy refreshes proactively). An unreadable token is treated as needing a
 * refresh.
 */
export function isExpiredOrNear(
  token: string,
  skewSeconds: number,
  nowMs: number = Date.now(),
): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  return exp * 1000 - nowMs <= skewSeconds * 1000;
}
