# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## Project rules (loaded into every session)

@AGENTS.md
@docs/RULES.md
@docs/ARCHITECTURE.md

## What this is

A **Next.js 16 (App Router) starter** — React 19 + TypeScript strict, organised
with **Feature-Sliced Design**, RSC-first, with a working JWT auth flow (access +
refresh in httpOnly cookies, refresh-gate in `proxy.ts`). Deliberately lean:
libraries are added when a feature needs them, and recorded in `.claude/stack.md`.

Structure, layers and data flow: `docs/ARCHITECTURE.md`. Constraints:
`docs/RULES.md`.

## Starting a task

If the session is new, resumed, or the context was compacted — before the first
code edit:

1. Run `ls docs/` — `docs/` is the source of project rules. The `SessionStart`
   hook prints its contents and marks files that were not there at the previous
   check. Any new `docs/*.md` is read in full: it may carry rules that are not in
   this file.
2. Read `docs/SYSTEM_OVERVIEW.md` — the domain end to end. Then
   `docs/DECISIONS.md` — what was decided and why, so settled questions are not
   reopened.
3. Before building a screen, open `docs/DESIGN.md` — tokens, status chips and the
   "artboard → screen" table. Mockups live in `docs/design/`; a screen is built
   from its artboard, not from memory.
4. Data for mockups, seeds and tests comes from `docs/DEMO_DATA.md` — one
   fictional world, invent no other.
5. Find the closest existing analogue in `src/` (view, entity, feature, form,
   table, modal) and follow its structure, naming and markup. New patterns are not
   invented — existing ones are reused.
6. Before creating a component, hook or helper, check whether one exists:
   `src/shared/ui`, `src/shared/lib`, `src/entities/<x>/ui`, `src/features`.

Other documents, as needed:

- `docs/design-prompt.md` — the original brief for Claude Design; doubles as the
  description of expected screen behaviour.
- `.claude/stack.md` — what is installed and what to reach for.
- `.claude/skills/*` — FSD skills (`/fsd-architecture`, `/scaffold-fsd-slice`,
  `/fsd-review`, `/frontend-conventions`, `/fsd-with-nextjs`).
- `docs/_templates/` — skeletons to promote into `docs/` when this starter becomes
  a product (`SYSTEM_OVERVIEW`, `DEMO_DATA`, `design-prompt`, `LOAD`, `THREATS`).

## Session refresh

- After `/compact` or a resume, the `@`-included rules reload — the task state
  does not. Rebuild it from `git status` and `git diff`, not from memory: what is
  already changed and what is not.
- The `SessionStart` hook records a baseline of changed files on `startup`/`clear`
  and prints `docs/`; on `resume`/`compact` it only prints `docs/` — the baseline
  is kept so the `Stop` hook still reviews everything changed during the task.
- Do not assume you remember a file's contents: open it before editing.

## Finishing a task

Before the final answer — self-check: re-read `docs/RULES.md` and compare every
changed file against it; confirm project patterns were used rather than invented
ones, and that existing components and utilities were reused; `pnpm typecheck`,
`pnpm lint` and `pnpm test` green. No placeholder comments, no `TODO` without a
task behind it. The `Stop`/`SubagentStop` hook
(`.claude/hooks/check-rules.sh`) enforces this automatically and runs eslint on
the changed files plus a typecheck — its checklist message is expected, work
through it before writing the final answer.

## Commands

```bash
pnpm dev          # next dev (Turbopack)  → http://localhost:3000
pnpm build        # next build
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint . (next + FSD boundaries)
pnpm format       # prettier --write .
pnpm test         # vitest run (unit/component)
pnpm test:e2e     # playwright (run `pnpm exec playwright install` once)
```

Git hooks via **Lefthook** (`lefthook.yml`): pre-commit runs eslint+prettier on
staged files, commit-msg runs commitlint. **Conventional Commits**; an optional
scope must name an FSD layer/area (`commitlint.config.js`).

## Pitfalls

- Never create a module-scope `QueryClient` (or a server-shared store) — use
  `getQueryClient()` per request.
- An RSC must not import client-only code (`react-toastify`, a zustand store, hook
  libraries). Mark `'use client'` on the consumer leaf.
- Route `params`/`searchParams` are async — `await` them in the route, pass plain
  props into the view.
- Middleware in Next 16 is the root file `proxy.ts` (Node runtime) exporting
  `proxy(request)` — not `middleware.ts`. Its `config.matcher` takes static string
  literals only.
- React Compiler runs via Babel (top-level `reactCompiler` in `next.config.ts`) —
  slightly slower builds, by design.
- Fonts are self-hosted (`next/font/local`); `next/font/google` breaks an offline
  build (RULES §12).
