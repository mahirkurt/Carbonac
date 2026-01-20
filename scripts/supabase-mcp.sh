#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set. Provide a Postgres connection string." >&2
  exit 1
fi

exec npx -y @modelcontextprotocol/server-postgres "$SUPABASE_DB_URL"
