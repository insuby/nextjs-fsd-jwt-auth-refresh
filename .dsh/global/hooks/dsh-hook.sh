#!/bin/bash
# ---------------------------------------------------------------------------
# DSH-мост: запускает хуки проекта, написанные для Claude Code.
#
# Подключается плагином @deepseek-ai/dsh-hooks-claude-code (см. claude-hooks.json
# рядом) на события SessionStart / UserPromptSubmit / Stop / SubagentStart /
# SubagentStop. На stdin приходит JSON хука в формате Claude Code:
#   session_id, transcript_path, cwd, hook_event_name, source|stop_hook_active|...
#
# Что делает мост, потому что DSH отличается от Claude Code:
#
#   1. stop_hook_active. DSH всегда передаёт false (в Claude — true на повторной
#      остановке). Без эмуляции Stop-хук проекта блокировал бы завершение
#      бесконечно. Здесь состояние ведётся по факту: если прошлая остановка была
#      ЗАБЛОКИРОВАНА, значит агент сейчас внутри самопроверки и получает
#      stop_hook_active=true; если прошлая остановка была разрешена — false
#      (первая остановка после работы -> чек-лист).
#      Отдельно обрабатывается случай прерывания пользователем: если на
#      UserPromptSubmit пришёл текст, не совпадающий с нашим последним reason,
#      значит это настоящее сообщение человека — состояние сбрасывается.
#   2. Голый stdout хука. В Claude stdout SessionStart попадает в контекст, в DSH
#      читается только hookSpecificOutput.additionalContext — поэтому вывод
#      скрипта заворачивается в этот JSON.
#   3. SubagentStop в DSH наблюдательное: решение скрипта проигнорируется,
#      поэтому по умолчанию событие пропускается (DSH_HOOKS_RUN_SUBAGENT_STOP=1
#      включает запуск ради проверок).
#   4. Скрипт ищется от cwd вверх по дереву: <проект>/.dsh/hooks/check-rules.sh
#      (DSH-нативный адаптер), затем <проект>/.claude/hooks/check-rules.sh
#      (как было в Claude), затем глобальный $DSH_HOOKS_DIR/check-rules.sh. Нет
#      скрипта — нет хуков (opt-in как раньше). Скрипт всегда запускается из
#      корня проекта, поэтому сессия, открытая в подкаталоге, проверяется теми
#      же путями, что и раньше.
#   5. Если скрипт вернул hookSpecificOutput (DSH-нативный адаптер сам формирует
#      контекст), вывод отдаётся как есть, а не заворачивается в additionalContext.
#
# Режим скрипта: SessionStart(startup)->baseline, SessionStart(иначе)->context,
# SubagentStart->baseline, Stop->stop.
# ---------------------------------------------------------------------------
set -u

DSH_HOOKS_DIR="${DSH_HOOKS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
STATE_DIR="${TMPDIR:-/tmp}/dsh-claude-hooks"
mkdir -p "$STATE_DIR" 2>/dev/null

input="$(cat)"
field() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }

event="$(field .hook_event_name)"
cwd="$(field .cwd)"
session="$(field .session_id)"
source_kind="$(field .source)"
key="${session:-nosession}"
blocked_file="$STATE_DIR/$key.blocked"
reason_file="$STATE_DIR/$key.reason"

# --- UserPromptSubmit: сброс состояния, если это настоящее сообщение ---------
if [ "$event" = "UserPromptSubmit" ]; then
  prompt="$(field .prompt)"
  last_reason="$(cat "$reason_file" 2>/dev/null)"
  if [ -z "$last_reason" ] || [ "$prompt" != "$last_reason" ]; then
    rm -f "$blocked_file" "$reason_file"
  fi
  exit 0
fi

if [ "$event" = "SubagentStop" ] && [ "${DSH_HOOKS_RUN_SUBAGENT_STOP:-0}" != "1" ]; then
  exit 0
fi

case "$event" in
  SessionStart)
    if [ -z "$source_kind" ] || [ "$source_kind" = "startup" ]; then mode=baseline; else mode=context; fi ;;
  SubagentStart) mode=baseline ;;
  Stop|SubagentStop) mode=stop ;;
  *) exit 0 ;;
esac

# --- поиск корня проекта и скрипта (от cwd вверх) ---------------------------
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null
script=""
project_dir=""
dir="$cwd"
depth=0
home_dir="${HOME:-}"
while [ -n "$dir" ] && [ "$dir" != "/" ] && [ "$depth" -lt 8 ]; do
  # Выше домашней папки не поднимаемся: иначе глобальный
  # ~/.dsh/hooks/check-rules.sh нашёлся бы как «хук проекта».
  if [ "$depth" -gt 0 ] && [ "$dir" = "$home_dir" ]; then break; fi
  if [ -f "$dir/.dsh/hooks/check-rules.sh" ]; then
    script="$dir/.dsh/hooks/check-rules.sh"; project_dir="$dir"; break
  fi
  if [ -f "$dir/.claude/hooks/check-rules.sh" ]; then
    script="$dir/.claude/hooks/check-rules.sh"; project_dir="$dir"; break
  fi
  dir="$(dirname "$dir")"
  depth=$((depth + 1))
