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

Ключи Composer хранятся только в отдельном `composer_home` volume. Корень Magento внутри контейнера — `/var/www/html`, на хосте — `/home/deploy/magento-demo/app`. Поэтому файл конфигурации `app/etc/env.php` внутри контейнера находится на хосте по пути `/home/deploy/magento-demo/app/app/etc/env.php`. Не использовать `docker compose down -v`: это удалит данные.

Индексация demo отключается настройкой Magento и заголовком Caddy. Установщик также включает модуль `Pubsetup_Demo`: исходящая почта и оформление заказов запрещены, каталог и корзина доступны. Модуль предназначен только для изолированного demo, не для рабочего магазина.

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

2FA оставлена включённой для полноценного администратора. Только публичный пользователь `demo_viewer` с точной ролью `Pubsetup Demo Viewer` освобождён от 2FA; любые другие роли/пользователи проходят обычную проверку. Выдача API-токенов демопользователю запрещена, в том числе через общий issuer и legacy OAuth.

Модуль блокирует почту независимо от настройки SMTP. Для первоначального подключения Google Authenticator владельцу используйте штатную CLI-команду с собственным приватным base32-секретом из приложения аутентификации:

```bash
docker compose run --rm --no-deps cli php bin/magento security:tfa:google:set-secret ADMIN_USERNAME PRIVATE_BASE32_SECRET
```

