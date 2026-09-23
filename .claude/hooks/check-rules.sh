#!/bin/bash
# Claude Code hook: project rules, the docs/ folder, and a self-check before finishing.
#
#   check-rules.sh baseline   SessionStart (startup|clear) / SubagentStart:
#                             record the current code state so later checks only cover
#                             what the agent itself changed; print docs/ into context.
#   check-rules.sh context    SessionStart (resume|compact): print docs/ only. The
#                             baseline is deliberately NOT reset, so the Stop hook still
#                             reviews everything changed during the whole task.
#   check-rules.sh stop       Stop / SubagentStop: if code changed since the last check,
#                             run eslint on the changed files + a full typecheck, and
#                             block finishing until the self-check against docs/RULES.md
#                             is done.
#
# stdin: the hook JSON (session_id, agent_id, cwd, stop_hook_active, ...).
# stop output: {"decision":"block","reason":...} — the agent keeps working with `reason`.

set -u

MAX_LINT_RETRIES=2 # how many times a red lint/typecheck may block after the checklist
# Directories that hold first-party code. Non-existent entries are dropped, so the same
# hook works for this starter and for a monorepo derived from it.
CANDIDATE_PATHS=(src app server contracts apps packages services proxy.ts)

mode="${1:-stop}"
input="$(cat)"

# jq is required to read the hook payload and to emit a block decision.
if ! command -v jq >/dev/null 2>&1; then
  printf 'check-rules: jq not found — rule checks are disabled. Install jq (brew install jq).\n' >&2
  exit 0
fi

field() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }

cwd="$(field .cwd)"
if [ -n "$cwd" ]; then cd "$cwd" || exit 0; fi
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

CODE_PATHS=()
for p in "${CANDIDATE_PATHS[@]}"; do
  [ -e "$p" ] && CODE_PATHS+=("$p")
done
[ ${#CODE_PATHS[@]} -eq 0 ] && exit 0

session_id="$(field .session_id)"
agent_id="$(field .agent_id)"
key="${session_id:-nosession}${agent_id:+-$agent_id}"
state_dir="${TMPDIR:-/tmp}/claude-rules-check"
mkdir -p "$state_dir"
manifest_file="$state_dir/$key.manifest"
count_file="$state_dir/$key.count"
project_key="$(printf '%s' "$PWD" | shasum | cut -c1-12)"
docs_seen_file="$state_dir/$project_key.docs-seen"

# Prefer a locally installed binary; fall back to the package manager's runner.
resolve_bin() {
  if [ -x "./node_modules/.bin/$1" ]; then
    printf './node_modules/.bin/%s' "$1"
  elif command -v pnpm >/dev/null 2>&1; then
    printf 'pnpm exec %s' "$1"
  else
    printf ''
  fi
}

# ---------------------------------------------------------------------------
# docs/ is the source of project rules. Print the list and flag files that were
# not there last time: those must be read before the first edit. Templates under
# docs/_templates/ are scaffolding, not rules, so they stay out of the listing.
# ---------------------------------------------------------------------------
print_docs() {
  [ -d docs ] || return 0
  local current seen line
  current="$(find docs -maxdepth 2 -name '*.md' -type f -not -path 'docs/_templates/*' | sort)"
  [ -n "$current" ] || return 0
  seen="$(cat "$docs_seen_file" 2>/dev/null || true)"
  echo "Project rules and documentation (docs/):"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    if [ -n "$seen" ] && printf '%s\n' "$seen" | grep -qxF "$line"; then
      printf '  %s\n' "$line"
    else
      printf '  %s   <- NEW, read it before the first edit\n' "$line"
    fi
  done <<<"$current"
  echo "Order: CLAUDE.md -> docs/RULES.md -> docs/ARCHITECTURE.md -> docs/SYSTEM_OVERVIEW.md -> docs/DECISIONS.md; fixture data from docs/DEMO_DATA.md; before building a screen, docs/DESIGN.md and the mockup in docs/design/."
  printf '%s\n' "$current" >"$docs_seen_file"
}

# Manifest of uncommitted code changes: "path<TAB>content hash" (or deleted).
code_manifest() {
  {
    git diff --name-only HEAD -- "${CODE_PATHS[@]}" 2>/dev/null
    git ls-files --others --exclude-standard -- "${CODE_PATHS[@]}"
  } |
    sort -u | while IFS= read -r f; do
    if [ -f "$f" ]; then
      printf '%s\t%s\n' "$f" "$(git hash-object "$f")"
    else printf '%s\tdeleted\n' "$f"; fi
  done
}

save_checked() {
  code_manifest >"$manifest_file"
  rm -f "$count_file"
}

case "$mode" in
baseline)
  save_checked
  print_docs
  exit 0
  ;;
context)
  print_docs
  echo "Session refreshed: rebuild task state from git status / git diff, not from memory."
  exit 0
  ;;
esac

# No baseline (hook installed mid-session) — treat the current state as the starting point.
if [ ! -f "$manifest_file" ]; then
  save_checked
  exit 0
fi

current="$(code_manifest)"
last="$(cat "$manifest_file")"

# Nothing changed since the last check.
[ "$current" = "$last" ] && exit 0

# Files whose content changed since the last check (added or edited).
files="$(comm -13 <(printf '%s\n' "$last" | sort) <(printf '%s\n' "$current" | sort) | cut -f1 | grep -v '^$' | sort -u)"

