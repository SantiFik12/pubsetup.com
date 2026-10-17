# Проверки

Стандартные команды приведены в README. Тесты не отправляют настоящих писем: `integration.php` использует Symfony MockHttpClient.

## Проверки backend

Из папки `backend`:

```bash
composer qa
```

Команда запускает PHPStan (уровень 5, PHP 8.4, весь `src`), PHP CS Fixer (правила Symfony), Rector (совместимость с PHP 8.4), lint YAML/Twig/контейнера и существующие тесты. В `qa` PHP CS Fixer и Rector работают с `--dry-run` и не изменяют файлы. Baseline для PHPStan не используется.

Отдельные команды:

```bash
composer qa:phpstan
composer qa:cs-fixer
composer qa:rector
composer rector:fix
composer cs:fix
```

Инструменты находятся в `require-dev`. Для запуска `docker compose exec backend composer qa` после изменения зависимостей нужно пересобрать development-контейнер backend. В production зависимости для разработки не устанавливаются. Браузерные проверки не входят в `composer qa`; визуальные изменения проверяет владелец проекта.

Для интеграционного прогона создать отдельную БД, применить миграции, запустить тест. Имя должно оканчиваться на `_test`. Пример для локального development-кластера:

```bash
docker compose exec -T postgres createdb -U pubsetup pubsetup_test
docker compose run --rm --no-deps \
  -e DATABASE_URL=postgresql://pubsetup:pubsetup@postgres:5432/pubsetup_test migrate
docker compose run --rm --no-deps \
  -e DATABASE_URL=postgresql://pubsetup:pubsetup@postgres:5432/pubsetup_test \
  backend php tests/integration.php
```

Тест рассчитан на пустую БД и добавляет записи, в том числе тестовые заказы. Для повторного запуска использовать новую пустую тестовую БД. В production эти команды не выполнять.

Для проверки HTTP и UI на отдельном QA-стеке импортировать `backend/tests/catalog.json` через `app:import`. Это фиктивные данные для smoke/UI, их нельзя использовать как контент проекта. Затем:

```bash
python3 scripts/smoke.py http://127.0.0.1:PORT --require-content
```

Smoke проверяет gateway, health, API, серверный HTML с контентом, canonical, noindex checkout/compare, sitemap, robots, HTTP 404 и отказ на некорректную заявку. Проверку сохранения заказа, цены, очереди, подавления адресов и повторной доставки выполняет интеграционный PHP-тест.
