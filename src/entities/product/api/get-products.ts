import { serverFetch } from 'shared/api/server';

import { type ProductsPage, productsPageSchema } from '../model/product';

/** A page of products — `GET /auth/products?limit=&skip=`. Server-only (authenticated). */
export async function getProducts(params: {
  limit: number;
  skip: number;
}): Promise<ProductsPage> {
  const search = new URLSearchParams({
    limit: String(params.limit),
    skip: String(params.skip),
  });
  const data = await serverFetch<unknown>(
    `/auth/products?${search.toString()}`,
  );
  return productsPageSchema.parse(data);
}
