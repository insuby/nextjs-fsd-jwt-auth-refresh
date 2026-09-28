# `.dsh/` — DeepSeek Harness setup

The DSH counterpart of `.claude/`. Same rules, same checks, adapted to the DSH
hook protocol. Claude Code keeps using `.claude/settings.json`; DSH mounts
`.dsh/hooks/hooks.json` and runs `.dsh/hooks/check-rules.sh`.

| Claude Code                    | DeepSeek Harness                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `CLAUDE.md` (+ `@`-includes)   | `AGENTS.md` is loaded; `@`-includes are **not** expanded                                |
| `.claude/settings.json`        | `.dsh/hooks/hooks.json` (mounted in a DSH profile)                                      |
| `.claude/hooks/check-rules.sh` | `.dsh/hooks/check-rules.sh` — DSH adapter, delegates the checks to the `.claude` script |
| `.claude/skills/*`             | `.dsh/skills` → `../.claude/skills` (symlink)                                           |
| `SessionStart` / `Stop` hooks  | same events through the hook bridge                                                     |

## What the hook does

`check-rules.sh` takes one mode argument; `hooks.json` maps DSH events onto it.

| Mode       | Event                            | Behaviour                                                                        |
| ---------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `baseline` | `SessionStart` (startup, clear)  | records the uncommitted-change baseline, prints `docs/` + the `@`-included files |
| `context`  | `SessionStart` (resume, compact) | prints `docs/` only; the baseline is kept, so `Stop` still covers the whole task |
| `prompt`   | `UserPromptSubmit`               | clears the stop-loop state when a real human message arrives                     |
| `stop`     | `Stop`                           | eslint on changed files + typecheck, and a blocking self-check checklist         |

The checks themselves live in `.claude/hooks/check-rules.sh` and are shared: one
implementation of the rules, two dialect adapters. If that file is missing, the
adapter only prints the `docs/` listing and never blocks.

### What the adapter has to fix

These are DSH differences, not preferences:

1. **`stop_hook_active` is always `false`.** Claude sets it to `true` on a repeat
   stop; DSH does not, so an unconditionally blocking `Stop` hook would never let
   a turn end. The adapter keeps that state itself (a marker file per session) and
   emulates the field for the shared checks.
2. **Plain stdout is dropped on `SessionStart`.** DSH reads context only from
   `hookSpecificOutput.additionalContext`, so the listing is wrapped in JSON.
3. **`@path` includes are not expanded.** DSH loads `AGENTS.md` and `CLAUDE.md`,
   but treats `@docs/RULES.md` as plain text — the adapter names those files in
   the session-start context instead.
4. **`SubagentStop` is observe-only** (it cannot block or add context), so the
   event is deliberately absent from `hooks.json`. Subagents are not gated by the
   self-check.

`jq` is required, exactly as in the `.claude` hook; without it the hook disables
itself.

### The Node runtime the checks need

DSH starts the app with `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, where a Node runtime
usually is not present — and `eslint`/`tsc` are `#!/usr/bin/env node` shims. The
adapter therefore prepends the first standard location that has Node
(`/opt/homebrew/bin`, `/usr/local/bin`, the newest `~/.nvm/versions/node/*/bin`).
When none is found, the shared checks report
`skipped (no node runtime in PATH)` instead of a lint failure — link Node into one
of those paths (or launch the app from a shell that has it) to get the checks back.
The `.claude` hook reports the same `skipped` status when run without Node.

## Mounting it in a DSH profile

The hook config path is **process-level** — the bridge reads one file at startup —
so a profile points at this project (or at a router that dispatches per project).

Add the row to `$DSH_HOME/profiles/<profile>/cordis.patch.yml`. A new plugin must
go inside an `insert:` list; a bare row with an unknown `id` is only reported as a
warning and is never mounted:

```yaml
- insert:
    - id: hooks-claude-code
      name: '@deepseek-ai/dsh-hooks-claude-code'
      config:
        configPath: /absolute/path/to/project/.dsh/hooks/hooks.json
        defaultTimeoutMs: 300000
```

`${CLAUDE_PROJECT_DIR}` in the commands is replaced by the bridge and exported to
the hook process; it defaults to the session workspace, and the script also
derives the project root from its own location.

For one DSH installation across several repositories, point `configPath` at a
router config whose command locates `<project>/.dsh/hooks/check-rules.sh` (or
`<project>/.claude/hooks/check-rules.sh`) from the payload `cwd`.

## Skills

DSH scans `<project>/.dsh/skills` natively, so `.dsh/skills` is a symlink to
`.claude/skills` and the FSD skills (`/fsd-architecture`, `/scaffold-fsd-slice`,
`/fsd-review`, `/frontend-conventions`, `/fsd-with-nextjs`) stay a single copy.
The link is committed; if a checkout loses it, re-create it with:

```bash
bash ~/.dsh/bin/link-claude-skills.sh .
```

## Machine-level layer

`.dsh/global/` versions what normally sits in `$DSH_HOME`: the event router that
dispatches a hook event to the current project, the bridge config and the skills
linker. See [`.dsh/global/README.md`](global/README.md); `bash .dsh/global/install.sh`
installs it and prints the profile patch block.
