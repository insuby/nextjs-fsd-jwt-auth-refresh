# Preferred stack & packages

What's installed and what to reach for. Maintained alongside
[`../CLAUDE.md`](../CLAUDE.md). The starter is **lean** — only add a library when a
feature needs it, then document it here (RULES §17).

Exact versions live in `package.json`; this file records **what to use and why**.

## Installed — use these

### Framework & rendering

- **`next` 16 (App Router)** — RSC-first. Root `app/` is a thin routing shell; FSD
  layers in `src/` (the `pages` layer is renamed **`views`**). React Compiler on
  (top-level `reactCompiler`). Turbopack is the default bundler for `dev` and
  `build`. Middleware is the root file **`proxy.ts`** (Node runtime).
  `output: 'standalone'` — self-contained server output for offline deploys.
- **`react` 19** — Server Components by default; `'use client'` on the leaf only.

### Data

- **Server reads → `serverFetch`** from `shared/api/server` (bearer from the
  cookie, one single-flight refresh + retry on 401), called in
  `entities/<x>/server.ts`.
- **Mutations → Server Actions** in `features/<x>/api` (they may write cookies).
- **`@tanstack/react-query` v5** — client data. `getQueryClient()` from
  `shared/api`; prefetch in a view + `HydrationBoundary`. Never a module-scope
  client.

### Validation & env

- **`zod` 4** — schemas (top-level `z.email()` / `z.url()`); wire types are
  inferred from them, never hand-written twice.
- **`@t3-oss/env-nextjs`** — typed env in `shared/config/env.ts`. Client vars must
  be `NEXT_PUBLIC_`-prefixed.

### Forms

- **`react-hook-form`** + **`@hookform/resolvers`** (`zodResolver`); the same zod
  schema is re-validated inside the Server Action.

### Styling & UX

- **`tailwindcss` v4** — CSS-first. Single `@import 'tailwindcss';` in
  `app/globals.css`; tokens via `@theme` (see `docs/DESIGN.md`). No
  `tailwind.config.js`, no autoprefixer.
- **`react-toastify` v11** — toasts; container mounted once in Providers (no CSS
  import).
- Fonts: **self-hosted only** — `next/font/local`, never `next/font/google`
  (RULES §12).

### Tooling

- **ESLint 9 flat** (10 is blocked by `eslint-plugin-react` — see
  `docs/DECISIONS.md`) + `eslint-config-next` + **`eslint-plugin-boundaries` v7**
  (FSD layer enforcement) + **Prettier 3** with
  `@trivago/prettier-plugin-sort-imports`.
- **TypeScript 5.x, strict.** Deliberately not on the 7.x native compiler yet —
  see `docs/DECISIONS.md`.
- **Vitest 5** + Testing Library (unit/component) · **Playwright** (e2e).
- **Lefthook** — git hooks (pre-commit lint/format, commit-msg commitlint 21).
- **Node** — 22 minimum, **24 LTS recommended** (`.nvmrc`), no upper bound pinned.

### Agent setup

- `.claude/hooks/check-rules.sh` + `.claude/settings.json` — session baseline,
  `docs/` listing with new-file flags, and a blocking self-check on `Stop`.
  Requires **`jq`**; without it the hook disables itself.
- `.claude/skills/*` — FSD skills.

## Add when you need it (NOT pre-installed)

- **Client/UI state** → `zustand` (stores in a slice's `model`).
- **Dates** → `date-fns`. **Generic hooks** → `usehooks-ts`.
- **Tables** → `@tanstack/react-table`; anything that can exceed ~100 rows also
  needs virtualisation (`@tanstack/react-virtual`).
- **Dynamic CSS** Tailwind can't express → `@emotion/css` (client only).

When you add one: confirm nothing installed already covers it, check it has no
runtime CDN dependency (RULES §12), put it in the right `package.json` group, and
document the choice here.
