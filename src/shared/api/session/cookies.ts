import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import type { Tokens } from './refresh';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Secure cookies are required in production (HTTPS) but break auth when the app
// is served over plain HTTP (e.g. a staging box reached by IP) — the browser
// won't send Secure cookies over http. Default to secure in prod, but allow an
// explicit `COOKIE_SECURE=false` opt-out for HTTP-only deployments.
const SECURE_COOKIES =
  process.env.COOKIE_SECURE === 'false'
    ? false
    : process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: SECURE_COOKIES,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days (storage lifetime; JWT exp is separate)
} as const;

/** Read the token pair from the request cookies (Server Action / RSC). */
export async function readTokens(): Promise<{
  accessToken?: string;
  refreshToken?: string;
}> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

/** Persist tokens as httpOnly cookies. Only legal in a Server Action / Route Handler. */
export async function setTokens(tokens: Tokens): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, COOKIE_OPTIONS);
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
}

/** Clear both token cookies. Only legal in a Server Action / Route Handler. */
export async function clearTokens(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

/** Set tokens on a NextResponse — used by `proxy.ts`, which CAN write cookies pre-render. */
export function setTokensOnResponse(res: NextResponse, tokens: Tokens): void {
  res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, COOKIE_OPTIONS);
  res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
}

/** Clear tokens on a NextResponse (proxy.ts on refresh failure). */
export function clearTokensOnResponse(res: NextResponse): void {
  res.cookies.delete(ACCESS_TOKEN_COOKIE);
  res.cookies.delete(REFRESH_TOKEN_COOKIE);
}
