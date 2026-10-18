# pubsetup и Magento demo на одном сервере

Дополнение к `PRODUCTION_HETZNER.md` и `/home/alexander/magento/Magento2_production_Hetzner_Docker_Compose.md`. Все команды ниже предназначены для будущего production-сервера. Они не выполнялись на сервере из этой рабочей сессии.

## Схема

```text
Internet → Caddy на хосте, порты 80/443
             ├─ pubsetup.com → 127.0.0.1:8080 → gateway → Next.js / Symfony → PostgreSQL
             └─ magento.pubsetup.com → 127.0.0.1:8081 → Varnish → nginx → PHP → MariaDB / Redis / OpenSearch
```

Это два независимых Compose-проекта. Docker Engine и входной Caddy общие. У проектов разные сети, БД, env-файлы, volumes и команды deploy. Общая Docker-сеть для этого варианта не нужна. Имена внутренних сервисов `php`, `nginx` и порты внутри контейнеров могут повторяться: на хосте опубликованы разные порты.

| Параметр | pubsetup | Magento demo |
|---|---|---|
| Каталог | `/home/deploy/pubsetup` | `/opt/magento/deploy` |
| Compose project | `pubsetup-prod` | `magento-demo` |
| Env | `.env.production` | `.env` |
| Публичный домен | `pubsetup.com` | `magento.pubsetup.com` |
| Вход с хоста | `127.0.0.1:8080` | `127.0.0.1:8081` |
| Контейнер входа | `gateway:8082` | `varnish:80` |

Задавайте имя Compose-проекта **до первого запуска**. Если Magento уже запущен под другим именем, сохраните его существующее имя: смена project name создаст другие volumes и будет выглядеть как пустая база. То же относится к pubsetup. Не задавайте одинаковые глобальные `container_name` или явные имена volumes двум проектам.

## 1. Настройка сервера

Настройку Ubuntu, deploy-пользователя, SSH, Firewall, Docker и системных параметров OpenSearch из руководств выполняйте один раз. Установите один Caddy как systemd-сервис на хосте по инструкции pubsetup/Artwelve.

На публичном интерфейсе входные web-порты 80/443 принадлежат этому Caddy. Входы приложений публикуются только на loopback. MariaDB, PostgreSQL, Redis, OpenSearch и PHP-FPM остаются внутри своих Docker-сетей.

## 2. pubsetup

В `/home/deploy/pubsetup/.env.production`:

```dotenv
COMPOSE_PROJECT_NAME=pubsetup-prod
HTTP_PORT=8080
SITE_URL=https://pubsetup.com
```

Остальные секреты и первый deploy — по `PRODUCTION_HETZNER.md`. Текущий `docker-compose.prod.yml` уже публикует gateway как `127.0.0.1:8080:8082`.

## 3. Изменения в инструкции Magento

В `/opt/magento/deploy/.env` **до первого запуска** добавьте:

```dotenv
COMPOSE_PROJECT_NAME=magento-demo
DOMAIN=magento.pubsetup.com
```

В `/opt/magento/deploy/docker-compose.yml` из раздела 17 руководства:

1. Удалите сервис `proxy` целиком. Его `ports: 80:80` / `443:443` и контейнерный Caddy в этой схеме не используются.
2. В существующий сервис `varnish` добавьте:

```yaml
services:
  varnish:
    # Сохранить image, command, volumes, depends_on и networks из Magento-руководства.
    ports:
      - "127.0.0.1:8081:80"
```

Это фрагмент изменения, а не полный Compose-файл. `expose: ["80"]` можно оставить: он не публикует порт на хосте. PHP, cron, nginx, MariaDB, Redis, OpenSearch и обе внутренние сети остаются по Magento-руководству. Раздел 12 с контейнерным Caddy пропускается; команды дальнейшего обновления `proxy` заменяются проверкой/reload Caddy на хосте.

Если контейнерный `proxy` уже работает, перед запуском host-Caddy остановите его из каталога Magento:

```bash
cd /opt/magento/deploy
docker compose stop proxy
```

После редактирования Compose:

```bash
docker compose config --quiet
docker compose up -d --build --remove-orphans
```

`--remove-orphans` уберёт старый контейнер `proxy` в этом Compose-проекте. Volumes с данными не удаляются. Не меняйте имя уже работающего проекта и не используйте `down -v`.

Установку/импорт Magento, cron, Redis, OpenSearch и генерацию штатного Magento VCL выполняйте по исходному руководству. Caddy направляет запросы в Varnish, чтобы сохранить Magento full page cache.

