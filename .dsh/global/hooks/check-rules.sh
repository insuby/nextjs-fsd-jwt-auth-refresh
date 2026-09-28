#!/bin/bash
# Глобальный запасной хук DSH: работает, когда в проекте нет своего
# .claude/hooks/check-rules.sh. Ничего не блокирует — только печатает на
# SessionStart список документации проекта, чтобы агент прочитал правила до
# первой правки (та же конвенция, что в med-financial / nextjs-проектах).
# Удали этот файл, если такое поведение не нужно.
set -u

mode="${1:-stop}"
input="$(cat)"
[ "$mode" = "stop" ] && exit 0

cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null
[ -d docs ] || exit 0

echo "Правила и документация проекта (docs/):"
find docs -maxdepth 2 -name '*.md' -type f 2>/dev/null | sort | sed 's/^/  /'
echo "Порядок: CLAUDE.md/AGENTS.md → docs/STATUS.md → docs/RULES.md → docs/ARCHITECTURE.md → остальные. Прочитать до первой правки."
exit 0
