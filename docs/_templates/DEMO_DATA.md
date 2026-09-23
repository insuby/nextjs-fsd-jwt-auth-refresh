# Demo data — one fictional world

> TEMPLATE. Copy to `docs/DEMO_DATA.md` and fill in.

**Rule:** mockups, seeds, tests and screenshots all use **this** data and nothing
else. One coherent world means a name in a mockup matches a name in the seed,
which matches a name in an e2e test — and a screenshot can be trusted.

No lorem ipsum. No real personal data, ever.

---

# Organisations

Fictional but plausible names; keep the naming pattern the customer's real data
follows, so layouts break here rather than in production.

# People

Names with roles. Cover the awkward cases deliberately: a long surname, a
double-barrelled name, a missing middle name, two people with the same surname.

# Reference data

Categories, statuses, types — the closed lists the product depends on.

# Amounts, dates and periods

A fixed "today", one working period, and amounts long enough to test column
widths. Specify the formatting: separators, currency, date format.

# Edge cases to keep present

One empty entity, one at the limit (maximum rows, longest text), one in an error
state, one archived/deleted. If they exist in the demo world, they get designed
and tested for.
