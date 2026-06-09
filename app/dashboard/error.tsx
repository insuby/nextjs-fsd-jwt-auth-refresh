'use client';

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
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-500">
        We couldn’t load your dashboard. Please try again.
      </p>
      <Button onClick={reset}>Retry</Button>
    </main>
  );
}
