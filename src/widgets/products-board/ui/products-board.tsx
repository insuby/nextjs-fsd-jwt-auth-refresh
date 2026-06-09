'use client';

import { useRouter } from 'next/navigation';

import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { AddToCartButton } from 'features/cart/add';
import { loadProductsAction } from 'features/product/load';

import {
  getNextProductsPageParam,
  productKeys,
  PRODUCTS_PAGE_SIZE,
} from 'entities/product';

import { RoutesPath } from 'shared/config';
import { Button } from 'shared/ui';

/**
 * Products board widget — composes the `product/load` (pagination) and `cart/add`
 * features. Composing two features belongs in a widget, not a sideways
 * feature→feature import. Hydrates from the dashboard's SSR prefetch.
 */
export function ProductsBoard() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: productKeys.infinite(PRODUCTS_PAGE_SIZE),
      queryFn: async ({ pageParam }) => {
        const result = await loadProductsAction({
          limit: PRODUCTS_PAGE_SIZE,
          skip: pageParam,
        });
        if (!result.ok) {
          toast.error(result.message);
          if (result.reason === 'session-expired') {
            router.replace(RoutesPath.LOGIN);
            router.refresh();
          }
          throw new Error(result.message);
        }
        return result.page;
      },
      initialPageParam: 0,
      getNextPageParam: getNextProductsPageParam,
    });

  const products = data?.pages.flatMap((page) => page.products) ?? [];

  return (
    <section>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
          >
            <span className="font-medium">{product.title}</span>
            <span className="text-sm text-gray-500">
              ${product.price.toFixed(2)}
            </span>
            <div className="mt-auto pt-3">
              <AddToCartButton productId={product.id} />
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            isLoading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </section>
  );
}
