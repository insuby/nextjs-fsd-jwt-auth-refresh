[![FeatureSliced](https://img.shields.io/badge/Powered%20by-%F0%9F%8D%B0%20Feature%20Sliced-%235c9cb5)](https://feature-sliced.design/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

# Next.js 16 + FSD Starter

Lean, opinionated starter on **Next.js 16 (App Router)**, **React 19**,
**TypeScript**, **Feature-Sliced Design** and **Tailwind v4** — RSC-first, with
React Query, Zod, typed env, Vitest + Playwright, and Lefthook git hooks.

It ships a working **auth demo** against the public [DummyJSON](https://dummyjson.com)
API: log in, view a paginated products dashboard, and add items to a cart.

## Stack

| Area          | Choice                                                               |
| ------------- | -------------------------------------------------------------------- |
| Framework     | `next` 16 (App Router, React Compiler)                               |
| UI / Language | `react` 19 · `typescript` (strict)                                   |
| Architecture  | [`feature-sliced`](https://feature-sliced.design/) (`pages`→`views`) |
| Data          | RSC `fetch` + Server Actions + `@tanstack/react-query`               |
| Validation    | `zod` · typed env via `@t3-oss/env-nextjs`                           |
| Styling       | `tailwindcss` v4 (CSS-first)                                         |
| Lint / Format | ESLint flat (`eslint-config-next` + FSD boundaries) · Prettier       |
| Git hooks     | `lefthook` + `commitlint`                                            |
| Tests         | `vitest` + Testing Library · `@playwright/test`                      |

> The starter is intentionally lean — add `zustand`, `react-hook-form`,
> `date-fns`, etc. per feature. Conventions: [`CLAUDE.md`](./CLAUDE.md) and
> [`.claude/stack.md`](./.claude/stack.md).

## What's implemented

A small but complete authentication flow on top of the FSD scaffold:

- **Login / logout** via Server Actions; JWT **access + refresh** tokens are kept
  in **httpOnly cookies** and never reach the client bundle.
- **Refresh-gate proxy** (`proxy.ts`, Next 16 middleware) proactively refreshes a
  near-expiry access token before the RSC render and routes by session presence.
- **Single-flight refresh** (request-scoped via React `cache`) so parallel 401s
  share one refresh.
- **Dashboard** (`/dashboard`) — SSR + React Query hydration: user header, cart
  summary, paginated products with "Load more" and add-to-cart.

**Demo credentials** (DummyJSON's public account, pre-filled on the login form):
`emilys` / `emilyspass`.

## Requirements

- Node.js **22** (`nvm use` reads [`.nvmrc`](./.nvmrc)).
- `pnpm` (`npm i -g pnpm`); the repo pins `packageManager`.

## Getting started

```bash
pnpm install
cp .env.example .env.local      # defaults work out of the box (DummyJSON)
pnpm dev                         # http://localhost:3000 → log in with emilys / emilyspass
```

## Environment

All vars are validated by `shared/config/env.ts` ([`@t3-oss/env-nextjs`](https://env.t3.gg/) + zod);
only `NEXT_PUBLIC_`-prefixed ones reach the browser. See [`.env.example`](./.env.example).

| Var                        | Scope  | Default                   | Purpose                                                            |
| -------------------------- | ------ | ------------------------- | ------------------------------------------------------------------ |
| `API_BASE_URL`             | server | `https://dummyjson.com`   | Upstream API; proxied through the Next server, never the browser.  |
| `ACCESS_TOKEN_TTL_MINUTES` | server | `30`                      | Access-token lifetime requested at login/refresh (lower to demo).  |
| `REFRESH_SKEW_SECONDS`     | server | `30`                      | Refresh proactively when the access token has < this many seconds. |
| `COOKIE_SECURE`            | server | `NODE_ENV==='production'` | Force the Secure cookie flag; set `false` on plain-HTTP hosts.     |
| `NEXT_PUBLIC_API_URL`      | client | `http://localhost:3000`   | The app's own origin (default base for the public `apiFetch`).     |

## Scripts

| Command          | What it does                                         |
| ---------------- | ---------------------------------------------------- |
| `pnpm dev`       | Dev server (Turbopack) at localhost:3000             |
| `pnpm build`     | Production build                                     |
| `pnpm start`     | Serve the production build                           |
| `pnpm typecheck` | `tsc --noEmit`                                       |
| `pnpm lint`      | ESLint (Next rules + FSD boundaries)                 |
| `pnpm format`    | Prettier write                                       |
| `pnpm test`      | Vitest (unit/component)                              |
| `pnpm test:e2e`  | Playwright (run `pnpm exec playwright install` once) |

> The Playwright happy-path spec drives the real DummyJSON API, so it needs
> network access (it will fail offline or if the upstream rate-limits).

## Structure (FSD on App Router)

```
app/        # Next App Router — thin routing shell (login, dashboard, proxy.ts)
src/
├── app/        # FSD app layer: providers (QueryClient, Toaster)
├── views/      # FSD "pages" — login + dashboard screens
├── widgets/    # composite UI blocks — products board
├── features/   # auth (login/logout), cart/add, product/load
├── entities/   # user, product, cart resource modules
└── shared/     # api (auth transport, refresh, query client), config, ui
```

Import rule: a layer imports only from layers **below** it (enforced by
`eslint-plugin-boundaries`); slices expose a public API via `index.ts`. See
[`.claude/skills/fsd-with-nextjs`](./.claude/skills/fsd-with-nextjs/SKILL.md).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) (commitlint); an
optional scope must name an FSD layer/area.

## License

[MIT](./LICENSE)
