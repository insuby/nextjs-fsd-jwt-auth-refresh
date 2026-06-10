import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Type-safe, validated environment variables. Importing `env` anywhere triggers
 * validation. Only `NEXT_PUBLIC_`-prefixed vars are exposed to the client.
 */
export const env = createEnv({
  server: {
    // Upstream API base. SERVER-ONLY (no NEXT_PUBLIC_ prefix) so the browser can
    // never learn or call it directly — all access goes through the Next server.
    API_BASE_URL: z.url().default('https://dummyjson.com'),
    // Access-token lifetime requested at login/refresh. Keep short to exercise
    // the refresh path (DummyJSON defaults to 60 if omitted).
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
    // Refresh proactively when the access token has fewer than this many seconds
    // of life left (clock-skew / in-flight margin for the proxy refresh-gate).
    REFRESH_SKEW_SECONDS: z.coerce.number().int().nonnegative().default(30),
    // Explicit override for the Secure cookie flag. Secure cookies are required
    // in production (HTTPS) but break auth on plain-HTTP deployments (a staging
    // box reached by IP) — set `COOKIE_SECURE=false` there. When unset, defaults
    // to NODE_ENV === 'production'. `z.stringbool` accepts true/false/1/0/yes/no.
    COOKIE_SECURE: z.stringbool().optional(),
  },
  client: {
    // The app's OWN origin (used by the public `apiFetch` default base). NOT the
    // upstream API — that's `API_BASE_URL` above.
    NEXT_PUBLIC_API_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    API_BASE_URL: process.env.API_BASE_URL,
    ACCESS_TOKEN_TTL_MINUTES: process.env.ACCESS_TOKEN_TTL_MINUTES,
    REFRESH_SKEW_SECONDS: process.env.REFRESH_SKEW_SECONDS,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
});
