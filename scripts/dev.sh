#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname -- "${BASH_SOURCE[0]}")/.."
docker compose build
docker compose up -d --wait postgres
docker compose run --rm migrate
docker compose up -d
