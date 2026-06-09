# Preferred stack & packages

What's installed and what to reach for. Maintained alongside
[`../CLAUDE.md`](../CLAUDE.md). The starter is **lean** — only add a library when a
feature needs it, then document it here.

## Installed — use these

### Framework & rendering

- **`next` 16 (App Router)** — RSC-first. Root `app/` is a thin routing shell; FSD
  layers in `src/` (the `pages` layer is renamed **`views`**). React Compiler on
  (top-level `reactCompiler`). Turbopack is the default bundler for `dev` and
  `build`. Middleware is named **`proxy.ts`** (Node runtime).

### Data

- **Server reads → native `fetch`** (Next Data Cache: `cache`, `next.revalidate`,
  `next.tags`) or `apiFetch` from `shared/api`.
- **Mutations → Server Actions** (httpOnly cookies via `next/headers`).
- **`@tanstack/react-query` v5** — client state from the server. Use
  `getQueryClient()` (`shared/api`); prefetch in a view + `HydrationBoundary`.

### Validation & env

- **`zod` 4** — schemas (top-level `z.email()` / `z.url()`).
- **`@t3-oss/env-nextjs`** — typed env in `shared/config/env.ts`. Client vars must
  be `NEXT_PUBLIC_`-prefixed.

### Styling & UX

- **`tailwindcss` v4** — CSS-first. Single `@import 'tailwindcss';` in
  `app/globals.css`; tokens via `@theme`. No `tailwind.config.js`, no autoprefixer.
- **`react-toastify` v11** — toasts; container mounted once in Providers (no CSS
  import).

### Tooling

- **ESLint 9 flat** + `eslint-config-next` + **`eslint-plugin-boundaries`** (FSD
  layer enforcement) + **Prettier**.
- **Lefthook** — git hooks (pre-commit lint/format, commit-msg commitlint).
- **Vitest** + Testing Library (unit/component) · **Playwright** (e2e).

## Add when you need it (NOT pre-installed)

- **Client/UI state** → `zustand` (stores in a slice's `model`).
- **Forms** → **`react-hook-form` + `@hookform/resolvers`** _(installed)_
  (`zodResolver`; re-validate the same zod schema in the Server Action).
- **Dates** → `date-fns`. **Generic hooks** → `usehooks-ts`. **Dynamic CSS**
  Tailwind can't express → `@emotion/css` (client only).

When you add one: confirm nothing installed already covers it, put it in the right
`package.json` group, and document the choice here.
