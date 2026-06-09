[![FeatureSliced](https://img.shields.io/badge/Powered%20by-%F0%9F%8D%B0%20Feature%20Sliced-%235c9cb5)](https://feature-sliced.design/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

# Next.js 15 + FSD Starter

Lean, opinionated starter on **Next.js 16 (App Router)**, **React 19**,
**TypeScript**, **Feature-Sliced Design** and **Tailwind v4** — RSC-first, with
React Query, Zod, typed env, Vitest + Playwright, and Lefthook git hooks.

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

## Requirements

- Node.js **22** (`nvm use` reads [`.nvmrc`](./.nvmrc)).
- `pnpm` (`npm i -g pnpm`); the repo pins `packageManager`.

## Getting started

```bash
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL
pnpm dev                         # http://localhost:3000
```

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

## Structure (FSD on App Router)

```
app/        # Next App Router — thin routing shell (re-exports views)
src/
├── app/        # FSD app layer: providers (QueryClient, Toaster)
├── views/      # FSD "pages" — route screens
├── widgets/    # composite UI blocks (scaffold)
├── features/   # user-facing features (scaffold)
├── entities/   # business entities (scaffold)
└── shared/     # api (fetch/query client), config (env, routes), ui
```

Import rule: a layer imports only from layers **below** it (enforced by
`eslint-plugin-boundaries`); slices expose a public API via `index.ts`. See
[`.claude/skills/fsd-with-nextjs`](./.claude/skills/fsd-with-nextjs/SKILL.md).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) (commitlint); an
optional scope must name an FSD layer/area.

## License

[MIT](./LICENSE)
