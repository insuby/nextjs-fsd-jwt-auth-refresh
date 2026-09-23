# RULES — binding constraints

Hard constraints for this repository. The `Stop` hook cites these section numbers,
so **do not renumber** sections — append instead.

---

# 1. FSD

- Layers: `views → widgets → features → entities → shared`. A layer imports only
  from the layers **below** it. Enforced by `eslint-plugin-boundaries`.
- The Next `app/` directory sits **above** `views` and is routing only.
- A slice is reached through its public API (`index.ts`). **No deep imports**
  into another slice's internals.
- The FSD `pages` layer is named **`views`** here, because Next owns `pages`.
- **Locality:** code used in one place stays there. A component, hook or store
  used by a single view lives in `views/<view>/…`. Promote it to `widgets` /
  `shared` only when a **second** consumer appears.

---

# 2. Routing (Next App Router)

- Root `app/` holds routing only: `page.tsx` re-exports a view, `layout.tsx`
  mounts providers. **No business logic, no data fetching in route files.**
- Paths come from `RoutesPath` (`shared/config`) — never hand-written strings —
  for `next/link`, `redirect()` and `router.push()`.
- `params` and `searchParams` are async: `await` them in the route file and pass
  plain props into the view.
- List state (page, filters, sorting, period) lives in `searchParams`, typed by a
  zod schema in the view's `model` — not in `useState`.
- Middleware is the root file `proxy.ts` (Node runtime) exporting `proxy(request)`.
  Its `config.matcher` entries must be **static string literals** — Next parses
  them at build time and cannot resolve `RoutesPath.*` there.

---

# 3. Server / client boundary

- Server-only code (anything reading cookies, secrets or `env` server vars) lives
  in `shared/api/server`, `entities/<x>/server.ts` or a Server Action, and is
  **never** imported from a Client Component.
- An RSC must not import client-only code (`react-toastify`, a store, hook
  libraries). Put `'use client'` on the leaf consumer, not on a layer.
- The browser never learns the upstream API address: requests go through the Next
  server (BFF). Tokens stay in httpOnly cookies and never reach the client bundle.
- `.tsx` only for files containing JSX.

---

# 4. Entities

- An entity describes a business object: `model` (zod schema + inferred types +
  pure helpers), `api` (requests), `server.ts` (server-only reads), `ui` (its own
  presentation), `index.ts` (public API).
- An entity knows nothing about the screens that use it and holds no user
  scenario — that is a feature's job.

---

# 5. Data

- Server reads: `serverFetch` from `shared/api/server`, called in
  `entities/<x>/server.ts` and used by a view.
- Mutations: Server Actions in `features/<x>/api`; the same zod schema is
  re-validated on the server.
- Client data: React Query. The client comes from `getQueryClient()`
  (`shared/api`) — **never** a module-scope `QueryClient`, it would leak between
  requests and between users.
- A query key carries entity + operation + normalised parameters:
  `['products', 'list', { page, limit }]`.
- Prefetch in the view, wrap in `HydrationBoundary`; the client component reads
  the same key.
- HTTP calls live only in `entities/<x>/api` and `features/<x>/api`. No `fetch`
  in a component.

---

# 6. Client state

- Server data is React Query's job. Only genuinely client state (UI mode, a
  wizard's step, selections) goes into a store.
- A store lives in the slice's `model` and is created per component tree, never in
  module scope on the server path.

---

# 7. Forms

- `react-hook-form` + `zodResolver`; the same schema re-validated in the Server
  Action. Never trust client validation alone.
- Critical fields (amounts, identifiers, document references) are always validated.
- Submit is disabled while the mutation is in flight; the result is reported with
  a toast or an inline message.

---

# 8. UI and styling

- Tailwind v4, CSS-first. A single `@import 'tailwindcss';` in `app/globals.css`;
  tokens via `@theme`. No `tailwind.config.js`.
