import { cache } from 'react';

import { doRefresh, type Tokens } from './refresh';

export type RefreshState = {
  inflight: Promise<Tokens> | null;
  tokens: Tokens | null;
};

/**
 * Request-scoped refresh state, via React's `cache()`.
 *
 * IMPORTANT: `cache()` only memoizes during an RSC RENDER pass. React returns the
 * SAME object for every call within one render (and a fresh one per render), but
 * OUTSIDE a render it has no request scope and simply calls through — a FRESH
 * object every call (react 19's `cache` no-ops when the cache dispatcher is
 * absent, which it is in Server Actions / Route Handlers). So:
 *   - In an RSC render: true single-flight — parallel 401s share one refresh, and
 *     the cached `tokens` make every later call in the render reuse that result
 *     rather than re-reading the (stale) cookie and refreshing again. Holds even
 *     against backends that rotate/invalidate refresh tokens.
 *   - In a Server Action: there is NO render scope, so this does not dedupe across
 *     calls. That's fine for the current code paths — actions make SEQUENTIAL
 *     authed calls and persist the refreshed pair to cookies (a Server Action can
 *     write them), so the next `serverFetch` re-reads the fresh access token
 *     instead of refreshing again. The case to watch is PARALLEL authed calls in
 *     one action against a rotating-token backend (none exist today).
 *
 * Either way there is NO module-global, so nothing leaks across requests/sessions
 * — the same rule the repo enforces for `getQueryClient()`.
 */
export const getRefreshState = cache(
  (): RefreshState => ({
    inflight: null,
    tokens: null,
  }),
);

/**
 * Core single-flight, decoupled from React's `cache()` so it's unit-testable.
 * Callers sharing one state: a finished refresh is reused (`tokens`); an in-flight
 * one is awaited (`inflight`); only the first caller actually refreshes. `inflight`
 * resets on settle so a genuinely-later refresh can run if a fresh token also
 * fails — but a SUCCESS is cached for the request lifetime.
 */
export function runSingleFlight(
  state: RefreshState,
  refreshToken: string,
  refresh: (token: string) => Promise<Tokens> = doRefresh,
): Promise<Tokens> {
  if (state.tokens) return Promise.resolve(state.tokens);
  state.inflight ??= refresh(refreshToken)
    .then((tokens) => {
      state.tokens = tokens;
      return tokens;
    })
    .finally(() => {
      state.inflight = null;
    });
  return state.inflight;
}

/** Production entry: single-flight refresh scoped to the current server request. */
export function refreshOnce(refreshToken: string): Promise<Tokens> {
  return runSingleFlight(getRefreshState(), refreshToken);
}

/**
 * The tokens already refreshed in THIS request, if any. `serverFetch` consults
 * this first so calls after a refresh use the fresh access token rather than the
 * stale cookie — guaranteeing one refresh per request.
 */
export function getRefreshedTokens(): Tokens | null {
  return getRefreshState().tokens;
}
