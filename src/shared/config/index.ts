// Isomorphic config — safe in Server OR Client Components.
// NOTE: `env` is NOT re-exported here: it contains server-only vars and would be
// pulled into the client bundle by any client component importing `RoutesPath`.
// Import it server-side from `shared/config/env` instead.
export { RoutesPath } from './routes-path';
