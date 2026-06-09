// Server-only public API of shared/api. Pulls in `next/headers` + React `cache`,
// so import this ONLY from server code (RSC, Server Actions, proxy.ts) — never
// from a Client Component (use the isomorphic `shared/api` barrel there).
export { serverFetch } from './server-fetch';
export type { ServerFetchOptions } from './server-fetch';
export { doRefresh, tokensSchema } from './session/refresh';
export type { Tokens } from './session/refresh';
export { refreshOnce } from './session/refresh-single-flight';
export { decodeJwtExp, isExpiredOrNear } from './session/jwt';
export {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  readTokens,
  setTokens,
  clearTokens,
  setTokensOnResponse,
  clearTokensOnResponse,
} from './session/cookies';
