import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { ProductsBoard } from 'widgets/products-board';

import { LogoutButton } from 'features/auth/logout';

import { getUserCarts } from 'entities/cart/server';
import {
  getNextProductsPageParam,
  productKeys,
  PRODUCTS_PAGE_SIZE,
} from 'entities/product';
import { getProducts } from 'entities/product/server';
import { getMe } from 'entities/user/server';

import { getQueryClient, SessionExpiredError } from 'shared/api';
import { RoutesPath } from 'shared/config';

export const metadata: Metadata = {
  title: 'Dashboard',
};

// Server Component — all initial data is loaded here (SSR). `proxy.ts` guarantees
// a valid access token before this renders.
export async function DashboardView() {
  const queryClient = getQueryClient();

  let user;
  let carts;
  try {
    // Products don't depend on the user — kick the prefetch off first so it
    // overlaps the getMe → getUserCarts chain instead of waiting behind it.
    // Prefetches into the same key the client island uses, so its
    // useInfiniteQuery hydrates and "Load more" continues seamlessly.
    const productsPrefetch = queryClient.prefetchInfiniteQuery({
      queryKey: productKeys.infinite(PRODUCTS_PAGE_SIZE),
      queryFn: ({ pageParam }) =>
        getProducts({ limit: PRODUCTS_PAGE_SIZE, skip: pageParam }),
      initialPageParam: 0,
      getNextPageParam: getNextProductsPageParam,
    });
    user = await getMe();
    [carts] = await Promise.all([getUserCarts(user.id), productsPrefetch]);
  } catch (error) {
    // Unrecoverable session (refresh failed) → log out.
    if (error instanceof SessionExpiredError) redirect(RoutesPath.LOGIN);
    throw error;
  }

  const cartCount = carts.length;
  const itemCount = carts.reduce(
    (sum, cart) => sum + (cart.totalQuantity ?? cart.products.length),
    0,
  );
  const initials = `${user.firstName.at(0) ?? ''}${user.lastName.at(0) ?? ''}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-[0.5rem] bg-brand text-on-brand">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path d="M5 19 12 5l7 14z" fill="currentColor" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight text-ink">
              Next 16 · Auth
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid size-9 place-items-center rounded-pill bg-brand-weak text-sm font-semibold text-brand-text uppercase">
                {initials}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted">@{user.username}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="ip-rise flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, {user.firstName}.
            </h1>
            <p className="mt-1 text-[0.975rem] text-muted">
              Here’s what’s in your catalog today.
            </p>
          </div>
          <dl className="flex items-stretch divide-x divide-line rounded-card border border-line bg-surface">
            <div className="px-5 py-3">
              <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                Carts
              </dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
                {cartCount}
              </dd>
            </div>
            <div className="px-5 py-3">
              <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                Items
              </dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
                {itemCount}
              </dd>
            </div>
          </dl>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Products</h2>
          </div>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ProductsBoard />
          </HydrationBoundary>
        </section>
      </main>
    </div>
  );
}
