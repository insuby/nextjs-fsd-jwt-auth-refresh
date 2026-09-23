## Required reading before any task

The agent must:

1. Read `docs/ARCHITECTURE.md`
2. Read `docs/RULES.md`
3. Run `ls docs/` and read every file it has not read in this session
4. Verify that the proposed solution does not violate `RULES.md`

If a solution violates `RULES.md`, the agent must rework the approach.

# Agent guide

This document defines the binding rules for automated agents (Claude Code, Codex
and others) working in this repository. Humans are welcome to follow them too.

---

## About this repository

A **Next.js 16 (App Router) starter**: React 19, TypeScript strict, organised with
**Feature-Sliced Design**, RSC-first, with a working JWT auth flow (access +
refresh in httpOnly cookies, refresh-gate in `proxy.ts`).

It is deliberately **lean**: a library is added when a feature needs it, and is
documented in `.claude/stack.md` the moment it is added.

When this starter is used as the base for a real product, the project-specific
documents are promoted from `docs/_templates/` into `docs/` and filled in — see
[§17 of `docs/RULES.md`](docs/RULES.md).

---

## Stack

- Framework: **Next.js 16 (App Router), React 19, TypeScript strict**
- Architecture: **Feature-Sliced Design** (`pages` → `views`), FSD layers in `src/`
- Data: RSC `fetch` + Server Actions + **@tanstack/react-query**
- Forms: **react-hook-form** + **zod** (`@hookform/resolvers`)
- Styling: **tailwindcss v4** (CSS-first, tokens in `app/globals.css`)
- Auth: JWT access + refresh in httpOnly cookies, refresh-gate in `proxy.ts`
- Quality: ESLint flat config + `eslint-plugin-boundaries`, Prettier, Vitest,
  Playwright, Lefthook + commitlint

Full inventory and what to reach for: `.claude/stack.md`.

---

## Working principles

### 1. Minimal, targeted changes

- No refactoring outside the task.
- No architectural changes without an explicit request.
- Atomic changes.

### 2. Do not invent business logic

If the requirements are incomplete:

- Check `docs/SYSTEM_OVERVIEW.md` for the process, roles and statuses.
- Implement the most conservative reading.
- State assumptions explicitly. Never invent behaviour that was not described.

### 3. Respect architectural boundaries

- Follow the directory structure and the FSD dependency direction.
- A layer imports only from layers below it; slices are reached through their
  public API (`index.ts`), never by a deep import.
- Server-only modules never end up in a client bundle.
- Reuse existing utilities, hooks and components.

### 4. Operator-grade UX

Every list and every async view handles **loading**, **error** and **empty**
(with a hint for the next step). Predictable interface, no surprise redirects,
clear statuses.

### 5. Type safety

- No `any`. `strict` stays on.
- The shape of data on the wire is described by a zod schema and inferred from it.
- Pagination, filter and sort parameters are normalised.

---

## Task process

### Step 1 — Analysis and plan

- Identify the files and layers involved.
- Identify the data flow: route → view (RSC prefetch) → widget/feature →
  entity api → API.
- If a new endpoint is needed: contract first, then server, then frontend.

### Step 2 — Implementation

- Minimal sufficient implementation, consistent naming.
- UI separate from business logic; non-trivial logic lives in the slice's
  `model` / `lib`.
- Build screens from the mockup in `docs/design/`, using the tokens from
  `app/globals.css`.

### Step 3 — Checks

Before finishing: `pnpm typecheck`, `pnpm lint`, `pnpm test`. The `Stop` hook
requires them automatically.

### Step 4 — Report

The final answer states: what changed, which files, how to verify by hand, and
which assumptions were made.

---

## Definition of Done

- Behaviour matches the task and `docs/SYSTEM_OVERVIEW.md`.
- All UI states handled; copy is short and precise.
- `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.
- No changes outside the scope of the task.
- Any rule, library or process decision made along the way is written down
  (`docs/RULES.md`, `docs/DECISIONS.md` or `.claude/stack.md`).
