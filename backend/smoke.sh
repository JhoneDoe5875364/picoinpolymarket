#!/usr/bin/env bash
set -euo pipefail
API=http://127.0.0.1:8001
KEY=Auston34

echo "== health =="
curl -sS "$API/api/health" | jq .

echo "== unresolved (admin) =="
UNRES_JSON="$(curl -sS -H "X-API-Key: $KEY" "$API/api/admin/markets/unresolved")"
COUNT="$(jq -r '.items | length // 0' <<<"$UNRES_JSON")"
echo "count=$COUNT"
if [[ "$COUNT" -gt 0 ]]; then
  jq -r '.items[0]' <<<"$UNRES_JSON"
else
  echo "(no unresolved markets to list)"
fi

MID="$(jq -r '.items[0].id // empty' <<<"$UNRES_JSON")"
if [[ -n "${MID:-}" ]]; then
  echo "== resolve first -> yes =="
  curl -sS -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
    -X POST -d '{"outcome":"yes"}' \
    "$API/api/admin/markets/$MID/resolve" | jq .

  echo "== detail after resolve =="
  curl -sS "$API/api/markets/$MID" | jq '{id,status,resolved,outcome}'
else
  echo "(no unresolved markets to resolve)"
fi
