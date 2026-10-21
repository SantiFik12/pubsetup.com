#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
if [[ ! -f .env ]]; then
    printf '%s\n' 'Run bash scripts/init.sh first.' >&2
    exit 1
fi
docker compose config --quiet
docker compose build php
docker compose up -d --wait --wait-timeout 300 mariadb valkey opensearch
docker compose run --rm --no-deps --user root cli sh -ec \
    'chown -R www-data:www-data /var/www/html /var/www/.composer'
docker compose run --rm --no-deps cli php /tools/composer-auth.php
docker compose run --rm --no-deps cli sh /tools/install-magento.sh
docker compose up -d php nginx
vcl_file="$(mktemp varnish/generated-XXXXXX.vcl)"
trap 'rm -f -- "$vcl_file"' EXIT
docker compose run --rm --no-deps -T cli php bin/magento varnish:vcl:generate \
    --export-version=7 --backend-host=nginx --backend-port=80 --access-list=php > "$vcl_file"
if ! grep -q '^vcl ' "$vcl_file"; then
    printf '%s\n' 'VCL generation failed; bootstrap configuration kept.' >&2
    exit 1
fi
chmod 644 "$vcl_file"
mv -- "$vcl_file" varnish/default.vcl
trap - EXIT
docker compose up -d php nginx varnish cron
docker compose restart php varnish
docker compose ps
printf '%s\n' 'Magento is installed. Admin URL, user and password are in .env.'
