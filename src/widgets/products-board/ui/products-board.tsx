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

  if (products.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">No products to show yet</p>
        <p className="mt-1 text-sm text-muted">
          They’ll appear here as soon as the catalog loads.
        </p>
      </div>
    );
  }

  return (
    <section>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="group flex flex-col rounded-card border border-line bg-surface p-5 transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="leading-snug font-medium text-ink">
                {product.title}
              </h3>
              {product.rating != null && (
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  ★ {product.rating.toFixed(1)}
                </span>
              )}
            </div>

            {product.category && (
              <span className="mt-2 inline-flex w-fit rounded-pill border border-line bg-bg px-2.5 py-0.5 text-xs font-medium text-muted capitalize">
                {product.category}
              </span>
            )}

            <span className="mt-4 text-xl font-semibold text-ink tabular-nums">
              ${product.price.toFixed(2)}
            </span>

            <div className="mt-auto pt-5">
              <AddToCartButton productId={product.id} />
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="secondary"
            isLoading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more products'}
          </Button>
        </div>
      )}
    </section>
  );
}
