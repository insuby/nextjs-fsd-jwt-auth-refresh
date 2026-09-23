# Architecture

How the repository is put together and where things go.

---

# 1. Shape

A single Next.js application. The Next server is both the UI renderer and the
**BFF**: the browser talks only to it, and it talks to the upstream API. Tokens
live in httpOnly cookies, so no credential ever reaches the client bundle.

```
browser ──► Next server (RSC render, Server Actions, proxy.ts) ──► upstream API
             cookies: access + refresh (httpOnly)
```

---

# 2. Repository zones

| Zone       | Contents                                                          |
| ---------- | ----------------------------------------------------------------- |
| `app/`     | Next App Router. Routing shell only — re-exports views            |
| `proxy.ts` | Next 16 middleware (Node runtime): session routing + refresh-gate |
| `src/`     | FSD layers — all application code                                 |
| `e2e/`     | Playwright specs                                                  |
| `public/`  | Static assets (self-hosted; see RULES §12)                        |
| `.claude/` | Agent configuration: hooks, skills, stack inventory               |
| `docs/`    | Project rules and documentation — the source of truth             |

A product built on this starter usually grows a fourth zone — its own API. When
frontend and backend share a wire format, that format belongs in a **single
shared contract module** (zod schemas) imported by both; neither side imports the
other directly.

---

# 3. Feature-Sliced Design

```
src/
├── app/        FSD app layer — providers (QueryClient, Toaster)
├── views/      screens (the FSD `pages` layer, renamed)
├── widgets/    composite blocks reused across screens
├── features/   user scenarios (a mutation, an action)
├── entities/   business objects
└── shared/     api, config, ui, lib — no business meaning
```

Dependency direction is strictly downward and enforced by
`eslint-plugin-boundaries`. The Next `app/` sits above `views`.

## Entity

A business object: `model` (zod schema, inferred types, pure helpers), `api`,
`server.ts` (server-only reads), optional `ui`, and `index.ts` as the public API.
It knows nothing about screens.

## Feature

One user scenario with a side effect: a Server Action in `api`, the UI that
triggers it, and any local state in `model`.

## Widget

A composite block used by more than one view. A block used by exactly one view
stays in that view.

## View

A screen. Composes widgets and features, prefetches data, owns the `searchParams`
schema. It composes — it does not implement.

## Shared

No business meaning: the API transport and session handling, typed env, routes,
UI primitives, helpers.

---

# 4. Rendering and data

- **Server Components by default.** `'use client'` goes on the leaf that needs
  interactivity, never on a whole layer.
- **Server reads** — `serverFetch` (`shared/api/server`) from
  `entities/<x>/server.ts`, called in a view.
- **Mutations** — Server Actions in `features/<x>/api`; they can write cookies.
- **Client data** — React Query; `getQueryClient()` gives a fresh client per
  request on the server and a singleton in the browser. Views prefetch and wrap
  children in `HydrationBoundary`.

---

# 5. Auth and session

Access and refresh tokens are stored in httpOnly cookies.

- `proxy.ts` runs before the RSC render: it routes by session presence and, when
  the access token is missing or near expiry, refreshes it **proactively** — the
  render then always sees a valid token (a render cannot write cookies itself).
- `serverFetch` retries once on a 401 through a **single-flight** refresh
  (`shared/api/session/refresh-single-flight.ts`), so parallel 401s inside one
  render share a single refresh.
- Only a definitive rejection (400/401/403) clears the session; a transient
  upstream error does not.

**Scaling note.** The single-flight is _request-scoped_: it deduplicates within
one render, not across a user's tabs and not across a fleet. When many users sign
in at once, their tokens also expire at once — add jitter to the token TTL and a
grace window for the previous refresh token on the backend, or the refresh storm
will arrive as one spike.

---

# 6. Design system

Tokens live in `app/globals.css` under `@theme` and are the only source of
colour, radius and typography. See `docs/DESIGN.md`.

---

# 7. Tests and quality

- **Vitest** + Testing Library — units and components.
- **Playwright** — end-to-end.
- **ESLint flat config** — Next rules plus FSD boundaries; **Prettier** with
  sorted imports.
- **Lefthook** — pre-commit lint/format on staged files, commit-msg commitlint.
- The `Stop` hook (`.claude/hooks/check-rules.sh`) re-runs eslint on changed
  files plus a full typecheck before an agent may finish.
