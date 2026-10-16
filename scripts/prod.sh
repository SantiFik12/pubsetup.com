#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
exec docker compose --env-file "${PUBSETUP_ENV_FILE:-.env.production}" -f docker-compose.prod.yml "$@"
