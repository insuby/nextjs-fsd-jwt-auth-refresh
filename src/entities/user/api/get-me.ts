import { serverFetch } from 'shared/api/server';

import { type User, userSchema } from '../model/user';

/** Current user — `GET /auth/me`. Server-only (authenticated). */
export async function getMe(): Promise<User> {
  const data = await serverFetch<unknown>('/auth/me');
  return userSchema.parse(data);
}
