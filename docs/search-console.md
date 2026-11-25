# Прямой доступ к Google Search Console

Локальный инструмент запрашивает только `webmasters.readonly`. Он читает данные,
но не отправляет sitemap, не удаляет ресурсы и не запрашивает индексацию.
Авторизация — OAuth Desktop с локальным callback на `127.0.0.1`.

## Однократная настройка Google

1. Откройте https://console.cloud.google.com/ и создайте или выберите проект.
2. Включите Google Search Console API:
   https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
3. В Google Auth Platform настройте Branding (имя приложения и контактный email).
   В Audience выберите External, если это личный Google-аккаунт, и добавьте свой
   Google email в Test users, пока приложение находится в Testing.
4. В Clients создайте OAuth client типа **Desktop app**, скачайте JSON.
   Сохраните его как `var/search-console/client.json` в этом проекте.
   Не помещайте этот файл в frontend/public и не отправляйте содержимое в чат.
5. Выполните команду auth ниже и откройте напечатанную ссылку на том же компьютере.
   Войдите в аккаунт, у которого есть доступ к нужному ресурсу Search Console.
   Если Google показывает предупреждение о вашем непроверенном тестовом приложении,
   сверьте имя приложения и проект перед продолжением.

OAuth External в режиме Testing с этим scope обычно выдаёт refresh token на 7 дней.
Если доступ перестал обновляться, повторите auth. Для длительного использования
нужно отдельно настроить статус приложения с учётом требований Google.

## Команды из корня проекта

```bash
python3 -m venv var/search-console/venv
var/search-console/venv/bin/pip install -r scripts/requirements-search-console.txt
var/search-console/venv/bin/python scripts/search-console.py auth
var/search-console/venv/bin/python scripts/search-console.py sites
var/search-console/venv/bin/python scripts/search-console.py export --days 28
var/search-console/venv/bin/python scripts/search-console.py export --days 90
var/search-console/venv/bin/python scripts/search-console.py sitemaps
var/search-console/venv/bin/python scripts/search-console.py inspect https://pubsetup.com/blog/magento-2-one-step-checkout-extensions-compared
```

Для другого ресурса укажите `--site sc-domain:example.com` **перед** подкомандой.
Используйте точное имя ресурса из команды sites. Авторизация даёт чтение доступных
аккаунту ресурсов; `--site` выбирает ресурс запроса, а не ограничивает OAuth grant.

Токен хранится в `var/search-console/token.json` с правами 0600, выгрузки — в
`var/search-console/exports/`. Весь `var/` уже исключён из Git. Клиент, токен и
выгрузки не требуются на production. Для отзыва доступа используйте
https://myaccount.google.com/connections и удалите локальный токен.

Выгрузка содержит отдельные итоги, дни, страницы, запросы, пары страница–запрос,
страны и устройства. По умолчанию последние три дня пропускаются, запрашиваются
финальные данные Web. Пагинация не отменяет внутренних ограничений Google:
API не гарантирует все строки, а часть запросов скрывается по соображениям
конфиденциальности. Поэтому суммы строк могут отличаться от общих итогов.

URL Inspection возвращает сохранённое состояние Google, а не live-проверку.
Полной выгрузки отчёта Page indexing с причинами исключения API не предоставляет.
Регулярное выполнение и изменения production автоматически не включаются.

Документация:
- https://developers.google.com/identity/protocols/oauth2/native-app
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
