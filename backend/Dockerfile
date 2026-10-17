FROM php:8.4-fpm-alpine AS base
WORKDIR /app
RUN apk add --no-cache libpq-dev libxml2-dev fcgi && docker-php-ext-install pdo_pgsql opcache dom
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader
COPY . .
COPY docker/uploads.ini /usr/local/etc/php/conf.d/zz-uploads.ini
RUN composer dump-autoload --optimize --no-scripts && mkdir -p var/cache var/log var/storage/modules && chown -R www-data:www-data var

FROM base AS development
USER www-data
CMD ["php-fpm", "-F"]

FROM base AS production
ENV APP_ENV=prod APP_DEBUG=0
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --classmap-authoritative
COPY docker/production.ini /usr/local/etc/php/conf.d/zz-production.ini
COPY docker/entrypoint.sh /usr/local/bin/pubsetup-entrypoint
USER www-data
ENTRYPOINT ["sh", "/usr/local/bin/pubsetup-entrypoint"]
CMD ["php-fpm", "-F"]
