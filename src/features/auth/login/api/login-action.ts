'use server';

import { authResponseSchema } from 'entities/user';

import { ApiError, apiFetch } from 'shared/api';
import { setTokens } from 'shared/api/server';
import { env } from 'shared/config/env';

import { type LoginInput, loginSchema } from '../model/login-schema';

export type LoginResult = { ok: true } | { ok: false; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }
    return `Login failed (${error.status}).`;
  }
  return 'Login failed. Please try again.';
}

/**
 * Authenticate against DummyJSON and persist the tokens as httpOnly cookies. The
 * login call is unauthenticated (no bearer, no refresh-retry), so it uses
 * `apiFetch` directly against `env.API_BASE_URL` rather than `serverFetch`.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Please enter a username and password.' };
  }

  try {
    const data = await apiFetch<unknown>('/auth/login', {
      method: 'POST',
      baseUrl: env.API_BASE_URL,
      json: { ...parsed.data, expiresInMins: env.ACCESS_TOKEN_TTL_MINUTES },
    });
    const auth = authResponseSchema.parse(data);
    await setTokens({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}
