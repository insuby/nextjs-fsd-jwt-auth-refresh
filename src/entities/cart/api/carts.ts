import { serverFetch } from 'shared/api/server';

import {
  type AddToCartInput,
  addToCartInputSchema,
  type Cart,
  cartSchema,
  cartsResponseSchema,
} from '../model/cart';

/** A user's carts — `GET /auth/carts/user/{id}`. Server-only (authenticated). */
export async function getUserCarts(userId: number): Promise<Cart[]> {
  const data = await serverFetch<unknown>(`/auth/carts/user/${userId}`);
  return cartsResponseSchema.parse(data).carts;
}

/** Add products to a cart — `POST /auth/carts/add`. Server-only (authenticated). */
export async function addToCart(input: AddToCartInput): Promise<Cart> {
  const validated = addToCartInputSchema.parse(input);
  const data = await serverFetch<unknown>('/auth/carts/add', {
    method: 'POST',
    json: validated,
  });
  return cartSchema.parse(data);
}
