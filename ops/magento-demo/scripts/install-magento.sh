#!/bin/sh
set -eu
cd /var/www/html
umask 0022
# Allow Magento to generate missing proxies while installing or resuming setup,
# even when a previous attempt already wrote production mode into env.php.
export MAGE_MODE=default

refresh_generated_autoload() {
    # Composer/sample-data operations can leave classmap and DI cache entries
    # pointing at generated classes which have already been removed.
    # Only disposable generated code and caches are removed; DB/media stay intact.
    mkdir -p generated/code generated/metadata var/cache var/page_cache var/di
    find generated/code generated/metadata var/cache var/page_cache var/di \
        -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    composer dump-autoload --no-dev --optimize --no-scripts --no-plugins --no-interaction
}
if [ ! -f composer.json ]; then
    if [ -n "$(ls -A .)" ]; then
        echo 'The app directory is not empty; refusing to overwrite it.' >&2
        exit 1
    fi
    composer create-project --no-dev --prefer-dist --no-interaction \
        --repository-url=https://repo.magento.com/ \
        magento/project-community-edition /tmp/magento "$MAGENTO_VERSION"
    cp -a /tmp/magento/. .
fi
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
refresh_generated_autoload
if [ ! -d vendor/magento/module-catalog-sample-data ]; then
    php bin/magento sampledata:deploy --no-interaction
    composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
    refresh_generated_autoload
fi
if [ ! -f app/etc/env.php ]; then
    php bin/magento setup:install \
      --base-url="https://${DOMAIN}/" --base-url-secure="https://${DOMAIN}/" \
      --use-secure=1 --use-secure-admin=1 --use-rewrites=1 \
      --db-host=mariadb --db-name="$MYSQL_DATABASE" --db-user="$MYSQL_USER" \
      --db-password="$MYSQL_PASSWORD" \
      --backend-frontname="$MAGENTO_BACKEND_FRONTNAME" \
      --admin-firstname="$MAGENTO_ADMIN_FIRSTNAME" --admin-lastname="$MAGENTO_ADMIN_LASTNAME" \
      --admin-email="$MAGENTO_ADMIN_EMAIL" --admin-user="$MAGENTO_ADMIN_USER" \
      --admin-password="$MAGENTO_ADMIN_PASSWORD" \
      --language=en_US --currency=USD --timezone=Europe/Warsaw \
      --search-engine=opensearch --opensearch-host=opensearch --opensearch-port=9200
else
    php bin/magento setup:upgrade
fi
# Magento 2.4.8 uses the Redis CLI names for the Valkey-compatible protocol.
php bin/magento setup:config:set --no-interaction --cache-backend=redis --cache-backend-redis-server=valkey --cache-backend-redis-db=0
php bin/magento setup:config:set --no-interaction --page-cache=redis --page-cache-redis-server=valkey --page-cache-redis-db=1
php bin/magento setup:config:set --no-interaction --session-save=redis --session-save-redis-host=valkey --session-save-redis-db=2
php bin/magento setup:config:set --no-interaction --http-cache-hosts=varnish:80
php bin/magento config:set web/unsecure/base_url "https://${DOMAIN}/"
php bin/magento config:set web/secure/base_url "https://${DOMAIN}/"
php bin/magento config:set web/secure/use_in_frontend 1
php bin/magento config:set web/secure/use_in_adminhtml 1
php bin/magento config:set web/secure/offloader_header X-Forwarded-Proto
php bin/magento config:set web/cookie/cookie_domain "$DOMAIN"
php bin/magento config:set design/search_engine_robots/default_robots NOINDEX,NOFOLLOW
php bin/magento config:set system/smtp/disable 1
php bin/magento config:set admin/usage/enabled 0
php bin/magento config:set system/full_page_cache/caching_application 2
php bin/magento config:set system/full_page_cache/varnish/backend_host nginx
php bin/magento config:set system/full_page_cache/varnish/backend_port 80
php bin/magento maintenance:enable
mkdir -p app/code/Pubsetup/Demo
cp -R /demo-module/. app/code/Pubsetup/Demo/
php bin/magento module:enable Pubsetup_Demo
php bin/magento setup:upgrade
php /tools/configure-demo.php
php bin/magento deploy:mode:set production --skip-compilation
php bin/magento setup:di:compile
php bin/magento setup:static-content:deploy -f en_US --jobs=1
php bin/magento indexer:set-mode schedule
php bin/magento indexer:reindex
php bin/magento cache:flush
php bin/magento maintenance:disable
chmod 640 app/etc/env.php
