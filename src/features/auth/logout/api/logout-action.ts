'use server';

import { clearTokens } from 'shared/api/server';

/** Clear the session cookies. The client island handles the redirect afterwards. */
export async function logoutAction(): Promise<void> {
  await clearTokens();
}
