#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
if [[ ! -f app/app/etc/env.php ]]; then
    printf '%s\n' 'Install Magento first with bash scripts/install.sh.' >&2
    exit 1
fi
# Validate before maintenance. Failure later intentionally leaves maintenance enabled.
docker compose config --quiet
docker compose run --rm --no-deps cli php -r '
$p = getenv("DEMO_VIEWER_PASSWORD") ?: "";
if (strlen($p) < 12 || !preg_match("/[a-z]/", $p) || !preg_match("/[A-Z]/", $p) || !preg_match("/[0-9]/", $p)) {
    fwrite(STDERR, "Set DEMO_VIEWER_PASSWORD in .env (12+ characters, upper/lowercase and number).\n"); exit(1);
}'
docker compose run --rm --no-deps cli sh -ec '
php bin/magento maintenance:enable
mkdir -p app/code/Pubsetup/Demo
cp -R /demo-module/. app/code/Pubsetup/Demo/
php bin/magento module:enable Pubsetup_Demo
php bin/magento setup:upgrade
php bin/magento config:set system/smtp/disable 1
php /tools/configure-demo.php
php bin/magento setup:di:compile
php bin/magento setup:static-content:deploy -f en_US --jobs=1
php bin/magento cache:flush
'
# Restart before reopening: OPcache timestamps are disabled in the demo PHP image.
docker compose restart php cron
docker compose run --rm --no-deps cli php bin/magento maintenance:disable
printf '%s\n' 'Demo protections installed. Validate the access matrix in README.md before publishing the admin link.'
