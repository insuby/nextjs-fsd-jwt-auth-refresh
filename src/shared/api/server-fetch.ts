import { env } from 'shared/config/env';

import { ApiError, apiFetch, type ApiFetchOptions } from './api-client';
import { SessionExpiredError } from './errors';
import { readTokens, setTokens } from './session/cookies';
import {
  getRefreshedTokens,
  refreshOnce,
} from './session/refresh-single-flight';

export type ServerFetchOptions = Omit<ApiFetchOptions, 'baseUrl'> & {
  /** Skip the bearer + 401-refresh-retry (e.g. the login call itself). Default true. */
  auth?: boolean;
};

function withAuth(
  headers: HeadersInit | undefined,
  token: string | undefined,
): Headers {
  const merged = new Headers(headers);
  if (token) merged.set('Authorization', `Bearer ${token}`);
  return merged;
}

/**
 * Authenticated server-side transport against `env.API_BASE_URL`. Attaches the
 * access token from cookies; on a 401 it performs a single-flight refresh + ONE
 * transparent retry. Throws `SessionExpiredError` when the session can't be
 * recovered (caller → logout).
 *
 * SERVER-ONLY (reads cookies). Import from `shared/api/server`, never from a
 * Client Component.
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const cookieTokens = await readTokens();

  // If a refresh already happened earlier in THIS request, use those tokens up
  // front — so only the FIRST 401 in a request ever triggers a refresh.
  const refreshed = auth ? getRefreshedTokens() : null;
  const accessToken = refreshed?.accessToken ?? cookieTokens.accessToken;
  const refreshToken = refreshed?.refreshToken ?? cookieTokens.refreshToken;

  const call = (token: string | undefined) =>
    apiFetch<T>(path, {
      ...rest,
      baseUrl: env.API_BASE_URL,
      headers: withAuth(headers, token),
    });

  try {
    return await call(accessToken);
  } catch (error) {
    const unauthorized = error instanceof ApiError && error.status === 401;
    if (!auth || !unauthorized) throw error;

    if (!refreshToken) throw new SessionExpiredError('No refresh token');

    let tokens;
    try {
      tokens = await refreshOnce(refreshToken);
    } catch {
      throw new SessionExpiredError('Token refresh failed');
    }

    // Persist when the context allows cookie writes (Server Actions / Route
    // Handlers). During an RSC render `cookies().set()` throws — swallow it; the
    // request-scoped single-flight (above) still makes the fresh tokens
    // authoritative for the rest of THIS render. Note: on the RSC path the new
    // pair isn't written to cookies, so the next request's proxy re-refreshes from
    // the stored refresh token. That's fine for reusable refresh tokens (DummyJSON);
    // a backend that rotates/invalidates them would need the proxy to be the sole
    // refresher (it can write cookies pre-render).
    try {
      await setTokens(tokens);
    } catch {
      /* cookie write not allowed in this context (RSC render) */
    }

    try {
      return await call(tokens.accessToken);
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        throw new SessionExpiredError('Still unauthorized after refresh');
      }
      throw retryError;
    }
  }
}