Это шаблон команды: замените оба аргумента своими значениями. Приватный секрет владельца и его пароль не публиковать на сайте. Штатная команда описана в [CLI reference Adobe](https://experienceleague.adobe.com/en/docs/commerce-operations/tools/cli-reference/commerce-on-premises#securitytfagoogleset-secret).

## 6. Включить защищённое демо на существующей установке

Сначала сделайте резервную копию БД, `app/app/etc` на хосте, кода и `.env`. Для конфигурации Magento используйте контейнерного пользователя, у которого есть доступ к файлу `env.php`:

```bash
cd /home/deploy/magento-demo
umask 077
mkdir -p backups
docker compose run --rm --no-deps -T cli tar -czf - app/etc > backups/magento-app-etc-before-demo.tar.gz
tar -czf backups/demo-compose-env-before-demo.tar.gz .env compose.yaml
```

Обновите `compose.yaml`, каталог `module/` и файлы из `scripts/` в `/home/deploy/magento-demo`. Не перезаписывайте `.env`, `app/` или рабочий `varnish/default.vcl` файлами из шаблона.

Новый `init.sh` генерирует `DEMO_VIEWER_PASSWORD`. В существующий `.env` добавьте отдельный пароль для публичного пользователя: минимум 12 символов, строчные/заглавные буквы и цифры. Это публичный пароль, он не должен совпадать с паролем полноценного администратора. Имя пользователя фиксировано: `demo_viewer`.

```bash
cd /home/deploy/magento-demo
bash scripts/enable-demo.sh
```

Скрипт включает maintenance, копирует модуль в `app/code/Pubsetup/Demo`, выполняет upgrade/compile/static deploy и перезапускает PHP/cron перед снятием maintenance. При ошибке после включения maintenance магазин остаётся закрытым; сначала устраните ошибку и повторите запуск. После успешной установки Varnish очищается штатным `cache:flush`.

Настройка создаёт ограниченную роль и пользователя, затем три вымышленных заказа с адресами `example.invalid`. Оплата, резервирование товара и отправка писем не выполняются. Повторный запуск не создаёт дубликаты заказов и не меняет пароль существующего пользователя. Сохраните исходное значение `DEMO_VIEWER_PASSWORD`; если пароль пользователя изменён вручную, синхронизируйте его с публичной настройкой сайта.

Стабильная ссылка: **https://magento.pubsetup.com/demo/admin**. Она перенаправляет на штатный вход админки, не требуя указания backend frontname в коде pubsetup.

### Проверить перед публикацией доступа

Проверки выполняются на установленном Magento, в приватном окне браузера под `demo_viewer`:

| Проверка | Ожидаемый результат |
| --- | --- |
| Вход с публичным паролем | Без 2FA, видна надпись Read-only demo |
| Dashboard, товары, категории, Sales / Orders | Страницы открываются, видны три вымышленных заказа |
| Фильтрация/пагинация товаров и заказов | Работает, включая разрешённые AJAX-запросы `mui/index/render` |
| Изменение товара/категории, удаление, массовые действия | Кнопки скрыты; прямые GET/POST-запросы возвращают 403, данные не меняются |
| Изменение пароля, пользователей, ролей, настроек, кешей, импорт/экспорт | Доступ запрещён |
| Отмена заказа, комментарий, счёт, возврат, отправка письма | Доступ запрещён, никаких изменений/писем |
| Получение admin API-токена демопользователем | Запрещено |
| Попытка checkout, включая multishipping | Возврат в корзину с сообщением о деморежиме |
| Guest/customer REST payment-information, GraphQL placeOrder, прямое создание через Sales API | Заказ не создаётся, возвращается ошибка деморежима |
| Отправка почты, включая очереди | Транспорт не вызывается |
| Вход полноценного администратора | Обычная 2FA, полноценные права; создание заказов и почта по-прежнему запрещены глобально |

Защита админки использует список разрешённых действий, а не запрет всех POST: AJAX-загрузка таблиц может использовать POST. Разрешены только таблицы товаров и заказов. Сохранение bookmarks/постоянных представлений запрещено. Новые разделы и сторонние модули по умолчанию недоступны; для них нужна отдельная проверка перед расширением списка. UI-скрытие кнопок служит удобству, запреты проверяются на сервере.

### Показать блок на основном сайте

После прохождения проверок в `/home/deploy/pubsetup/.env.production` установить:

```dotenv
DEMO_ADMIN_ENABLED=1
DEMO_ADMIN_PASSWORD=PUBLIC_DEMO_VIEWER_PASSWORD
```

Замените `PUBLIC_DEMO_VIEWER_PASSWORD` на пароль `demo_viewer` из `.env` демомагазина. Оба значения намеренно публичны. Не используйте `MAGENTO_ADMIN_PASSWORD`. Пересоздайте frontend через штатное развёртывание pubsetup: переменные передаются во время запуска контейнера. Секция админки включена по умолчанию. До настройки пароля она показывает Coming soon без активного входа. В режиме разработки видно локальное превью. Значение DEMO_ADMIN_ENABLED=0 скрывает секцию на production; основной блок storefront остаётся доступен.

Основные заявки на услуги `/api/orders` на `pubsetup.com` не затрагиваются: модуль установлен только в отдельном Magento demo.

### Локальная проверка модуля

```bash
php ops/magento-demo/tests/security.php
```

Это автономные проверки политики и плагинов с тестовыми двойниками Magento. Они проверяют запреты контроллеров, заказов, почты, токенов и сохранение 2FA владельца, но не заменяют DI compilation и проверку настоящих HTTP/API-запросов из таблицы выше.

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

После изменения PHP-кода или установки модуля нужна штатная процедура Magento: maintenance, setup:upgrade, di:compile, static-content:deploy, reindex/cache:flush, maintenance:disable, затем перезапуск `php` (OPcache validate_timestamps=0). Перед изменениями резервируйте базу и файлы на хосте: `app/pub/media`, `app/app/etc`, `.env`, `app/composer.json` и `app/composer.lock`. Без команд pubsetup Compose его контейнеры не перезапускаются.

## Статус проверки

Полная установка Magento с Marketplace-ключами в этой рабочей сессии не выполнялась. Модуль и установочные скрипты подготовлены в репозитории; DI compilation, реальные HTTP/API-запросы и серверное развёртывание ещё требуют проверки на установленном Magento. Рабочий вход в админку на основном сайте становится доступен после настройки DEMO_ADMIN_PASSWORD; до проверки оставьте пароль пустым, секция покажет Coming soon.

## Источники версий и команд

- https://experienceleague.adobe.com/en/docs/commerce-operations/installation-guide/system-requirements
- https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cache/valkey/valkey-pg-cache
- https://developer.adobe.com/commerce/php/module-reference/module-sample-data
- https://docs.opensearch.org/latest/install-and-configure/install-opensearch/docker/
