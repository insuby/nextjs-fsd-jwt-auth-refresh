import { cache } from 'react';

import { doRefresh, type Tokens } from './refresh';

export type RefreshState = {
  inflight: Promise<Tokens> | null;
  tokens: Tokens | null;
};

/**
 * Request-scoped refresh state. React's `cache()` returns the SAME object for
 * every call within one server request, and a FRESH one per request. That gives:
 *   - single-flight WITHIN a request (parallel 401s share one refresh), and
 *   - full isolation ACROSS requests/sessions (no shared state to leak),
 * with NO module-global — the rule the repo enforces for `getQueryClient()`.
 *
 * `tokens` is kept for the whole request once a refresh succeeds, so EVERY later
 * call in the same render reuses that result instead of re-reading the (now stale)
 * cookie and triggering a second refresh — i.e. exactly one refresh per request,
 * correct even against backends that rotate/invalidate refresh tokens.
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
