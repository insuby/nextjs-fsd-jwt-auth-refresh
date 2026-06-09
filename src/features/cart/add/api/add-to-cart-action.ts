'use server';

import { z } from 'zod';

import { type Cart } from 'entities/cart';
import { addToCart } from 'entities/cart/server';
import { getMe } from 'entities/user/server';

import { ApiError, SessionExpiredError } from 'shared/api';
import { clearTokens } from 'shared/api/server';

export type AddToCartResult =
  | { ok: true; cart: Cart }
  | { ok: false; reason: 'session-expired' | 'error'; message: string };

// Server Action = trust boundary: validate the client-supplied product id.
const inputSchema = z.object({ productId: z.number().int().positive() });

export async function addToCartAction(input: {
  productId: number;
}): Promise<AddToCartResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: 'error', message: 'Invalid product.' };
  }

  try {
    // Identity comes from the session, never the client — otherwise a caller could
    // pass any userId and add to someone else's cart.
    const { id: userId } = await getMe();
    const cart = await addToCart({
      userId,
      products: [{ id: parsed.data.productId, quantity: 1 }],
    });
    return { ok: true, cart };
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      // Drop the dead cookies now (Server Actions can write cookies) so the
      // client redirect to /login doesn't bounce through the proxy.
      await clearTokens();
      return {
        ok: false,
        reason: 'session-expired',
        message: 'Your session expired. Please sign in again.',
      };
    }
    const message =
      error instanceof ApiError
        ? `Add to cart failed (${error.status}).`
        : 'Add to cart failed. Please try again.';
    return { ok: false, reason: 'error', message };
  }
}
