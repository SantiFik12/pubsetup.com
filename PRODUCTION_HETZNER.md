# pubsetup.com — production на Hetzner

Этот файл адаптирует проектные команды руководства Artwelve. Настройку Ubuntu 24.04, SSH, Hetzner Firewall, UFW, Fail2ban, Docker и Caddy выполнять по оригиналу `/home/alexander/artwelve/PRODUCTION_HETZNER.md` (разделы 2–6, 9–11 и разделы о резервных копиях/мониторинге). IP, домен, пользователя и пути выбирать для сервера pubsetup; значения Konsul Pro из оригинала не являются настройками этого проекта.

## Отличия проекта

| Параметр | pubsetup |
|---|---|
| Каталог на сервере | `/home/deploy/pubsetup` |
| Compose project | `pubsetup-prod`, не менять после создания volume |
| Основной URL | `https://pubsetup.com` |
| Gateway на хосте | `127.0.0.1:8080` (`HTTP_PORT`) |
| nginx внутри Docker | `8082` |
| База | `pubsetup`, PostgreSQL 16 |
| Роль приложения | `pubsetup_app`, ограниченные права |
| Роль миграций/backup | `POSTGRES_USER`, владелец БД |
| PHP | Symfony 7.4, PHP 8.4 FPM |
| Frontend | Next.js 16 standalone, Node.js 24 |
| Дополнительный сервис | `worker`, очередь SMTP / Postmark |

Публичные порты — 80/443 на Caddy. Только gateway опубликован на localhost; PostgreSQL, frontend и backend не публикуют порты. Не добавлять `ports` для них. Caddy завершает TLS и передаёт gateway корректный `X-Forwarded-For`, который используется для ограничения заявок.

Если на этом сервере также разворачивается Magento demo: [совместное размещение двух Compose-проектов](docs/production-shared-server.md). В этой схеме используется один Caddy на хосте; контейнерный `proxy` из Magento-руководства заменяется локальным входом Varnish на `127.0.0.1:8081`. Готовый пример общего Caddyfile: `ops/Caddyfile.shared-server.example`.

## Первый запуск

От пользователя deploy, после настройки хоста:

```bash
cd /home/deploy
git clone 'URL_РЕПОЗИТОРИЯ' pubsetup
cd pubsetup
bash scripts/init-production.sh
nano .env.production
chmod 600 .env.production
git check-ignore .env.production
```

Установить `SITE_URL`, `HTTP_PORT=8080`, `RELEASE_TAG=git-<commit>`, почтовый транспорт (`MAIL_TRANSPORT=smtp` для Zoho), SMTP-параметры и sender `MAIL_FROM`. Для предпросмотра поставить нужный временный URL и закрыть весь hostname Basic Auth в Caddy, используя `ops/Caddyfile.example`. После переключения установить `SITE_URL=https://pubsetup.com`. Сгенерированные `POSTGRES_PASSWORD`, `APP_DB_PASSWORD` и `APP_SECRET` независимы, состоят из hex-символов и пригодны для URL подключения. Если задавать пароль вручную, percent-encode зарезервированные символы для DATABASE_URL.

```bash
bash scripts/prod.sh config --quiet
bash scripts/deploy.sh
bash scripts/prod.sh ps
```

Deploy сначала собирает frontend/backend, запускает PostgreSQL, выполняет `app:migrate` отдельным контейнером с правами владельца, затем обновляет runtime-контейнеры и ждёт healthchecks. Worker должен быть Running, остальные постоянные сервисы — Healthy. Применение миграций может потребовать согласованного окна: схема должна быть совместима с предыдущим приложением. Если миграция не прошла, скрипт останавливается до замены runtime-контейнеров; новые данные автоматически не восстанавливаются/не удаляются.

В production Symfony получает переменные через Docker Compose из `.env.production`. Параметр `APP_RUNTIME_OPTIONS='{"disable_dotenv":true}'` отключает загрузку `/app/.env`; создавать `backend/.env` на сервере или копировать секреты в образ не требуется.

Если первый запуск остановился с `Unable to read the "/app/.env" environment file`, обновить код с этим исправлением и повторить `bash scripts/deploy.sh`. Уже созданные volumes и PostgreSQL сохраняются; удалять их не нужно.

Первый модуль CCPA добавляется миграцией автоматически. Заполнить остальной контент по `docs/content.md` и проверить цены перед открытием сайта. Перенос Supabase по `docs/migration.md` необязателен. После наполнения и настройки почтового транспорта:

```bash
python3 scripts/smoke.py http://127.0.0.1:8080 --require-content
bash scripts/prod.sh exec backend php bin/console app:email-worker --once
bash scripts/prod.sh logs --tail=50 worker
```

Проверить реальную тестовую заявку и доставку писем на контролируемый адрес. SMTP требует действующих учётных данных и разрешённого From-адреса. При выборе Postmark нужен токен и подтверждённый sender. Локальные проверки используют подставной транспорт и не подтверждают настоящую доставку.

## Caddy и HTTPS

Использовать `ops/Caddyfile.example`, заменить временный hostname и хеш `caddy hash-password`. Пример закрывает весь временный сайт. Проверить снаружи: без пароля 401, с паролем главная 200, `/health` — `{"status":"ok"}`. После запуска убрать Basic Auth на основном домене и настроить редирект www на основной URL. Публичный gateway в обход Caddy недопустим. Проверить IPv4 и IPv6.

