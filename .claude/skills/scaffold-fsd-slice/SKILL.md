---
name: scaffold-fsd-slice
description: >-
  Scaffold a new FSD slice (view, widget, feature, or entity) or a shared segment
  with the correct folder structure, segments, and public-API barrel, wired into
  the Next.js App Router. Use when creating a new route/view, feature, entity,
  widget, or shared module.
argument-hint: '[layer] [slice-name]'
---

# Scaffold an FSD slice (Next.js App Router)

Create a slice/segment that follows this repo's FSD conventions. Rules:
`fsd-architecture`. Next mapping: `fsd-with-nextjs`.

## Inputs

- **layer**: `views | widgets | features | entities | shared`
- **slice-name**: kebab-case (e.g. `user-profile`, `auth`)

If not provided, ask which layer and name. Confirm placement with the decision
guide in `fsd-architecture`.

## Structure (views / widgets / features / entities)

```
src/<layer>/<slice-name>/
├── ui/                    # components
│   └── <component>.tsx
├── model/                 # (optional) zustand store, zod schemas, types
├── api/                   # (optional) fetch calls, server actions, DTOs
├── lib/                   # (optional) slice-local helpers
└── index.ts               # public API barrel
```

Re-export the slice from the layer barrel `src/<layer>/index.ts`.

### shared (segments, no slices)

Add to the relevant segment: `src/shared/{ui,api,lib,config,model}/...` and export
it from that segment's `index.ts`.

## A new VIEW also needs a route (thin shell at root `app/`)

```tsx
// app/<route>/page.tsx
export { SomeView as default, metadata } from '@/views/<slice-name>';
```

- The route file is **only** the re-export — no logic.
- The view component is a **Server Component** by default (no `'use client'`).
- Add the path to `RoutesPath` in `shared/config` if it's linked from elsewhere.

## Rules

- Folder & file names: **kebab-case**. Component identifiers: PascalCase.
- `index.ts` re-exports only the public surface.
- Don't create empty segments — add `ui`/`model`/`api` only when used.
- `.tsx` only if the file has JSX; otherwise `.ts`.
- **Locality:** view-private UI goes in `views/<view>/ui/`, not in
  `widgets`/`shared`/`app`. Extract only when a second consumer exists.
- **`'use client'` on leaves:** mark only the interactive component, not the slice.
- After scaffolding: `pnpm typecheck` (barrels resolve) and `pnpm lint` (FSD
  boundaries).

## Example — `features/auth`

```
src/features/auth/
├── ui/login-form.tsx        # 'use client' — RHF + zodResolver
├── model/schema.ts          # zod schema (shared with the server action)
├── api/login.ts             # 'use server' action
└── index.ts                 # export { LoginForm } from './ui/login-form';
```
