# Design brief — template

> TEMPLATE. Copy to `docs/design-prompt.md`, fill in, and feed it to Claude Design.
> Keep the filled version in the repository: it doubles as the description of how
> the screens are expected to behave, and `docs/DESIGN.md` links back to it.

What makes such a brief work: concrete roles, a real process, exact status names,
a prioritised screen list, the specific interactions that must be visible, and
real fictional data from `docs/DEMO_DATA.md` — never lorem ipsum.

---

## Opening

One paragraph: what to design, for whom, platform and width (e.g. desktop-first,
1440px), working title, interface language, and the instruction to use realistic
data only.

## Who uses it

Each role: what they do daily, what they are responsible for, what they must not
see. Group by side/organisation if the product spans several.

## How the process works

The flow in prose, end to end, with the handovers between roles. Mark it as
context — "for understanding, do not draw it as-is".

## Statuses

Every status scale, in order, exactly as the UI will show them. These become chips
and steppers, so the wording is final here.

## Screens, by priority

A numbered list. For each: what it is for, what is on it, which role sees it, and
what the main interaction is. Number them — the numbers become artboard names and
then rows in the `docs/DESIGN.md` mapping table.

Put the two or three screens the product lives or dies by first, and say so.

## Details that must be visible

The interactions that distinguish a real tool from a mockup: keyboard flow, bulk
actions, undo, inline validation, what is disabled and why, empty states that tell
you what to do next. Be specific — this section is what prevents a generic result.

## Visual direction

Light or dark, one accent colour (name candidates), semantic status colours,
typography with tabular figures, density, navigation shape. State what to avoid as
firmly as what to aim for. Contrast target: AA.

## Data for the mockups

Paste the world from `docs/DEMO_DATA.md` — organisations, people, reference data,
amounts, dates.

## Deliverables

Separate artboards per screen, one design system, a component sheet with every
state, and a flow map. Say which screens to start with.
