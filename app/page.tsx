import { redirect } from 'next/navigation';

import { RoutesPath } from '@/shared/config';

// The `proxy.ts` refresh-gate redirects `/` to `/dashboard` or `/login` based on
// session cookies before this renders. This is a defensive fallback for any path
// that bypasses the proxy.
export default function RootPage() {
  redirect(RoutesPath.LOGIN);
}
