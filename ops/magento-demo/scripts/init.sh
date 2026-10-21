#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
umask 077
if [[ -e .env ]]; then
    printf '%s\n' '.env already exists; kept unchanged.'
    exit 0
fi
mkdir -p app backups
chmod 755 app
chmod 700 backups
admin_password="$(openssl rand -hex 16)Aa1!"
cat > .env <<EOF
COMPOSE_PROJECT_NAME=magento-demo
DOMAIN=magento.pubsetup.com
MAGENTO_VERSION=2.4.8-p5
MYSQL_DATABASE=magento
MYSQL_USER=magento
MYSQL_PASSWORD=$(openssl rand -hex 24)
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)
MAGENTO_BACKEND_FRONTNAME=admin_$(openssl rand -hex 6)
MAGENTO_ADMIN_USER=demo_admin
MAGENTO_ADMIN_PASSWORD=${admin_password}
MAGENTO_ADMIN_EMAIL=contact@pubsetup.com
MAGENTO_ADMIN_FIRSTNAME=Demo
MAGENTO_ADMIN_LASTNAME=Admin
EOF
printf '%s\n' 'Created .env with generated passwords. Review it with nano .env before installation.'
