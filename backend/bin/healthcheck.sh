#!/usr/bin/env bash
set -euo pipefail
URL="${1:-http://127.0.0.1:8001/api/markets}"
for i in {1..20}; do
  code=$(curl -s -L -o /dev/null -w '%{http_code}' "$URL" || true)
  if [ "$code" = "200" ]; then exit 0; fi
  sleep 0.5
done
echo "Healthcheck failed: $URL" >&2
exit 1
