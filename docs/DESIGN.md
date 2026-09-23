# Design system and mockups

Tokens live in `app/globals.css` under `@theme`. They are the **only** source of
colour, radius, typography and shadow — see RULES §8: no hex values in JSX.

When a project has mockups, they go in `docs/design/` (Claude Design exports
single-file `.dc.html`, which open straight in a browser) and this file gains the
"artboard → screen" table below.

**Rule:** a screen is built from its artboard. Spacing, block composition, copy
and states come from the mockup, not from memory. Deviate only for a reason — and
then say what the reason was.

---

# Tokens (`app/globals.css`)

Colour is defined in **OKLCH**: perceptually even lightness, so a "one step
darker" hover is actually one step darker, and a palette stays consistent when
hues change.

| Token                                          | Role                                             |
| ---------------------------------------------- | ------------------------------------------------ |
| `bg` / `surface`                               | page background / raised surfaces, table headers |
| `ink` / `ink-hover`                            | primary text / its hover                         |
| `muted` / `faint`                              | secondary text / captions, metadata              |
| `line` / `line-strong`                         | dividers / field borders                         |
| `brand` / `brand-deep` / `brand-deep-hover`    | accent: marks, focus, primary buttons            |
| `brand-text` / `brand-weak` / `on-brand`       | accent text / accent fills / text on accent      |
| `success` / `danger`                           | semantic states                                  |
| `radius-field` / `radius-card` / `radius-pill` | 10px fields · 14px cards · pills                 |
| `font-sans`                                    | system stack — self-hosted only (RULES §12)      |
| `shadow-card`                                  | the single card elevation                        |

The starter ships a restrained light theme: near-white canvas, near-black ink, one
calm slate accent used sparingly (mark, avatar, focus). A product will replace the
values — keep the **structure** (semantic names, OKLCH, one accent) rather than
inventing a parallel set of colours.

Adding a dark theme: redefine the same tokens under
`@media (prefers-color-scheme: dark)` and a `:root[data-theme='dark']` selector.
Do not introduce `dark:` variants scattered through the markup.

---

# Status chips

Every status scale a product introduces is listed here with its tone mapping, so
one status never renders in two different colours on two screens.

| Scale     | Values → tone    |
| --------- | ---------------- |
| _(empty)_ | fill per product |

---

# Components

A product lists its cross-cutting components here (a chip, a table row in each of
its states, an empty state, a stepper) and keeps one artboard showing all of them
— it is cheaper to check a component sheet than to hunt states across screens.

---

# Artboard → screen

| Artboard  | Route | View | Role |
| --------- | ----- | ---- | ---- |
| _(empty)_ |       |      |      |
