#!/bin/bash
# Связывает навыки Claude Code проекта с DSH: <проект>/.dsh/skills -> .claude/skills
# Использование: bash link-claude-skills.sh [путь-к-проекту]   (по умолчанию — cwd)
set -eu

dir="${1:-$PWD}"
dir="$(cd "$dir" && pwd)"

if [ ! -d "$dir/.claude/skills" ]; then
  echo "нет каталога $dir/.claude/skills — нечего связывать" >&2
  exit 1
fi

mkdir -p "$dir/.dsh"

if [ -L "$dir/.dsh/skills" ]; then
  echo "уже связано: $dir/.dsh/skills -> $(readlink "$dir/.dsh/skills")"
  exit 0
fi

if [ -e "$dir/.dsh/skills" ]; then
  echo "$dir/.dsh/skills уже существует и не является симлинком — оставляю как есть" >&2
  exit 1
fi

ln -s ../.claude/skills "$dir/.dsh/skills"
echo "готово: $dir/.dsh/skills -> ../.claude/skills"
ls -1 "$dir/.claude/skills"
