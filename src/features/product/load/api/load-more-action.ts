'use server';

import { z } from 'zod';

import { type ProductsPage } from 'entities/product';
import { getProducts } from 'entities/product/server';

import { SessionExpiredError } from 'shared/api';
import { clearTokens } from 'shared/api/server';

export type LoadProductsResult =
  | { ok: true; page: ProductsPage }
  | { ok: false; reason: 'session-expired' | 'error'; message: string };

// Server Action = trust boundary: validate the paging window instead of forwarding
// arbitrary client values upstream (`limit` is capped to avoid over-fetch abuse).
const paramsSchema = z.object({
  limit: z.number().int().positive().max(100),
  skip: z.number().int().nonnegative(),
});

export async function loadProductsAction(params: {
  limit: number;
  skip: number;
}): Promise<LoadProductsResult> {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { ok: false, reason: 'error', message: 'Invalid request.' };
  }

  try {
    const page = await getProducts(parsed.data);
    return { ok: true, page };
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      await clearTokens();
      return {
        ok: false,
        reason: 'session-expired',
        message: 'Your session expired. Please sign in again.',
      };
    }
    return {
      ok: false,
      reason: 'error',
      message: 'Failed to load products. Please try again.',
    };
  }
}
