#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
exec bash scripts/prod.sh run --rm --no-deps backend php bin/console app:catalog:refresh "$@"
