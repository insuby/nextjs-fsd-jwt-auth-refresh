import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Non-zero staleTime so the client doesn't immediately refetch right
        // after hydration (which would waste the server prefetch).
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
      },
      dehydrate: {
        // Also dehydrate pending queries → enables prefetch-without-await
        // streaming (requires react-query >= 5.40).
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Server: a brand-new client per request (never a module-scope singleton, which
 * would leak cache across users). Browser: a reused singleton across renders.
 *
 * No `'use client'` — imported by both Server Components (prefetch/dehydrate)
 * and the client `Providers`.
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
