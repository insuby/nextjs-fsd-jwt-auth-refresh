---
name: fsd-review
description: >-
  Review code changes for Feature-Sliced Design violations and Next.js RSC
  pitfalls — upward/cross-layer imports, deep imports past a slice's public API,
  premature promotion, non-canonical segments, and bad 'use client' boundaries.
  Use when reviewing a diff or a PR, or before committing UI/architecture changes.
---

# FSD compliance review (Next.js)

Check the current changes against the FSD rules (`fsd-architecture`). Much of the
import-direction rule is also enforced by `eslint-plugin-boundaries` — run
`pnpm lint`; this skill adds the judgement the linter can't.

## 1. Gather what changed

- Git repo: review `git diff` / `git diff --staged` under `src/` and `app/`.
- Otherwise: review the files currently being edited.

## 2. Violation checklist (flag each with `file:line` + fix)

**Import direction** — importing from an equal/higher layer
(order: `app > views > widgets > features > entities > shared`):

- ❌ `shared/*` importing `entities|features|widgets|views`
- ❌ `entities/*` importing `features|widgets|views`
- ❌ a `feature` importing another `feature` (cross-slice)

**Public API bypass:** deep import past another slice's `index.ts`.

**Premature promotion (locality):** a module used by **only one view** living in
`shared`/`widgets`/`app`/root → move it into `views/<view>/...`. Promote only on
real reuse (2+ consumers).

**Placement & segments:** files at a layer root instead of a slice/segment;
non-canonical segments (`utils`/`helpers`/`constants`/`types` → `lib`/`config`/`model`);
business logic in `shared`.

**Next.js / RSC:**

- ❌ `'use client'` on a whole layer/slice instead of the interactive **leaf**.
- ❌ a Server Component importing client-only code (`react-toastify`,
  `usehooks-ts`, runtime `@emotion/css`, a zustand store).
- ❌ a module-scope `QueryClient` (or server-shared store) — must use
  `getQueryClient()`.
- ❌ business logic in a root `app/.../page.tsx` (should be a thin re-export).
- ❌ `import.meta.env` (Vite-ism) — use `process.env` / typed `env`.

## 3. Output

For each finding: `severity · file:line · rule broken · concrete fix`. If clean,
say so. Offer to apply fixes.
