# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

A **Next.js 16 (App Router) starter** — React 19 + TypeScript, organized with
**Feature-Sliced Design (FSD)**, RSC-first. Deliberately lean: extra libraries are
added only when a feature needs them (see `.claude/stack.md`).

## Architecture: FSD on Next.js App Router

Next's file-system router collides with FSD's `app`/`pages` layers, so:

- **Next's `app/` lives at the project ROOT** and is a **thin routing shell** —
  route files only re-export from the FSD layers, no business logic.
- **FSD layers live in `src/`.** The FSD `pages` layer is **renamed to `views`**
  to avoid the collision.

```
app/                    # Next App Router (ROUTING ONLY)
├── layout.tsx          # imports Providers + globals.css from the FSD app layer
├── page.tsx            # redirect('/login') | '/dashboard' (by session)
├── globals.css         # Tailwind v4 entry
├── login/page.tsx      # export { LoginView as default, metadata } from '@/views/login'
└── dashboard/
    ├── page.tsx        # export { DashboardView as default, metadata } from '@/views/dashboard'
    └── error.tsx       # 'use client' error boundary for the dashboard segment
proxy.ts                # Next 16 middleware (refresh-gate + session routing), at ROOT
src/
├── app/                # FSD app layer: providers (QueryClient, Toaster)
├── views/              # FSD "pages" layer (login, dashboard), renamed
├── widgets/            # composite UI blocks (products-board)
├── features/           # user-facing features (auth, cart/add, product/load)
├── entities/           # business entities (user, product, cart)
└── shared/             # api (auth transport + refresh + query client), config, ui
```

**Layer rule:** import only from layers **below** (`views → widgets → features →
entities → shared`). Enforced by `eslint-plugin-boundaries`. The root `app/` sits
above `views`. Every slice exposes a public API via `index.ts` — no deep imports.

**Locality (important):** code used in one place stays there. A component/hook/
store used by **one view only** lives in `views/<view>/...`, never lifted to
`app`/`widgets`/`shared`. Promote only when a **second consumer** appears.

## Rendering & data (RSC-first)

- **Server Components by default.** Add `'use client'` only at the **leaf** that
  needs interactivity/hooks — never on a whole layer.
- **Server reads:** native `fetch` (Next Data Cache via `cache`/`next.revalidate`/
  `next.tags`) or `apiFetch` from `shared/api`.
- **Mutations:** Server Actions (set httpOnly cookies via `next/headers`).
- **Client state from the server:** React Query. Get the client via
  `getQueryClient()` (`shared/api`) — fresh per request on the server, a singleton
  in the browser. Prefetch in a view, wrap in `HydrationBoundary`.
- **No `import.meta.env`** — use `process.env` / the typed `env` from
  `shared/config` (only `NEXT_PUBLIC_*` reach the client).

## Conventions

- **Validation:** `zod` (top-level `z.email()`/`z.url()`).
- **Typed env:** `shared/config/env.ts` (`@t3-oss/env-nextjs` + zod). Add new vars
  there; client vars must be `NEXT_PUBLIC_`-prefixed.
- **Styling:** Tailwind v4, CSS-first. Single `@import 'tailwindcss';` in
  `app/globals.css`; tokens via `@theme`. No `tailwind.config.js`.
- **Toasts:** `react-toastify` v11 — `<ToastContainer/>` mounted once in Providers;
  it injects its own CSS (do NOT import a stylesheet). Show errors with
  `toast.error(...)` (e.g. in a React Query `onError`).
- **Routes:** `RoutesPath` (`shared/config`) — `href` for `next/link`,
  `redirect()`, `router.push()`.
- **Files:** `.tsx` only with JSX. **TS strict.**
- **Extra libraries are NOT pre-installed** — add state (`zustand`), forms
  (`react-hook-form`), dates (`date-fns`), etc. when needed; document in
  `.claude/stack.md`.

## Commands

```bash
pnpm dev          # next dev (Turbopack)  → http://localhost:3000
pnpm build        # next build (Turbopack, default in Next 16)
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint . (next + FSD boundaries)
pnpm format       # prettier --write .
pnpm test         # vitest run (unit/component)
pnpm test:e2e     # playwright test (run `pnpm exec playwright install` first)
```

Git hooks via **Lefthook** (`lefthook.yml`): pre-commit runs eslint+prettier on
staged files; commit-msg runs commitlint. Commits follow **Conventional Commits**;
optional scope must be an FSD layer/area (see `commitlint.config.js`).

## Skills

Project skills in `.claude/skills/` (auto-discovered; invoke with `/<name>`):
`fsd-architecture`, `scaffold-fsd-slice`, `fsd-review`, `frontend-conventions`,
`fsd-with-nextjs`.

## Pitfalls

- Never create a module-scope `QueryClient` (or a server-shared store) — use
  `getQueryClient()` per request.
- RSC must not import client-only code (`react-toastify`, a zustand store, hook
  libraries). Mark `'use client'` on the consumer.
- Route `params`/`searchParams` are async in Next 15 — `await` them in the route,
  pass plain props into the view.
- React Compiler runs via Babel (top-level `reactCompiler` in `next.config.ts`) —
  slightly slower builds, by design.
- Middleware in Next 16 is the file `proxy.ts` (Node runtime), exporting
  `proxy(request)` — not `middleware.ts`.
