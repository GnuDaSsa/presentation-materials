#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check html-deck/deck.js
node scripts/verify-html-deck.mjs
