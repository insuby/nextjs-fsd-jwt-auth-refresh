# Decision log

What was decided, when and **why**. A new decision is a new entry on top. Changed
your mind? Do not edit the old entry — add a new one that references it.

---

## 2026-09-23 · Agent rules: `docs/` + hooks instead of prose in `CLAUDE.md`

`CLAUDE.md` alone does not survive a long session: after `/compact` the rules are
reloaded but the task state is not, and nothing verifies that the rules were
actually applied.

**Decision:** three layers.

1. `CLAUDE.md` pulls `AGENTS.md`, `docs/RULES.md` and `docs/ARCHITECTURE.md` in
   via `@`-includes, so they reload on every session and after every compaction.
2. `docs/` is the single source of rules; `RULES.md` sections are **numbered** so
   the hook can cite them.
3. `.claude/hooks/check-rules.sh` records a baseline of uncommitted changes at
   session start, and on `Stop` blocks completion until a self-check against
   `RULES.md` has been done — after running eslint on the changed files and a
   full typecheck.

The baseline is a manifest of `path → content hash`, so the checks cover only
what the agent itself touched, and a file edited twice is not missed. On
`resume`/`compact` the baseline is deliberately **not** reset, so the final check
still spans the whole task. `stop_hook_active` separates the first stop (full
checklist) from later ones (check status only), and `MAX_LINT_RETRIES` stops the
loop instead of trapping the agent.

Ported from the `med-financial` project, where it has been in daily use.

## 2026-09-23 · Closed-contour readiness is a rule, not an afterthought

Products built on this starter are deployed into networks without internet
access. Retrofitting that later is expensive — a Google font in the layout is
found on installation day, at the customer's site.

**Decision:** `RULES §12` — no external CDNs, font services, analytics or
telemetry; fonts via `next/font/local`; `NEXT_TELEMETRY_DISABLED=1` for offline
builds; `output: 'standalone'` so the container does not need a package install.
The `Stop` hook greps changed files for external origins.

## 2026-09-23 · ESLint stays on 9; `boundaries` on 7 with `mode: 'full'` kept

Two findings while refreshing the toolchain, both worth writing down because both
fail **silently** in the wrong direction.

**ESLint 10 is not usable yet here.** `eslint-plugin-react@7.37.5` (the current
release) still calls `context.getFilename()`, removed in ESLint 10, so linting
dies with `TypeError: contextOrFilename.getFilename is not a function` the moment
it reaches a `.tsx` file. The plugin arrives transitively through
`eslint-config-next`, so it cannot simply be dropped. Pinned back to `eslint@^9`
and `@eslint/js@^9`; revisit when `eslint-plugin-react` ships ESLint 10 support.

**`eslint-plugin-boundaries@7` — `partialMatch: false` is not `mode: 'full'`.**
v7 deprecates `mode` and tells you to use `partialMatch: false` instead. In 7.2.0
that property is only read by the settings **validation** code — the matcher never
sees it. Following the deprecation notice therefore turns the `root` descriptor
(`app/**/*.{ts,tsx}`, `proxy.ts`) into folder matching, those files stop being
classified, and every boundary rule for the routing shell stops firing — with no
error and a green lint. Verified with a probe file: before the change a deep
import from `app/` into a slice's internals was reported; after it, nothing.

So: `rules → policies`, entity selectors (`{ element: {...} }`) and
`internalPath → fileInternalPath` were migrated, `mode: 'folder'` was dropped
(it really is the default), and **`mode: 'full'` was kept on the `root`
descriptor** with a comment explaining why. The deprecation warning it prints is
expected.

Lesson for the next upgrade: a lint rule that goes quiet looks exactly like a lint
rule that passes. After touching the boundaries config, prove it still bites —
drop in a file with a forbidden import and confirm it errors.

## 2026-09-23 · Dependencies: current majors, TypeScript stays on 5.x

Everything was refreshed to the current majors, with two exceptions:

- **TypeScript 7** (the native compiler) — held back. The gain is build speed;
  the risk is the whole toolchain (ESLint's TS integration, Next's build, editor
  support) at a point where the starter is about to become the base for real
  products. To be revisited once the ecosystem has settled.
- **Node engines** — the `<25` upper bound was removed rather than raised: it is
  the kind of cap that silently breaks installs as Node moves on. Node 24 LTS is
  the recommended runtime.

## 2026-06 · Base architecture — FSD on the App Router, `pages` renamed to `views`

Next's file-system router owns `app/` and `pages/`, which collides with two FSD
layer names.

**Decision:** Next's `app/` stays at the repository root as a thin routing shell;
all FSD layers live in `src/`, and the FSD `pages` layer is renamed **`views`**.
Layer boundaries are enforced by `eslint-plugin-boundaries` rather than by
convention, because an unenforced convention decays.

## 2026-06 · Tokens in httpOnly cookies with a refresh-gate in `proxy.ts`

Keeping a JWT in `localStorage` exposes it to any script on the page, and an RSC
render cannot write cookies — so a token refreshed during a render would be lost.

**Decision:** access and refresh tokens live in httpOnly cookies; `proxy.ts`
(Next 16 middleware, Node runtime) refreshes proactively **before** the render
and persists the new pair. `serverFetch` additionally retries once on a 401
through a request-scoped single-flight refresh, so parallel 401s in one render do
not trigger several refreshes.

Consequence: with a backend that **rotates** refresh tokens, `proxy.ts` must be
the only refresher — it is the only place that can write cookies pre-render.
