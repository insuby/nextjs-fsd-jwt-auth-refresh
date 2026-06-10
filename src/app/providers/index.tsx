'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';

import { getQueryClient } from 'shared/api';

export function Providers({ children }: { children: ReactNode }) {
  // Singleton logic lives in getQueryClient(): a fresh client per request on the
  // server, a reused one in the browser. Do NOT use useState(new QueryClient()).
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* react-toastify v11 injects its own CSS — no stylesheet import needed.
          Recolored to the design tokens via `--toastify-*` vars in globals.css. */}
      <ToastContainer closeOnClick theme="light" position="bottom-right" />
    </QueryClientProvider>
  );
}
