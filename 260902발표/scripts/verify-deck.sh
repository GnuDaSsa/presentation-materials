#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/gnudas/Documents/동호회디엘씨"
DECK="$ROOT/DLC_AI동호회_1시간_브리핑.pptx"
PY="/Users/gnudas/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
SKILL="/Users/gnudas/.codex/plugins/cache/openai-primary-runtime/presentations/26.826.12353/skills/presentations"

test -s "$DECK"
file "$DECK" | grep -q 'Microsoft PowerPoint'

slide_count="$(unzip -Z1 "$DECK" | grep -E '^ppt/slides/slide[0-9]+\.xml$' | wc -l | tr -d ' ')"
notes_count="$(unzip -Z1 "$DECK" | grep -E '^ppt/notesSlides/notesSlide[0-9]+\.xml$' | wc -l | tr -d ' ')"
test "$slide_count" = "25"
test "$notes_count" = "25"

export RUNTIME_NODE="/Users/gnudas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
export RUNTIME_NODE_MODULES="/Users/gnudas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
export RUNTIME_BIN_DIR="/Users/gnudas/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override"
"$PY" "$SKILL/container_tools/slides_test.py" "$DECK"

echo "PASS: $slide_count slides, $notes_count speaker-note pages, no canvas overflow"
