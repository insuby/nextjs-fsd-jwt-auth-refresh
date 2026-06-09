import { z } from 'zod';

import { env } from 'shared/config/env';

import { apiFetch } from '../api-client';

/**
 * Slim token pair — domain-agnostic plumbing that stays in `shared` so the
 * transport never imports upward from `entities`. (The richer login/refresh body,
 * incl. user fields, is modelled in `entities/user`.)
 */
export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type Tokens = z.infer<typeof tokensSchema>;

/** Exchanges a refresh token for a fresh pair. No auth header (the body carries it). */
export async function doRefresh(refreshToken: string): Promise<Tokens> {
  const data = await apiFetch<unknown>('/auth/refresh', {
    method: 'POST',
    baseUrl: env.API_BASE_URL,
    json: { refreshToken, expiresInMins: env.ACCESS_TOKEN_TTL_MINUTES },
  });
  return tokensSchema.parse(data);
}
