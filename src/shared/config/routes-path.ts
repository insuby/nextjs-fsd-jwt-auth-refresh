/**
 * Application route paths.
 *
 * `as const` object — safe under `isolatedModules`, fully tree-shakeable. Use as
 * the `href` for `next/link`, and in `redirect()` / `router.push()`.
 */
export const RoutesPath = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const;
