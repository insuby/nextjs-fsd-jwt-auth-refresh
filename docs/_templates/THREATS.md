# Integrity and threat model

> TEMPLATE. Copy to `docs/THREATS.md` and fill in for any product where a user
> benefits from cheating the system — exams, scoring, payments, quotas, voting.

The purpose is narrow and practical: write down what a motivated user would try,
and which check on the **server** stops it. A rule that only the browser enforces
is not a rule.

---

# 1. What is being protected

The claims the product makes about its own data — "this score was earned in this
time window by this person". Each one becomes a check below.

# 2. Assumptions

Who is trusted and how far: the browser (never), the client clock (never), the
network (unreliable), the operator (trusted but audited), the administrator
(powerful — therefore logged).

# 3. Threats and countermeasures

| #   | Threat | Countermeasure (server-side) | Logged as |
| --- | ------ | ---------------------------- | --------- |
|     |        |                              |           |

Start from the ones that are always true in this class of product:

- A deadline enforced only in the UI → the server stores the deadline at start and
  rejects late writes.
- An action outside its permitted window → the window is checked on the server at
  every state transition, not just when rendering a button.
- Someone else's object reached by guessing an id → ownership is checked on every
  read and write; an unauthenticated path never short-circuits the check.
- A replayed or duplicated submission → idempotency key, single terminal
  transition.
- Two sessions for one actor → one active session per actor, later logins
  invalidate or are refused.
- Content edited after the fact, changing history → immutable snapshots of what
  the user actually saw.

# 4. Audit

What is recorded, with what fields, and for how long. Every administrative
override — deleting, re-scoring, unlocking — is recorded with actor, target,
reason and time.

# 5. Privacy

What counts as personal data here, where it may appear, and where it must not:
logs, error messages, exports, URLs, and anything shown to _other_ users. A
common leak is using real user data as filler — distractors, suggestions,
placeholders.

# 6. Out of scope

Threats deliberately not addressed, and why. Being explicit prevents a false
sense of coverage.
