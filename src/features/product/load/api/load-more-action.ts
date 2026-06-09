'use server';

import { type ProductsPage } from 'entities/product';
import { getProducts } from 'entities/product/server';

import { SessionExpiredError } from 'shared/api';
import { clearTokens } from 'shared/api/server';

export type LoadProductsResult =
  | { ok: true; page: ProductsPage }
  | { ok: false; reason: 'session-expired' | 'error'; message: string };

export async function loadProductsAction(params: {
  limit: number;
  skip: number;
}): Promise<LoadProductsResult> {
  try {
    const page = await getProducts(params);
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
