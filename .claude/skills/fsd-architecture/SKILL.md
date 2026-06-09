---
name: fsd-architecture
description: >-
  Feature-Sliced Design rules for this Next.js repo — layer hierarchy, slices,
  segments, import direction, and public API. Use when adding, moving, or
  refactoring code under src/, deciding which layer or segment a module belongs
  in, or creating new modules.
---

# Feature-Sliced Design — rules for this project

Methodology: https://feature-sliced.design/ . This repo runs FSD on **Next.js 15
App Router** — see `fsd-with-nextjs`. Project specifics: `CLAUDE.md`,
`.claude/stack.md`.

## Layers (top → bottom)

`app → views → widgets → features → entities → shared`

> The FSD `pages` layer is renamed **`views`** here to avoid the Next `app/pages`
> collision. Next's own `app/` (routing) sits at the project root, above `views`.

**Import rule (the core constraint):** a module may import **only from layers
strictly below it**. Enforced by `eslint-plugin-boundaries`.

- `shared` imports from nothing above it.
- Same-layer **cross-slice** imports are forbidden (one `feature` must not import
  another `feature`).

| Layer      | Holds                                                  | Slices?            |
| ---------- | ------------------------------------------------------ | ------------------ |
| `app`      | providers (QueryClient, Toaster), app-wide setup       | no (segments only) |
| `views`    | route-level screens, one per route (FSD "pages")       | yes                |
| `widgets`  | self-sufficient composite UI blocks                    | yes                |
| `features` | user actions that deliver value (auth, add-to-cart)    | yes                |
| `entities` | business entities (User, Product) + their ui/model/api | yes                |
| `shared`   | reusable, domain-agnostic code; **no business logic**  | no (segments only) |

## Slices & segments

- **Slice** = a folder named by business domain inside
  `views/widgets/features/entities` (e.g. `features/auth`). `app` and `shared`
  have **no slices** — only segments.
- **Segments** (canonical set — don't invent names): `ui`, `api`, `model`, `lib`, `config`.
  - `ui` — components, styles
  - `api` — backend requests, DTOs, mappers
  - `model` — store (zustand), schemas (zod), business logic, types
  - `lib` — slice-local helpers
  - `config` — constants, feature flags

## Public API (barrels)

- Every slice/segment exposes a single `index.ts` re-exporting its public surface.
- **Import from the barrel, never deep-import** another slice's internals:
  - ✅ `import { apiFetch } from 'shared/api'`
  - ❌ `import { apiFetch } from 'shared/api/api-client'`

## Locality — keep code where it's used (important)

Default to the **lowest, most local** place. Write code **inside the slice that
uses it**; promote it to a more-shared layer **only when a second consumer
actually exists** — never "just in case".

- A UI component used by **one view only** → `views/<view>/ui/`. Do **not** put
  it in `app`, the project root, `widgets`, or `shared`.
- A view is a slice: it may have its own `ui`, `model`, `lib`, `api` segments for
  view-private code. Keep view-specific helpers/stores/types there too.
- Promote to `widgets` / `features` / `entities` / `shared` **only on real reuse**.
- Premature promotion — a single-use module sitting in `shared` / `widgets` /
  `app` / project root — is a violation. Move it back down into the view.

## "Where does this go?" decision guide

1. Reusable with **no** business meaning (button, fetch helper, date util, route
   consts)? → `shared/<segment>`.
2. A **business entity** (data + its card/model/api)? → `entities/<entity>`.
3. A **user-facing action** that produces value (login, filter, like)? →
   `features/<feature>`.
4. A **composite block** assembled from features/entities? → `widgets/<widget>`.
5. A **whole route screen**? → `views/<view>`.
6. App-wide wiring (providers)? → `src/app/`. Routing? → root `app/` (thin shell).

## This project

- Aliases = layer names (`app`, `views`, `widgets`, `features`, `entities`,
  `shared`) plus `@/*` → `src/*` (used by the root routing shell). See `tsconfig.json`.
- `shared/config` — `RoutesPath` and the typed `env`.
- `shared/api` — `apiFetch` (fetch client) and `getQueryClient`. No axios.
- `features/` and `entities/` don't exist yet — create the folder when the first
  one appears.

## Anti-patterns (reject these)

- Importing upward (e.g. `shared` importing from `features`).
- Cross-slice import within a layer.
- Deep import bypassing a slice's `index.ts`.
- Free files at a layer root instead of inside a slice/segment.
- Promoting single-use view code to `shared`/`widgets`/`app` (premature
  abstraction) — keep it in `views/<view>/` until a second consumer appears.
- Non-canonical segment names (`utils`, `helpers`, `constants`, `types`) → use
  `lib`/`config`/`model`.
- Business logic placed in `shared`.