if [ -z "$files" ]; then
  save_checked
  exit 0
fi
lint_files="$(printf '%s\n' "$files" | grep -E '\.(ts|tsx|mjs|js)$' | while IFS= read -r f; do [ -f "$f" ] && printf '%s\n' "$f"; done)"

lint_status="eslint: skipped (no eslint binary found)"
lint_rc=0
eslint_bin="$(resolve_bin eslint)"
if [ -z "$lint_files" ]; then
  lint_status="eslint: - (no changed .ts/.tsx)"
elif [ -n "$eslint_bin" ]; then
  lint_out="$(printf '%s\n' "$lint_files" | tr '\n' '\0' |
    xargs -0 $eslint_bin --max-warnings 0 --report-unused-disable-directives 2>&1)"
  lint_rc=$?
  if [ $lint_rc -ne 0 ]; then
    lint_status="eslint: FAILED — fix before finishing (RULES §14):
$(printf '%s\n' "$lint_out" | head -60)"
  else
    lint_status="eslint: ok (changed files)"
  fi
fi

tc_status="typecheck: skipped (no tsc binary / tsconfig.json)"
tc_rc=0
tsc_bin="$(resolve_bin tsc)"
if [ -n "$tsc_bin" ] && [ -f tsconfig.json ]; then
  tc_out="$($tsc_bin -p tsconfig.json --noEmit --pretty false 2>&1)"
  tc_rc=$?
  if [ $tc_rc -ne 0 ]; then
    tc_status="typecheck: FAILED — fix before finishing:
$(printf '%s\n' "$tc_out" | head -60)"
  else
    tc_status="typecheck: ok"
  fi
fi

# Closed-contour guard (RULES §12): first-party code must not reach out to a CDN,
# a font service or any other third-party origin at runtime or build time.
ext_status=""
ext_files="$(printf '%s\n' "$files" | grep -E '\.(ts|tsx|css|mjs|js)$' | while IFS= read -r f; do [ -f "$f" ] && printf '%s\n' "$f"; done)"
if [ -n "$ext_files" ]; then
  ext_hits="$(printf '%s\n' "$ext_files" | tr '\n' '\0' |
    xargs -0 grep -HnE "next/font/google|fonts\.(googleapis|gstatic)\.com|@import +url\(|https?://(cdn|unpkg|jsdelivr)" 2>/dev/null | head -20)"
  if [ -n "$ext_hits" ]; then
    ext_status="external resources: FOUND — self-host them (RULES §12):
$ext_hits"
  fi
fi

checks_ok=true
[ $lint_rc -eq 0 ] && [ $tc_rc -eq 0 ] || checks_ok=false

stop_hook_active="$(field .stop_hook_active)"

if [ "$stop_hook_active" != "true" ]; then
  # First stop after edits — full self-check checklist.
  rm -f "$count_file"
  reason="Task not finished yet: the check-rules hook requires a self-check against the project rules.

Files changed since the last check:
$files

Checklist:
1. Re-read docs/RULES.md — actually open the file, do not go from memory — and walk every changed file against it: FSD layers and barrel-only imports (§1) · root app/ stays routing-only (§2) · server-only code never reaches the client bundle (§3) · paths via RoutesPath, list state in searchParams (§4) · query keys carry entity + operation + normalized params, no module-scope QueryClient (§5) · client state lives in the slice's model (§6) · forms use react-hook-form + the same zod schema on the server (§7) · design tokens instead of hex, every state styled (§8) · no any, strict preserved (§9) · loading/error/empty handled, destructive actions confirmed (§10) · session and secrets rules (§11) · no external CDN/fonts/telemetry (§12) · one export per file, components decomposed (§16).
2. Project patterns, not your own: for a new view / entity / feature / form / table / modal, find the closest existing analogue in src/views, src/entities, src/features, src/widgets and match its structure, naming and markup. Deviate only for a reason — and then say what it was.
3. Reuse: for every new component / hook / helper, grep for an existing one first — src/shared/ui, src/shared/lib, entities/<x>/ui, src/features. A duplicate must be replaced by what already exists.
4. Documentation: if you introduced a rule, a library or a process change, update docs/RULES.md, .claude/stack.md or docs/DECISIONS.md (§17).
5. Checks already run by this hook:
$lint_status
$tc_status${ext_status:+
$ext_status}
6. Fix what you found. If part of the diff is not yours (hand-edited), check only your own and say so. In the final answer, briefly: what you checked, what you fixed, which existing components/utilities you reused."
  jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
  exit 0
fi

# Second stop, after the self-check.
if $checks_ok; then
  save_checked
  exit 0
fi

count=$(($(cat "$count_file" 2>/dev/null || echo 0) + 1))
if [ "$count" -gt "$MAX_LINT_RETRIES" ]; then
  save_checked
  jq -n --arg msg "check-rules: lint/typecheck still red after $MAX_LINT_RETRIES attempts — automatic checking stopped, look at it by hand." '{systemMessage: $msg}'
  exit 0
fi
printf '%s' "$count" >"$count_file"

reason="Checks still do not pass — without a green lint/typecheck the task is not done (RULES §14). Attempt $count of $MAX_LINT_RETRIES.
$lint_status
$tc_status"
jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
exit 0
