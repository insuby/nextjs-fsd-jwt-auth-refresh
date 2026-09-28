#!/bin/bash
# ---------------------------------------------------------------------------
# Установка глобального слоя DSH в $DSH_HOME (по умолчанию ~/.dsh):
#
#   hooks/dsh-hook.sh         маршрутизатор событий: находит хук текущего проекта
#                             и приводит его ответ к формату DSH
#   hooks/claude-hooks.json   конфиг для плагина @deepseek-ai/dsh-hooks-claude-code
#   hooks/check-rules.sh      запасной хук для проектов без своего скрипта
#   bin/link-claude-skills.sh связывает <проект>/.dsh/skills с .claude/skills
#
# Существующие файлы сохраняются как <имя>.bak-<время>. Патч профиля не правится:
# установщик печатает готовый блок для
# $DSH_HOME/profiles/<профиль>/cordis.patch.yml.
#
# Использование:  bash install.sh
#                 DSH_HOME=/путь bash install.sh
# ---------------------------------------------------------------------------
set -eu

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
src="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
stamp="$(date +%s)"

if ! command -v jq >/dev/null 2>&1; then
  echo "внимание: jq не найден — хуки будут отключаться сами (brew install jq)" >&2
fi

mkdir -p "$DSH_HOME/hooks" "$DSH_HOME/bin"

# copy <исходник> <назначение> <права>
copy() {
  local from="$1" to="$2" mode="$3" backup
  if [ -f "$to" ] && cmp -s "$from" "$to"; then
    echo "без изменений: $to"
  else
    if [ -f "$to" ]; then
      backup="$to.bak-$stamp"
      cp "$to" "$backup"
      echo "бэкап: $backup"
    fi
    cp "$from" "$to"
    echo "установлено: $to"
  fi
  chmod "$mode" "$to"
}

copy "$src/hooks/dsh-hook.sh" "$DSH_HOME/hooks/dsh-hook.sh" 755
copy "$src/hooks/check-rules.sh" "$DSH_HOME/hooks/check-rules.sh" 755
copy "$src/bin/link-claude-skills.sh" "$DSH_HOME/bin/link-claude-skills.sh" 755

# claude-hooks.json — шаблон: путь к маршрутизатору подставляется здесь, потому что
# плагин разворачивает в командах только ${CLAUDE_PROJECT_DIR} и ${CLAUDE_PLUGIN_ROOT}.
hooks_json="$DSH_HOME/hooks/claude-hooks.json"
rendered="$(sed "s|__DSH_HOOKS_DIR__|$DSH_HOME/hooks|g" "$src/hooks/claude-hooks.json")"
if [ -f "$hooks_json" ] && [ "$(cat "$hooks_json")" = "$rendered" ]; then
  echo "без изменений: $hooks_json"
else
  if [ -f "$hooks_json" ]; then
    cp "$hooks_json" "$hooks_json.bak-$stamp"
    echo "бэкап: $hooks_json.bak-$stamp"
  fi
  printf '%s\n' "$rendered" >"$hooks_json"
  echo "установлено: $hooks_json"
fi
chmod 644 "$hooks_json"

cat <<EOF

Дальше — один раз на профиль DSH. Добавь в
$DSH_HOME/profiles/<профиль>/cordis.patch.yml:

- insert:
    - id: hooks-claude-code
      name: '@deepseek-ai/dsh-hooks-claude-code'
      config:
        configPath: $hooks_json
        defaultTimeoutMs: 300000

Запись обязана лежать внутри insert: — строка с неизвестным id только
предупреждает и не монтируется. Конфиг читается один раз при старте процесса,
поэтому он один на все проекты: маршрутизатор сам находит хук текущего проекта
(<проект>/.dsh/hooks/check-rules.sh, затем <проект>/.claude/hooks/check-rules.sh).
EOF
