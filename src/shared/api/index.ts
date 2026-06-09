// Isomorphic public API of shared/api — safe to import from Server OR Client
// Components. Server-only plumbing (serverFetch, cookies, refresh) lives in
// `shared/api/server` so it never gets pulled into a client bundle.
export { ApiError, apiFetch } from './api-client';
export type { ApiFetchOptions } from './api-client';
export { getQueryClient } from './query-client';
export { SessionExpiredError } from './errors';
