FROM composer:2.10 AS composer
FROM php:8.4-fpm-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libfreetype6-dev libicu-dev libjpeg62-turbo-dev libpng-dev \
    libwebp-dev libxml2-dev libxslt1-dev libzip-dev libonig-dev libcurl4-openssl-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j2 bcmath curl dom ftp gd intl mbstring mysqli \
        opcache pdo_mysql soap sockets xsl zip \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer /usr/bin/composer /usr/local/bin/composer
COPY custom.ini /usr/local/etc/php/conf.d/zz-magento.ini
COPY www.conf /usr/local/etc/php-fpm.d/zz-magento.conf
WORKDIR /var/www/html