done
if [ -z "$script" ] && [ -f "$DSH_HOOKS_DIR/check-rules.sh" ]; then
  # Запасной глобальный хук: корнем считаем корень git-репозитория, иначе cwd.
  script="$DSH_HOOKS_DIR/check-rules.sh"
  project_dir="$(git rev-parse --show-toplevel 2>/dev/null)"
  [ -n "$project_dir" ] || project_dir="$cwd"
fi
[ -n "$script" ] || exit 0

# Корень проекта — рабочая папка скрипта (в Claude это CLAUDE_PROJECT_DIR).
[ -n "$project_dir" ] && cd "$project_dir" 2>/dev/null
export CLAUDE_PROJECT_DIR="$project_dir"

# --- эмуляция stop_hook_active ---------------------------------------------
payload="$input"
if [ -n "$project_dir" ] && [ "$project_dir" != "$cwd" ]; then
  rewritten="$(printf '%s' "$input" | jq -c --arg c "$project_dir" '.cwd = $c' 2>/dev/null)"
  [ -n "$rewritten" ] && payload="$rewritten"
fi
if [ "$mode" = "stop" ] && [ -f "$blocked_file" ]; then
  rewritten="$(printf '%s' "$payload" | jq -c '.stop_hook_active = true' 2>/dev/null)"
  [ -n "$rewritten" ] && payload="$rewritten"
fi

# --- запуск ----------------------------------------------------------------
err_file="$STATE_DIR/$$.err"
out="$(printf '%s' "$payload" | bash "$script" "$mode" 2>"$err_file")"
rc=$?
err="$(cat "$err_file" 2>/dev/null)"
rm -f "$err_file"

# --- трансляция ответа в формат DSH ----------------------------------------
case "$event" in
  SessionStart|SubagentStart)
    # Claude разворачивает строки вида `@docs/RULES.md` в CLAUDE.md сам, DSH — нет.
    # Поэтому перечисляем такие файлы в контексте, чтобы агент прочитал их до правок.
    includes="$(for f in "$project_dir/CLAUDE.md" "$project_dir/AGENTS.md"; do
      [ -f "$f" ] || continue
      grep -oE '^[[:space:]]*@[^[:space:]]+' "$f" 2>/dev/null | sed 's/^[[:space:]]*@//'
    done | grep -E '\.md$|/' | grep -vE '^(AGENTS|CLAUDE)(\.local)?\.md$' | sort -u)"
    notice=""
    if [ -n "$includes" ]; then
      found=""
      while IFS= read -r inc; do
        [ -n "$inc" ] || continue
        [ -f "$project_dir/$inc" ] && found="${found}${found:+, }$inc"
      done <<< "$includes"
      [ -n "$found" ] && notice="Подключено через @ в CLAUDE.md/AGENTS.md (DSH не разворачивает @ сам — прочитай до первой правки): $found"
    fi

    # DSH-нативный скрипт формирует контекст сам (включая напоминание про @) —
    # его hookSpecificOutput отдаётся как есть: заворачивать его в
    # additionalContext нельзя, иначе агент увидит JSON как текст.
    if printf '%s' "$out" | jq -e '.hookSpecificOutput' >/dev/null 2>&1; then
      printf '%s\n' "$out"
      exit 0
    fi

    ctx="$out"
    if [ -n "$notice" ]; then
      if [ -n "$ctx" ]; then ctx="$notice
$ctx"; else ctx="$notice"; fi
    fi
    if [ -n "$ctx" ]; then
      jq -n --arg e "$event" --arg ctx "$ctx" \
        '{hookSpecificOutput: {hookEventName: $e, additionalContext: $ctx}}'
    fi
    ;;

  Stop|SubagentStop)
    decision=""
    reason=""
    if printf '%s' "$out" | grep -q '^[[:space:]]*{'; then
      # Скрипт вернул JSON Claude Code — DSH понимает decision/reason как есть.
      decision="$(printf '%s' "$out" | jq -r '.decision // empty' 2>/dev/null)"
      reason="$(printf '%s' "$out" | jq -r '.reason // empty' 2>/dev/null)"
      printf '%s\n' "$out"
    elif [ "$rc" -eq 2 ] && [ -n "$err" ]; then
      decision=block
      reason="$err"
      jq -n --arg r "$err" '{decision: "block", reason: $r}'
    fi

    # Состояние для следующей остановки: блокировали — агент внутри
    # самопроверки (там stop_hook_active=true), разрешили — цикл закончился.
    if [ "$decision" = "block" ]; then
      : > "$blocked_file"
      printf '%s' "$reason" > "$reason_file"
    else
      rm -f "$blocked_file" "$reason_file"
    fi
    ;;
esac
exit 0
