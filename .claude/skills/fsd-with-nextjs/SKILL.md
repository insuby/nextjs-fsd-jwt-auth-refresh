---
name: fsd-with-nextjs
description: >-
  How this repo combines Feature-Sliced Design with the Next.js 15 App Router —
  the pages→views rename, root app/ as a thin routing shell, providers in the FSD
  app layer, and Server vs Client Components. Use when adding routes/views or
  reasoning about the app/ vs src structure.
---

# FSD + Next.js 15 (App Router) — as implemented here

Next's file-system router collides with FSD's `app`/`pages` layers. This repo
resolves it with the **rename approach**:

- FSD's **`pages` layer is renamed `views`** and lives in `src/views`.
- **Next's `app/` is at the project ROOT** and is a **thin routing shell**.

> There is also an official "import approach" (keep `src/pages`, add an empty root
> `pages/` placeholder). We deliberately do NOT use it — we renamed instead, so
> there is **no root `pages/` folder**.

## Structure

```
app/                         # Next App Router — ROUTING ONLY
├── layout.tsx               # <html>; renders <Providers> from the FSD app layer
├── globals.css              # Tailwind v4 entry (@import 'tailwindcss')
├── page.tsx                 # redirect(RoutesPath.MAIN)
└── main/page.tsx            # export { MainView as default, metadata } from '@/views/main'
src/
├── app/                     # FSD app layer
│   ├── providers/           # QueryClientProvider + ToastContainer ('use client')
│   │   ├── index.tsx
│   │   └── (query client lives in shared/api/query-client.ts)
│   └── index.ts             # export { Providers }
├── views/                   # FSD "pages" layer (renamed)
├── widgets/ · features/ · entities/ · shared/
```

## Rules

- A root `app/.../page.tsx` is **only** the re-export of a view — no logic.
  Forward `metadata` only if the view exports it.
- FSD app-layer concerns (providers, global styles) live in `src/app` and
  `app/layout.tsx`. Keep the two `app/` dirs distinct: root `app/` = routing,
  `src/app` = FSD layer.
- Import direction: `views → widgets → features → entities → shared`. The root
  `app/` is above `views` (it may import views; views must not import the shell).
- `getQueryClient` lives in **`shared/api`** (not the app layer) so both the
  provider (app) and views can import it downward without breaking layering.

## Server vs Client Components

- Server Components by default. `'use client'` only on interactive leaves
  (`Providers`, `ToastContainer`, `useSuspenseQuery`/zustand/`usehooks-ts`
  consumers).
- Server reads → `fetch`/`apiFetch`; mutations → Server Actions; client sync →
  React Query behind `HydrationBoundary` (see `frontend-conventions`).

## Next 15 specifics

- `params`/`searchParams` are async — `await` in the route, pass plain props to
  the view.
- React Compiler is on via `experimental.reactCompiler` (Next 15; top-level
  `reactCompiler` is Next 16 only).