- **Design tokens only — no hex colours in JSX/TSX.** A new colour is a new token.
- Screens are built from the mockup in `docs/design/`, see `docs/DESIGN.md`.
  Deviate only for a reason, and say what it was.
- Toasts: `react-toastify`, one `<ToastContainer/>` in Providers, no CSS import.
- Numbers, amounts and identifiers use tabular figures.

---

# 9. Typing

- No `any`, no `string & {}` hacks, `strict` stays on.
- Types on the wire are **inferred from zod schemas**, not hand-written twice.
- Exported functions have explicit return types when inference would be unclear.

---

# 10. UX states

- Every list and async view handles **loading**, **error** and **empty** — the
  empty state includes a hint for the next step.
- Destructive actions are confirmed; where sensible, offer undo instead of a
  confirmation dialog.
- No surprise redirects; a failed request keeps the user's input.

---

# 11. Session and secrets

- Access + refresh in httpOnly cookies; `proxy.ts` refreshes proactively before
  the RSC render. If the backend **rotates** refresh tokens, `proxy.ts` must be
  the single place that refreshes (it is the only one that can write cookies
  before the render).
- Only a definitive auth rejection (400/401/403) clears the session. A transient
  upstream failure (5xx, network) must never discard a valid refresh token.
- No secrets in the repository. New environment variables go through
  `shared/config/env.ts` and `.env.example`.
- Never log personal data or tokens.

---

# 12. Closed contour and offline builds

The app must build and run with **no outbound internet access**.

- No external CDNs, font services, analytics or telemetry at build or runtime.
- Fonts are self-hosted: `next/font/local`, **never** `next/font/google`.
- Third-party assets are vendored into `public/` or `src/`, not hot-linked.
- Disable Next telemetry for offline builds: `NEXT_TELEMETRY_DISABLED=1`
  (or once per machine: `pnpm exec next telemetry disable`).
- Tests and e2e must not depend on a public API. The bundled Playwright spec
  drives the demo upstream — when this starter becomes a product, point it at the
  project's own API or a mock.

The `Stop` hook greps changed files for external origins and reports hits.

---

# 13. Extending the system

Adding a new entity:

1. Schema and types in `entities/<entity>/model`
2. `entities/<entity>/api` (client) and `server.ts` (RSC reads)
3. `entities/<entity>/index.ts` — public API
4. A feature if there is a user scenario (a mutation)
5. Wire it into a view; prefetch + `HydrationBoundary` for client data

Before creating anything new, grep for an existing equivalent in `shared/ui`,
`shared/lib`, `entities/<x>/ui` and `features/`.

---

# 14. Mandatory checks

After any change: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

## If the checks do not pass, the task is not done.

---

# 15. Temporary solutions

- A workaround is allowed only with a comment explaining why, and an entry in
  `docs/DECISIONS.md`.
- No `TODO` without a task behind it, no commented-out code, no placeholder
  comments left in the diff.

---

# 16. Decomposition

## Views

- A view composes; it does not implement. Markup longer than roughly a screenful
  moves into a widget or a feature.

## Files and exports

- One meaningful export per file; the file is named after it.
- A barrel (`index.ts`) re-exports — it contains no logic.

## Functions

- A function does one thing. Non-trivial logic lives in `model` / `lib`, not in
  a component body.

## Markup

- Flex by default, grid where a grid is genuinely needed.
- No wrapper `div`s that exist only to hold a class that could live on the child.

---

# 17. Project documentation

- `docs/` is the source of rules. A new `docs/*.md` must be read before editing
  code.
- A rule agreed in chat is written into `docs/RULES.md` (or the relevant
  document) — it does not stay in the conversation history.
- A new library or a stack change updates `.claude/stack.md`.
- A decision with alternatives and a reason goes into `docs/DECISIONS.md`, newest
  first; an old entry is never edited — a new one supersedes it.
- Process, roles or statuses change → `docs/SYSTEM_OVERVIEW.md`.
- Starting a real product from this starter: copy the relevant files from
  `docs/_templates/` into `docs/` and fill them in.