После установки Magento задайте домен и HTTPS:

```bash
cd /opt/magento/deploy
docker compose run --rm php bin/magento config:set web/unsecure/base_url https://magento.pubsetup.com/
docker compose run --rm php bin/magento config:set web/secure/base_url https://magento.pubsetup.com/
docker compose run --rm php bin/magento config:set web/secure/use_in_frontend 1
docker compose run --rm php bin/magento config:set web/secure/use_in_adminhtml 1
docker compose run --rm php bin/magento config:set web/secure/offloader_header X-Forwarded-Proto
docker compose run --rm php bin/magento config:set web/cookie/cookie_domain magento.pubsetup.com
docker compose run --rm php bin/magento cache:flush
```

Caddy сохраняет исходный Host и выставляет `X-Forwarded-Proto` / `X-Forwarded-For` автоматически. Varnish/nginx должны передавать эти заголовки дальше. Cookie Magento ограничены поддоменом demo; не ставьте для них `.pubsetup.com`.

## 4. DNS и общий Caddy

Добавьте DNS A-записи `pubsetup.com`, `www.pubsetup.com`, `magento.pubsetup.com` на один IPv4 сервера. AAAA добавляйте только при рабочем IPv6 этого сервера.

Готовый конфиг: `ops/Caddyfile.shared-server.example`. Добавьте его блоки в `/etc/caddy/Caddyfile`, сохранив другие нужные сайты. В нём:

- `pubsetup.com` проксируется на localhost:8080;
- `www` перенаправляется на основной домен;
- Magento demo проксируется на localhost:8081;
- только demo получает `X-Robots-Tag: noindex, nofollow`, чтобы не конкурировать в поиске с основным сайтом.

HTTPS завершается на host-Caddy. Он выпускает и обновляет сертификаты обоих сайтов. Внутри сервера используется HTTP к loopback-портам.

Проверка и применение после освобождения 80/443 от контейнерного proxy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

Если сервис ещё не запущен — сначала `sudo systemctl enable --now caddy`. Его конфиг должен быть готов, DNS и firewall настроены.

## 5. Независимые deploy и backup

pubsetup:

```bash
cd /home/deploy/pubsetup
bash scripts/backup.sh
bash scripts/deploy.sh
```

Magento:

```bash
cd /opt/magento/deploy
docker compose ps
# Далее Magento deploy / mdeploy и backup по исходному руководству.
```

Перезапуск одного Compose-проекта не перезапускает второй. Caddy reload применяет настройки входа без пересборки приложений. Базы и медиа резервируйте раздельно: pubsetup — PostgreSQL + module_uploads + env; Magento — MariaDB + pub/media + конфиги/секреты. Копии отправляйте вне сервера.

## 6. Проверки на целевом сервере

```bash
curl -I -H 'Host: pubsetup.com' -H 'X-Forwarded-Proto: https' http://127.0.0.1:8080/
curl -I -H 'Host: magento.pubsetup.com' -H 'X-Forwarded-Proto: https' http://127.0.0.1:8081/
sudo ss -ltnp
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

После переключения DNS проверяйте HTTPS обоих доменов с внешней машины. 8080/8081 должны слушать только `127.0.0.1`, служебные БД/Redis/OpenSearch — не публиковаться. У demo проверьте отсутствие циклических HTTP/HTTPS-редиректов и наличие `X-Robots-Tag`, у основного сайта — отсутствие этого запрета на публичных страницах. Эти команды приведены для запуска владельцем на целевом сервере; live из рабочей сессии не проверяется.

## Память сервера

В Magento-руководстве заданы MariaDB buffer pool 4 GB, Redis до 2 GB, OpenSearch heap 2 GB, Varnish до 1 GB и PHP OPcache 1 GB. Это настройки отдельных компонентов, не лимит всего Magento: дополнительно нужны память PHP workers, native memory OpenSearch, ОС и pubsetup. Поэтому исходные 16 GB дают ограниченный запас при компиляции Magento и одновременной сборке Next.js. Для совместного размещения комфортнее 24–32 GB; это ориентир по указанным настройкам, не результат замеров нагрузки. Сборки двух проектов запускайте последовательно; настройте PHP-FPM workers и лимиты памяти по фактическому использованию.

## Источники

- Docker project isolation: https://docs.docker.com/compose/how-tos/project-name/
- Loopback port publishing: https://docs.docker.com/engine/network/port-publishing/
- Caddy reverse proxy / forwarded headers: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- Caddy automatic HTTPS: https://caddyserver.com/docs/automatic-https
