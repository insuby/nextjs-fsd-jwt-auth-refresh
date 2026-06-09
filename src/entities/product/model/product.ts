import { z } from 'zod';

export const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string().optional(),
  category: z.string().optional(),
  thumbnail: z.string().optional(),
  rating: z.number().optional(),
  stock: z.number().optional(),
});

export type Product = z.infer<typeof productSchema>;

/** A page of the `/auth/products` list. */
export const productsPageSchema = z.object({
  products: z.array(productSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

export type ProductsPage = z.infer<typeof productsPageSchema>;

/** Products are loaded 5 at a time ("Load more"). */
export const PRODUCTS_PAGE_SIZE = 5;

/**
 * React Query keys — shared by the server-side prefetch (dashboard view) and the
 * client `useInfiniteQuery` (products list) so hydration lines up.
 */
export const productKeys = {
  all: ['products'] as const,
  infinite: (limit: number) => [...productKeys.all, 'infinite', limit] as const,
};

/** getNextPageParam for the products infinite query — next skip, or undefined at the end. */
export function getNextProductsPageParam(
  lastPage: ProductsPage,
): number | undefined {
  const nextSkip = lastPage.skip + lastPage.limit;
  return nextSkip < lastPage.total ? nextSkip : undefined;
}
