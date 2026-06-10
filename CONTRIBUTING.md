# Contributing

This project follows **Feature-Sliced Design** on **Next.js 16** with a small set
of automated quality gates.

## Setup

```bash
nvm use            # Node 22 from .nvmrc
pnpm install
cp .env.example .env.local
pnpm dev
```

## Quality gates

```bash
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint . (Next rules + FSD boundaries)
pnpm test          # vitest
pnpm build
```

Git hooks via **Lefthook** (`lefthook.yml`):

- **pre-commit** → eslint `--fix` + prettier `--write` on staged files.
- **commit-msg** → commitlint (Conventional Commits).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/). Types: `feat`,
`fix`, `docs`, `style`, `refactor`, `test`, `chore`, `revert`, `build`, `ci`,
`perf`. Optional scope must be an FSD layer/area: `app`, `views`, `widgets`,
`features`, `entities`, `shared`, `config`, `deps`, `release`.

```
feat(features): add login form
fix(shared): reject api error instead of resolving undefined
```

## Architecture rules (FSD)

- Layers, top → bottom: `app → views → widgets → features → entities → shared`.
  Import only from **lower** layers; no cross-imports between slices of the same
  layer. Enforced by `eslint-plugin-boundaries`.
- Each slice exposes its public API via `index.ts`; import from the barrel.
- **Locality:** code used by one view stays in `views/<view>/`; promote only on
  real reuse.
- Next routing lives in the root `app/` (thin re-exports); FSD layers live in
  `src/`. See [`CLAUDE.md`](./CLAUDE.md) and `.claude/skills/`.
