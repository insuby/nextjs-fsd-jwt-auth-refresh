'use server';

import { type Cart } from 'entities/cart';
import { addToCart } from 'entities/cart/server';

import { ApiError, SessionExpiredError } from 'shared/api';
import { clearTokens } from 'shared/api/server';

export type AddToCartResult =
  | { ok: true; cart: Cart }
  | { ok: false; reason: 'session-expired' | 'error'; message: string };

export async function addToCartAction(input: {
  userId: number;
  productId: number;
}): Promise<AddToCartResult> {
  try {
    const cart = await addToCart({
      userId: input.userId,
      products: [{ id: input.productId, quantity: 1 }],
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
