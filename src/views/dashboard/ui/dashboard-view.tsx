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
    user = await getMe();
    [carts] = await Promise.all([
      getUserCarts(user.id),
      // Prefetch the first products page into the same key the client island uses,
      // so its useInfiniteQuery hydrates and "Load more" continues seamlessly.
      queryClient.prefetchInfiniteQuery({
        queryKey: productKeys.infinite(PRODUCTS_PAGE_SIZE),
        queryFn: ({ pageParam }) =>
          getProducts({ limit: PRODUCTS_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: getNextProductsPageParam,
      }),
    ]);
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

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500">@{user.username}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="mb-8 rounded-lg border border-gray-200 p-4 text-sm">
        <h2 className="font-medium">Your carts</h2>
        <p className="text-gray-500">
          {cartCount} cart{cartCount === 1 ? '' : 's'} · {itemCount} item
          {itemCount === 1 ? '' : 's'}
        </p>
      </section>

      <h2 className="mb-4 font-medium">Products</h2>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductsBoard userId={user.id} />
      </HydrationBoundary>
    </main>
  );
}
