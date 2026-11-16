#!/usr/bin/env bash
# Prototype only. Restart the local Norse-API v2 demo build on :8091 with the full pipeline:
# keyword + kNN (embeddings) + classifier. Secrets come from a private env file and are never printed.
#
#   prototype/live-api-restart.sh [secrets-file]     (default: ~/.config/c211/norse-demo.env)
#
# The secrets file holds plain KEY=value lines:
#   EMBEDDING_BASE_URL=...   EMBEDDING_MODEL=...   RUNPOD_API_KEY=...        (kNN; same values as prod Norse-API)
#   ML_BROKER_BASE_URL=...   ML_BROKER_API_KEY=...                         (optional: prod ml-broker, Argus L12)
# Without the ML_BROKER_* lines the local classifier on :8010 is used.
set -euo pipefail
SECRETS="${1:-$HOME/.config/c211/norse-demo.env}"
API_DIR=/Users/Wimbazu_1/02_Dev/04_c211/NorseApiWorktree-v2demo
LOG=/private/tmp/claude-501/-Users-Wimbazu-1-02-Dev-04-c211/a2835bf2-adbb-4b72-bca5-6425d71410bd/scratchpad/norseapi.log
TENANT=99ade58e-9758-41a6-a6be-8f0c5bf8c61b

[ -f "$SECRETS" ] || { echo "missing $SECRETS"; exit 1; }
set -a; . "$SECRETS"; set +a
for k in EMBEDDING_BASE_URL EMBEDDING_MODEL RUNPOD_API_KEY; do
  [ -n "${!k:-}" ] && echo "$k: set" || echo "$k: MISSING"
done
: "${ML_BROKER_BASE_URL:=http://127.0.0.1:8010}"
: "${ML_BROKER_API_KEY:=proto-local}"
case "$ML_BROKER_BASE_URL" in *127.0.0.1*) echo "classifier: local :8010";; *) echo "classifier: remote ml-broker";; esac

pid=$(lsof -tiTCP:8091 -sTCP:LISTEN || true); [ -n "$pid" ] && kill "$pid" && sleep 1
cd "$API_DIR"
V2_SEARCH_ENABLED=true PORT=8091 LOG_LEVEL=warn UMAMI_API_KEY=local-placeholder \
  ML_BROKER_BASE_URL="$ML_BROKER_BASE_URL" ML_BROKER_API_KEY="$ML_BROKER_API_KEY" \
  nohup node dist/main > "$LOG" 2>&1 &
for _ in $(seq 1 30); do lsof -tiTCP:8091 -sTCP:LISTEN >/dev/null && break; sleep 1; done
lsof -tiTCP:8091 -sTCP:LISTEN >/dev/null || { echo "API did not start; see $LOG"; exit 1; }
echo "API up on :8091"

# Read-back: the query that keyword-only ranks badly. With kNN, shelters should lead.
curl -s -m 30 -H "x-tenant-id: $TENANT" -H 'accept-language: en' \
  'http://127.0.0.1:8091/v2/search?query=i%20need%20a%20place%20to%20stay&coords=-76.1474,43.0481' |
  python3 -c 'import json,sys; d=json.load(sys.stdin); print("model:", d.get("model_version")); [print(" -", (h["_source"].get("service") or {}).get("name"), "|", (h["_source"].get("organization") or {}).get("name")) for h in d["search"]["hits"]["hits"][:5]]'
grep -i -E "embedding|runpod|ml.?broker|error" "$LOG" | sed -E 's/(key|token|bearer)[^ ]*/\1 <hidden>/Ig' | tail -5 || true
