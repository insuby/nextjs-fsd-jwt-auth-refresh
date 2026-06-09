import type { Metadata } from 'next';

import { LoginForm } from 'features/auth/login';

export const metadata: Metadata = {
  title: 'Sign in',
};

// Server Component — renders the public login screen.
export function LoginView() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Authenticate with the DummyJSON demo account.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