## Обновления и backup

```bash
cd /home/deploy/pubsetup
git status --short
bash scripts/backup.sh
# Сохранить текущий commit, RELEASE_TAG и .env.production в защищённый backup.
git pull --ff-only origin main
# Задать новый RELEASE_TAG по commit в .env.production.
bash scripts/deploy.sh
python3 scripts/smoke.py http://127.0.0.1:8080 --require-content
```

Backup сохраняет БД в `backups/*.dump` с правами, ограниченными umask 077. Отдельно сохранять env, медиа и отправлять копии во внешнее хранилище. Регулярно проверять восстановление дампа в отдельную БД, не поверх рабочей. Дамп содержит заказы и email-адреса.

Инициализация `pubsetup_app` выполняется скриптом PostgreSQL только на новом volume. Изменение пароля в env не меняет пароль существующей роли — менять через `psql \password` и согласованно обновлять env. Не выполнять `down -v`, volume prune или system prune --volumes. При откате приложения не откатывать данные автоматически; сначала проверить совместимость миграций. Откат образов: вернуть предыдущий код/RELEASE_TAG и `bash scripts/prod.sh up -d --no-build --pull never --wait`.

Для production использовать только `scripts/prod.sh` / `scripts/deploy.sh`. `docker compose up` из корня запускает development. Другой env-файл выбирается `PUBSETUP_ENV_FILE`, а не `KONSULPRO_ENV_FILE`.

## Перед публичным запуском

Проверить реальные данные и изображения, metadata/canonical для основных страниц, sitemap и robots, HTTP 404, мобильное меню/фильтры/сравнение/галерею, заявку и доставку писем, подавление адресов и отписку. Запустить frontend lint/build, `composer qa` в backend и smoke с `--require-content`. Серверные SEO-страницы уже допускают индексацию; предпросмотр защищать Basic Auth.

В репозитории не выполнялся live-деплой и не менялся DNS домена. Настройка Hetzner, Caddy и проверка внешнего HTTPS выполняются отдельно на целевом сервере.

## Админ-панель

После deploy миграция 005 добавляет защищённую панель `/admin_panel`. Создать пользователя: `bash scripts/prod.sh exec backend php bin/console admin:user:create admin@example.com`; пароль вводится интерактивно. Панель описана в `docs/admin-panel.md`. Новый named volume `module_uploads` хранит фотографии из панели; резервировать его вместе с БД. Сессия администратора завершается при замене backend-контейнера.


## SMTP Zoho для заказов

После обновления кода в `.env.production` установить (значение пароля заменить на настоящее):

```dotenv
MAIL_TRANSPORT=smtp
SMTP_HOST=smtppro.zoho.eu
SMTP_PORT=587
SMTP_ENCRYPTION=tls
SMTP_USERNAME=kontakt@artwelve.com
SMTP_PASSWORD='ZOHO_APP_PASSWORD'
MAIL_FROM=contact@pubsetup.com
MAIL_NOTIFICATION_TO=contact@pubsetup.com
```

В этой конфигурации `contact@pubsetup.com` — разрешённый алиас ящика `kontakt@artwelve.com`. Пароль приложения создаётся для основного ящика. Значение хранится только на сервере; спецсимволы не нужно URL-кодировать. Используйте одинарные кавычки в env-файле, чтобы Compose не подставлял значения вместо `$` в пароле. SMTP-host нужно брать из настроек конкретного аккаунта Zoho; текущий EU-host показан владельцем. Для Hetzner используйте порт 587 с STARTTLS (`SMTP_ENCRYPTION=tls`): порты 25 и 465 заблокированы по умолчанию, а 587 открыт ([Hetzner FAQ](https://docs.hetzner.com/cloud/servers/faq/#why-can-i-not-send-any-mails-from-my-server)). Если 465 отдельно разблокирован, транспорт также поддерживает `SMTP_PORT=465` и `SMTP_ENCRYPTION=ssl`. Проверка сертификата и обязательный TLS включены.

После первого обновления SMTP-кода выполнить `bash scripts/deploy.sh`: необходимо пересобрать backend с Symfony Mailer. Очередь `email_outbox` сохраняется; worker отправляет доступные неотправленные задания автоматически. Новую заявку создавать для повторной отправки не требуется. Если меняются только SMTP-параметры после сборки, достаточно `bash scripts/prod.sh up -d --no-deps --force-recreate backend worker`.

Если настройки отсутствуют, worker завершится с явным сообщением в логе, не расходуя попытки заданий. Статусы и безопасные сообщения об ошибках доступны в `email_outbox` и `email_send_log`; SMTP-пароли и AUTH-транскрипты не записываются. Статус `sent` означает принятие письма транспортом, а не гарантированное появление во входящих. Проверить логи: `bash scripts/prod.sh logs --tail=80 worker`. Если задание уже исчерпало 8 попыток, автоматическая отправка не возобновится без отдельного сброса попыток этого задания.

Postmark остаётся доступен при `MAIL_TRANSPORT=postmark`, с `POSTMARK_SERVER_TOKEN` и `POSTMARK_MESSAGE_STREAM`. SMTP-пароль в этом режиме не нужен. Локальная проверка отправки без сетевых соединений: `php backend/tests/email.php`.
