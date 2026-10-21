# Magento demo для magento.pubsetup.com

Отдельный Compose-проект рядом с pubsetup, за существующим Caddy на хосте.
Новая установка Magento Open Source 2.4.8-p5 с Luma и sample data.

## Состав

- PHP 8.4, Composer 2.10; PHP-FPM ondemand, максимум 3 процесса.
- MariaDB 11.4, buffer pool 512 MB.
- OpenSearch 3.1.0, heap 1 GB.
- Valkey 8.1, максимум 256 MB, noeviction для сохранности сессий.
- nginx 1.30, Varnish 8.0, cache 128 MB.
- Единственный опубликованный порт: `127.0.0.1:8081`.
- Файлы магазина: `app/`; база, Valkey, OpenSearch и Composer credentials — отдельные volumes проекта `magento-demo`.

Это начальные настройки для demo без существенной нагрузки. При заполнении Valkey с политикой noeviction потребуется увеличить maxmemory или освободить кэш; сессии автоматически не вытесняются. Настройки не являются суммарным лимитом RAM всего проекта. Сборки Magento и pubsetup запускайте последовательно.

## 1. Доставить файлы

После доставки обновлённого репозитория pubsetup на сервер выполнить от пользователя deploy:

```bash
mkdir -p /home/deploy/magento-demo
cp -a /home/deploy/pubsetup/ops/magento-demo/. /home/deploy/magento-demo/
cd /home/deploy/magento-demo
bash scripts/init.sh
nano .env
```

Указать настоящий `MAGENTO_ADMIN_EMAIL`, сохранить сгенерированные пароли и случайный `MAGENTO_BACKEND_FRONTNAME`. В `.env` уже заданы домен `magento.pubsetup.com`, версия Magento и имя Compose-проекта. Файл `.env` не добавлять в Git.

Копирование выше предназначено для первой установки. При последующих изменениях не перезаписывайте сгенерированный `varnish/default.vcl` стартовым файлом из шаблона.

## 2. Параметр хоста для OpenSearch

```bash
printf '%s\n' 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-magento-demo.conf
sudo sysctl -p /etc/sysctl.d/99-magento-demo.conf
```

Если на сервере уже задано большее значение, сохраните его вместо уменьшения до 262144.

## 3. Установить Magento и sample data

Понадобятся public/private access keys Adobe Commerce Marketplace для `repo.magento.com`. Это ключи доступа к Composer, а не пароль Adobe. Public key используется как username, private key — как password.

```bash
cd /home/deploy/magento-demo
bash scripts/install.sh
```

Запускать в обычном интерактивном SSH-терминале: скрипт запросит оба ключа со скрытым вводом. Для долгой установки можно использовать tmux, если он установлен.

Скрипт собирает PHP, запускает MariaDB/Valkey/OpenSearch и ждёт их готовности, устанавливает Magento зафиксированной версии, добавляет sample data, создаёт администратора, настраивает HTTPS и кеши, компилирует код, публикует static content, строит индексы и генерирует штатный Magento VCL. Затем запускает PHP/nginx/Varnish/cron. Пакеты образов и Magento загружаются из сети; доступность приватного репозитория определяется вашими ключами Marketplace.

Ключи Composer хранятся только в отдельном `composer_home` volume. Секреты Magento записываются в `app/etc/env.php`. Не использовать `docker compose down -v`: это удалит данные.

Индексация demo отключается настройкой Magento и заголовком Caddy. Отправка почты Magento изначально отключена (`system/smtp/disable=1`), чтобы demo не отправляло письма до настройки почты.

## 4. Существующий Caddy

Добавить блок в `/etc/caddy/Caddyfile`, сохранив блоки pubsetup:

```caddyfile
magento.pubsetup.com {
    encode zstd gzip
    header X-Robots-Tag "noindex, nofollow"
    reverse_proxy 127.0.0.1:8081
}
```

Если этот блок уже добавлен, повторять его не нужно. После изменения:

```bash
sudo systemctl reload caddy
```

Вход в магазин: **https://magento.pubsetup.com/**.

## 5. Администратор и 2FA

Логин, пароль и путь админки доступны в `.env`:

```bash
cd /home/deploy/magento-demo
nano .env
```

Админка открывается по `https://magento.pubsetup.com/ЗНАЧЕНИЕ_MAGENTO_BACKEND_FRONTNAME`.

2FA оставлена включённой. Для первоначальной настройки администратора Magento может потребовать письмо подтверждения: сначала настройте SMTP через выбранный почтовый модуль и включите отправку:

```bash
docker compose run --rm --no-deps cli php bin/magento config:set system/smtp/disable 0
docker compose run --rm --no-deps cli php bin/magento cache:flush
```

## Если установка остановилась на generated/code/.../Proxy.php

Предупреждения Composer об abandoned packages и тестовых PSR-4 классах сами по себе не означают остановку. Сообщение об отсутствующем `generated/code/.../Proxy.php` может означать рассогласование Composer classmap и сгенерированного DI-кода после установки sample data.

Доставьте обновлённый `scripts/install-magento.sh` в `/home/deploy/magento-demo/scripts/` и повторите `bash scripts/install.sh` из каталога demo. Обновлённый установщик очищает только сгенерированный код и кеши, пересоздаёт autoload без Composer plugins/scripts и разрешает генерацию классов во время установки через `MAGE_MODE=default`. База, медиа и `.env` не удаляются.

До завершения установки скрипт не запускает web-сервисы. Если повторный запуск завершится ошибкой, сохраните заключительные строки вывода, начиная с первой ошибки.

## Обслуживание

Все команды Magento выполняются из `/home/deploy/magento-demo` через сервис `cli`:

```bash
docker compose run --rm --no-deps cli php bin/magento cache:flush
docker compose logs --tail=100 php nginx varnish opensearch
```

После изменения PHP-кода или установки модуля нужна штатная процедура Magento: maintenance, setup:upgrade, di:compile, static-content:deploy, reindex/cache:flush, maintenance:disable, затем перезапуск `php` (OPcache validate_timestamps=0). Перед изменениями резервируйте базу, `app/pub/media`, `app/etc/env.php`, `.env` и Composer-файлы. Без команд pubsetup Compose его контейнеры не перезапускаются.

## Статус проверки

Полная установка Magento с Marketplace-ключами не выполнялась. Сборка PHP-образа и запуск полного стека не подтверждены; по просьбе владельца дальнейшие проверки остановлены. Это подготовленная конфигурация для первого запуска, а не отчёт об успешном серверном развёртывании.

## Источники версий и команд

- https://experienceleague.adobe.com/en/docs/commerce-operations/installation-guide/system-requirements
- https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cache/valkey/valkey-pg-cache
- https://developer.adobe.com/commerce/php/module-reference/module-sample-data
- https://docs.opensearch.org/latest/install-and-configure/install-opensearch/docker/
