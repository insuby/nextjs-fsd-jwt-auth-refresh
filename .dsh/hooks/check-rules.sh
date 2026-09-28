#!/bin/bash
# DeepSeek Harness adapter for the project rule checks.
#
# DSH runs Claude Code command hooks through the `dsh-hooks-claude-code` bridge,
# but four protocol details differ, so the `.claude` hook cannot be mounted
# as-is. This script closes those gaps and delegates the checks themselves to
# `.claude/hooks/check-rules.sh` — one implementation of the checks, two
# dialect adapters.
#
#   check-rules.sh baseline   SessionStart (startup|clear): record the baseline
#                             and put the docs/ listing into context.
#   check-rules.sh context    SessionStart (resume|compact): docs/ listing only;
#                             the baseline is kept so Stop still covers the task.
#   check-rules.sh prompt     UserPromptSubmit: clear the stop-loop state when a
#                             real human message arrives (the bridge re-submits
#                             the blocking reason as a prompt, and that must not
#                             count as one).
#   check-rules.sh stop       Stop: delegate the checks, pass the decision
#                             through, and keep the loop state DSH cannot.
#
# DSH differences handled here:
#
#   1. `stop_hook_active` is always false (Claude sets true on a repeat stop), so
#      an unconditionally blocking Stop hook would never let the turn end. The
#      state is kept here: the previous stop was blocked -> this one is the
#      self-check pass, and `stop_hook_active` is emulated as true.
#   2. Plain stdout from SessionStart is dropped: DSH reads context only from
#      `hookSpecificOutput.additionalContext`, so the listing is wrapped in JSON.
#   3. `@path` includes in CLAUDE.md/AGENTS.md are not expanded by DSH, so the
#      files they name are announced explicitly at session start.
#   4. `SubagentStop` is observe-only in DSH (it cannot block), so it is not
#      wired in `.dsh/hooks/hooks.json` at all.

set -u

mode="${1:-stop}"
input="$(cat)"

# jq reads the hook payload and emits the block decision; without it the hook
# disables itself rather than failing the turn.
if ! command -v jq >/dev/null 2>&1; then
  printf 'check-rules: jq not found — rule checks are disabled. Install jq (brew install jq).\n' >&2
  exit 0
fi

field() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }

# The script lives in <project>/.dsh/hooks, so the project root is two levels up.
# That is more reliable than the payload cwd, which is the session workspace and
# may be a subdirectory of the repository.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(dirname "$(dirname "$script_dir")")"
cd "$project_dir" || exit 0
export CLAUDE_PROJECT_DIR="$project_dir"

checks_script="$project_dir/.claude/hooks/check-rules.sh"

event="$(field .hook_event_name)"
[ -n "$event" ] || event=SessionStart
session_id="$(field .session_id)"
state_dir="${TMPDIR:-/tmp}/dsh-rules-check"
mkdir -p "$state_dir" 2>/dev/null
key="${session_id:-nosession}"
blocked_file="$state_dir/$key.blocked"
reason_file="$state_dir/$key.reason"

# ---------------------------------------------------------------------------
# docs/ is the source of project rules. Used only when the .claude hook (which
# owns the full listing with new-file flags) is not present.
# ---------------------------------------------------------------------------
print_docs() {
  [ -d docs ] || return 0
  echo "Project rules and documentation (docs/):"
  find docs -maxdepth 2 -name '*.md' -type f -not -path 'docs/_templates/*' 2>/dev/null |
    sort | sed 's/^/  /'
  echo "Order: AGENTS.md/CLAUDE.md -> docs/RULES.md -> docs/ARCHITECTURE.md -> docs/DECISIONS.md; read before the first edit (RULES §17)."
}

# DSH does not expand the @-includes of CLAUDE.md/AGENTS.md; name the files that
# exist so they are read before the first edit.
includes_notice() {
  local found="" inc
  while IFS= read -r inc; do
    [ -n "$inc" ] || continue
    [ -f "$project_dir/$inc" ] && found="${found}${found:+, }$inc"
  done <<<"$(
    for f in "$project_dir/CLAUDE.md" "$project_dir/AGENTS.md"; do
      [ -f "$f" ] || continue
      grep -oE '^[[:space:]]*@[^[:space:]]+' "$f" 2>/dev/null | sed 's/^[[:space:]]*@//'
    done | grep -E '\.md$|/' | grep -vE '^(AGENTS|CLAUDE)(\.local)?\.md$' | sort -u
  )"
  [ -n "$found" ] &&
    printf 'Included through @ in CLAUDE.md/AGENTS.md (DSH does not expand @ — read before the first edit): %s' "$found"
}

emit_context() {
  [ -n "$1" ] || return 0
  jq -n --arg e "$event" --arg ctx "$1" \
    '{hookSpecificOutput: {hookEventName: $e, additionalContext: $ctx}}'
}

# --- UserPromptSubmit: reset the stop-loop state on a real human message -----
if [ "$mode" = "prompt" ]; then
  prompt="$(field .prompt)"
  last_reason="$(cat "$reason_file" 2>/dev/null || true)"
  if [ -z "$last_reason" ] || [ "$prompt" != "$last_reason" ]; then
    rm -f "$blocked_file" "$reason_file"
  fi
  exit 0
fi

# --- SessionStart: context only, never a decision ---------------------------
case "$mode" in
baseline | context)
  inner=""
  if [ -f "$checks_script" ]; then
    inner="$(printf '%s' "$input" | bash "$checks_script" "$mode" 2>/dev/null)"
  else
    inner="$(print_docs)"
  fi
  notice="$(includes_notice)"
  context="$inner"
  if [ -n "$notice" ]; then
    if [ -n "$context" ]; then context="$notice
$context"; else context="$notice"; fi
  fi
  emit_context "$context"
  exit 0
  ;;
esac

# --- Stop -------------------------------------------------------------------
# Nothing to check against without the project's own hook implementation.
[ -f "$checks_script" ] || exit 0

# Emulate stop_hook_active unless the caller already did (the bridge router set
# it from its own state, and then this file must not contradict it).
payload="$input"
if [ -f "$blocked_file" ]; then
  rewritten="$(printf '%s' "$input" | jq -c '.stop_hook_active = true' 2>/dev/null)"
  [ -n "$rewritten" ] && payload="$rewritten"
fi

out="$(printf '%s' "$payload" | bash "$checks_script" stop 2>/dev/null)"

decision=""
reason=""
if printf '%s' "$out" | grep -q '^[[:space:]]*{'; then
  decision="$(printf '%s' "$out" | jq -r '.decision // empty' 2>/dev/null)"
  reason="$(printf '%s' "$out" | jq -r '.reason // empty' 2>/dev/null)"
  printf '%s\n' "$out"
fi

# Keep the state for the next stop: blocked — the agent is inside the self-check
# pass now; allowed — the loop ended.
if [ "$decision" = "block" ]; then
  : >"$blocked_file"
  printf '%s' "$reason" >"$reason_file"
else
  rm -f "$blocked_file" "$reason_file"
fi

exit 0
