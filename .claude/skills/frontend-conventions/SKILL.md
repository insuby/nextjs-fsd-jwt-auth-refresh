---
name: frontend-conventions
description: >-
  This stack's conventions — RSC-first data (fetch + Server Actions + React
  Query), zod + typed env, Tailwind v4, react-toastify. Use when writing
  components, fetching data, validating, managing state, or styling in this
  Next.js 15 project.
---

# Frontend conventions (Next.js 15 + FSD)

The starter is lean — extra libraries are added per feature (`.claude/stack.md`).

## Components & boundaries

- **Server Components by default.** Add `'use client'` only on the **leaf** that
  needs hooks/interactivity. Never mark a whole layer/slice.
- RSC must not import client-only code (`react-toastify`, a zustand store, hook
  libraries).

## Data fetching (RSC-first)

- **Server reads:** native `fetch` (Next caching: `cache`,
  `next: { revalidate, tags }`) or `apiFetch` from `shared/api`, in Server
  Components.
- **Mutations:** Server Actions (`'use server'`).
- **Client state from server data:** React Query. Get the client via
  `getQueryClient()` (`shared/api`); `queryFn` calls `fetch`/`apiFetch`. Prefetch
  in a view, wrap client islands in `HydrationBoundary`. Never module-scope a
  `QueryClient`.

## Validation & env

- **`zod`** schemas (top-level `z.email()` / `z.url()`).
- Typed env via `shared/config/env.ts` (`@t3-oss/env-nextjs`). Add new vars there;
  client vars must be `NEXT_PUBLIC_`-prefixed. Never read `import.meta.env`.

## Styling — Tailwind v4

- CSS-first. Single `@import 'tailwindcss';` in `app/globals.css`. Tokens via
  `@theme` — add there, not a JS config.

## Notifications — react-toastify v11

- `toast.*`; `<ToastContainer/>` is mounted once in Providers and injects its own
  CSS — **don't** import a stylesheet.

## Routing — Next App Router

- Route tree = files in root `app/` (thin re-exports of `views`). Path constants
  in `shared/config` (`RoutesPath`).

## When you add a library

None of these are pre-installed — add and document in `.claude/stack.md`:

- **State** → `zustand` (store in a slice's `model`).
- **Forms** → `react-hook-form` + `@hookform/resolvers`; `zodResolver` on the
  client, re-validate the same zod schema in the Server Action.
- **Dates** → `date-fns`. **Hooks** → `usehooks-ts`. **Dynamic CSS** → `@emotion/css`.
