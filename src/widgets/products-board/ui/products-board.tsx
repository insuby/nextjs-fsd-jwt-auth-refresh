'use client';

import { useRouter } from 'next/navigation';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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

/** Typed query error so the side effects (toast/redirect) can react to the error
 *  STATE instead of running inside the queryFn (which re-fires on every retry). */
class LoadProductsError extends Error {
  constructor(
    message: string,
    readonly reason: 'session-expired' | 'error',
  ) {
    super(message);
    this.name = 'LoadProductsError';
  }
}

/**
 * Products board widget — composes the `product/load` (pagination) and `cart/add`
 * features. Composing two features belongs in a widget, not a sideways
 * feature→feature import. Hydrates from the dashboard's SSR prefetch.
 */
export function ProductsBoard() {
  const router = useRouter();
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: productKeys.infinite(PRODUCTS_PAGE_SIZE),
      // Keep the queryFn PURE — just throw a typed error. Toasting/redirecting
      // here would fire once per retry attempt (the client default is retry: 1).
      queryFn: async ({ pageParam }) => {
        const result = await loadProductsAction({
          limit: PRODUCTS_PAGE_SIZE,
          skip: pageParam,
        });
        if (!result.ok) {
          throw new LoadProductsError(result.message, result.reason);
        }
        return result.page;
      },
      initialPageParam: 0,
      getNextPageParam: getNextProductsPageParam,
      // A session-expired result won't recover on retry (the action clears the
      // cookies), so don't retry it; transient errors still get one retry.
      retry: (failureCount, err) =>
        !(
          err instanceof LoadProductsError && err.reason === 'session-expired'
        ) && failureCount < 1,
    });

  // React to the settled error STATE once (keyed on the stable error object), so
  // toasts/redirects don't double-fire across retries.
  useEffect(() => {
    if (!error) return;
    const message =
      error instanceof LoadProductsError
        ? error.message
        : 'Failed to load products. Please try again.';
    toast.error(message);
    if (
      error instanceof LoadProductsError &&
      error.reason === 'session-expired'
    ) {
      router.replace(RoutesPath.LOGIN);
      router.refresh();
    }
  }, [error, router]);

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
