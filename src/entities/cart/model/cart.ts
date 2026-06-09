import { z } from 'zod';

export const cartProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  quantity: z.number(),
  total: z.number().optional(),
  discountedTotal: z.number().optional(),
  thumbnail: z.string().optional(),
});

export type CartProduct = z.infer<typeof cartProductSchema>;

export const cartSchema = z.object({
  id: z.number(),
  products: z.array(cartProductSchema),
  total: z.number(),
  discountedTotal: z.number().optional(),
  userId: z.number(),
  totalProducts: z.number().optional(),
  totalQuantity: z.number().optional(),
});

export type Cart = z.infer<typeof cartSchema>;

/** `/auth/carts/user/{id}` wraps the carts in a paginated envelope. */
export const cartsResponseSchema = z.object({
  carts: z.array(cartSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

/** Body for `POST /auth/carts/add`. */
export const addToCartInputSchema = z.object({
  userId: z.number(),
  products: z
    .array(z.object({ id: z.number(), quantity: z.number().int().positive() }))
    .min(1),
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;
