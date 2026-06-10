'use client';

import { useRouter } from 'next/navigation';

import { useTransition } from 'react';

import { Button } from '@/shared/ui';

// Error boundary for the dashboard route. Session-expiry is handled by a redirect
// in the view; this catches everything else (upstream 5xx, parse errors) and
// shows a friendly retry instead of Next's blank crash screen.
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // `reset()` alone only clears the boundary's error state and re-renders the
  // SAME (already-errored) RSC payload, so a server-side failure immediately
  // re-throws. Refresh the route first to actually re-run the server render.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
      <p className="text-sm text-muted">
        We couldn’t load your dashboard. Please try again.
      </p>
      <Button onClick={retry} isLoading={isPending}>
        Retry
      </Button>
    </main>
  );
}
