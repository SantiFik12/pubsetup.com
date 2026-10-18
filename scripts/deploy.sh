#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
bash scripts/prod.sh config --quiet
bash scripts/prod.sh build backend frontend
bash scripts/prod.sh up -d --wait postgres
bash scripts/prod.sh run --rm --no-deps migrate
bash scripts/prod.sh run --rm --no-deps migrate php bin/console app:seo:refresh
bash scripts/prod.sh up -d --no-build --wait --wait-timeout 180
bash scripts/prod.sh ps
printf '%s\n' 'Run python3 scripts/smoke.py against the configured HTTP_PORT, then check public HTTPS.'
