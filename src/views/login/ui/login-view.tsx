import type { Metadata } from 'next';

import { LoginForm } from 'features/auth/login';

export const metadata: Metadata = {
  title: 'Sign in',
};

function Wordmark({ tone = 'ink' }: { tone?: 'ink' | 'invert' }) {
  const mark =
    tone === 'invert'
      ? 'bg-on-brand/15 text-on-brand'
      : 'bg-brand text-on-brand';
  const text = tone === 'invert' ? 'text-on-brand' : 'text-ink';
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid size-7 place-items-center rounded-[0.5rem] ${mark}`}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path d="M5 19 12 5l7 14z" fill="currentColor" />
        </svg>
      </span>
      <span className={`text-base font-semibold tracking-tight ${text}`}>
        Next 16 · Auth
      </span>
    </div>
  );
}

// Server Component — renders the public login screen.
export function LoginView() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1.2fr]">
      {/* Brand panel — calm slate, not a loud wall. */}
      <aside className="relative hidden overflow-hidden bg-brand-deep text-on-brand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -bottom-40 size-[34rem] text-on-brand/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          {[40, 64, 88, 100].map((r) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          ))}
        </svg>

        <Wordmark tone="invert" />

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
            Browse the catalog and keep your carts in one place.
          </h2>
          <p className="mt-4 text-[0.975rem] leading-relaxed text-on-brand/80">
            A small Next.js demo: JWT auth with silent refresh, server-rendered
            data, and an infinite product list.
          </p>
        </div>

        <p className="relative text-sm text-on-brand/70">
          Signed sessions · httpOnly cookies · single-flight refresh
        </p>
      </aside>

      {/* Form panel. */}
      <section className="flex items-center justify-center bg-bg px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-[0.975rem] text-muted">
            Use the DummyJSON demo account. The fields are pre-filled, so just
            continue.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-8 border-t border-line pt-5 text-sm text-muted">
            Demo credentials:{' '}
            <span className="font-medium text-ink">emilys</span> /{' '}
            <span className="font-medium text-ink">emilyspass</span>
          </p>
        </div>
      </section>
    </main>
  );
}
