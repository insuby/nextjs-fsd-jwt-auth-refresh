import { type NextRequest, NextResponse } from 'next/server';

import { ApiError } from '@/shared/api';
import {
  ACCESS_TOKEN_COOKIE,
  clearTokensOnResponse,
  doRefresh,
  isExpiredOrNear,
  REFRESH_TOKEN_COOKIE,
  setTokensOnResponse,
} from '@/shared/api/server';
import { RoutesPath } from '@/shared/config';
import { env } from '@/shared/config/env';

// Next 16 middleware (renamed to `proxy`), Node runtime. Lives at the project
// root alongside `app/` — NOT inside it.
// NOTE: matcher entries must be STATIC string literals — Next parses them at
// compile time and can't resolve `RoutesPath.*` references here.
export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasSession = Boolean(refreshToken);

  // Public login page — bounce authenticated users to the dashboard.
  if (pathname === RoutesPath.LOGIN) {
    return hasSession
      ? NextResponse.redirect(new URL(RoutesPath.DASHBOARD, request.url))
      : NextResponse.next();
  }

  // Root — route by session presence.
  if (pathname === RoutesPath.ROOT) {
    const target = hasSession ? RoutesPath.DASHBOARD : RoutesPath.LOGIN;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Protected routes — require a session.
  if (!hasSession) {
    return NextResponse.redirect(new URL(RoutesPath.LOGIN, request.url));
  }

  // Proactively refresh when the access token is missing/expired/near-expiry so
  // the RSC render always reads a valid token (it cannot write cookies itself).
  const needsRefresh =
    !accessToken || isExpiredOrNear(accessToken, env.REFRESH_SKEW_SECONDS);

  if (!needsRefresh) {
    return NextResponse.next();
  }

  try {
    const tokens = await doRefresh(refreshToken!);
    // Forward the fresh token to THIS request's render, and persist to the browser.
    request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
    request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
    const response = NextResponse.next({ request });
    setTokensOnResponse(response, tokens);
    return response;
  } catch (error) {
    // Only drop the session on a DEFINITIVE auth rejection. A transient upstream
    // error (5xx, network blip) shouldn't log the user out and discard a still-
    // valid refresh token — let the request through and let the render retry.
    const authRejected =
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401 || error.status === 403);
    if (!authRejected) {
      return NextResponse.next();
    }
    const response = NextResponse.redirect(
      new URL(RoutesPath.LOGIN, request.url),
    );
    clearTokensOnResponse(response);
    return response;
  }
}
