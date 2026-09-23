# How the system works — domain, roles, flow

> TEMPLATE. Copy to `docs/SYSTEM_OVERVIEW.md` and fill in. This is the document an
> agent reads to avoid inventing business logic (AGENTS.md §2). Keep it current:
> when the process or a status changes, this file changes with it.

---

# 0. In one paragraph

What the product is, who uses it, what problem it removes. Someone who reads only
this paragraph should be able to place every screen.

# 1. As the customer described it

The original brief, close to their wording. Useful later, when a requirement looks
arbitrary — it usually came from here.

# 2. Regulatory and external constraints

Laws, standards, internal policies, integrations that dictate behaviour. Quote the
clause that actually drives a rule, not the whole document.

# 3. Glossary

Domain term → what it means here → what it is called in the code. This table is
what keeps the UI copy, the database columns and the conversation in sync.

# 4. Parties, organisations and roles

Who acts in the system, what each one may do, what each one must never see.

# 5. Entities, fields, statuses

Each entity: what it is, its key fields, its status set. Statuses listed exactly as
they appear in the UI.

# 6. Flow and rules

The process stage by stage: what triggers a transition, who performs it, what is
validated, what happens on failure. Rules that are easy to get wrong go here
explicitly.

# 7. Non-functional expectations

Scale, peak load, latency people will notice, offline behaviour, retention. If
they matter, `docs/LOAD.md` holds the numbers.

# 8. Product principles and the details that matter

The handful of behaviours that make this tool pleasant rather than merely correct
— keyboard flow, bulk actions, undo, what must never require a second click.

# 9. Phases

What ships first, what is deliberately postponed, and why.

# 10. Open questions

Everything not yet decided, with who needs to answer it. An open question written
down is a question that does not get silently invented away.
