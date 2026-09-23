# Load profile and performance budgets

> TEMPLATE. Copy to `docs/LOAD.md` and fill in — but only for a product where load
> is a real constraint. An empty budget is worse than none: it gets ignored.

This document is a **rule**, not a report. Numbers here are checked during review
the same way types are checked by the compiler.

---

# 1. Target load

| Metric                     | Value | Where it comes from |
| -------------------------- | ----- | ------------------- |
| Concurrent users at peak   |       |                     |
| Peak shape (burst or ramp) |       |                     |
| Steady write rate          |       |                     |
| Read/write ratio           |       |                     |
| Data volume per period     |       |                     |

State the _shape_ of the peak, not just its height: "everyone starts at 10:00"
and "spread over a day" are different systems at the same user count.

# 2. Budgets

| Budget                    | Limit | Enforced by |
| ------------------------- | ----- | ----------- |
| Initial bundle (hot path) |       |             |
| Time to interactive       |       |             |
| Server response, p95      |       |             |
| Rows fetched per request  |       |             |

# 3. Hard rules

Derived from the numbers above; these are what review checks:

- No unbounded query. Every list endpoint has a limit, and the limit is capped
  server-side — a client-supplied `limit` is never trusted.
- Any table that can exceed ~100 rows is virtualised.
- No N+1: batch by id, not a request per row.
- Nothing heavy is synchronous in a request — scoring, aggregation, report
  generation and exports run in a worker, with the request returning a handle.
- Aggregates are updated incrementally, not recomputed from scratch per event.
- Anything cacheable and immutable within a window is served as a static, cached
  asset rather than rendered per request.

# 4. Degradation

What the system sheds when it is overloaded, in order. Which endpoints go
read-only, what queues, what is deliberately delayed — decided in advance rather
than discovered during the peak.

# 5. Verification

The load scenario lives in the repository and runs before release: which tool,
which scenario, which thresholds count as a pass. A budget nobody measures is a
wish.
