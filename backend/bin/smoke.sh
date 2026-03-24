#!/usr/bin/env bash
set -euo pipefail
H="http://127.0.0.1:8001"

# Give app a moment
sleep 1

curl -fsS "$H/openapi.json" >/dev/null

# stats-list must be an array
body=$(curl -fsS "$H/api/markets/stats-list?limit=3")
# cheap shape check without jq dependency: first non-space char must be '['
first=$(printf "%s" "$body" | tr -d '\r\n' | sed -E 's/^[[:space:]]*//; s/(.).*/\1/')
if [ "$first" != "[" ]; then
  echo "[smoke] /api/markets/stats-list not array. Body: $body" >&2
  exit 3
fi

echo "[smoke] OK"
