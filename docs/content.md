# Как наполнять каталог

По текущему решению каталог наполняется заново. Supabase переносить не требуется. Миграция `003_first_catalog_module.sql` добавляет первый модуль CCPA, Amasty, категорию Compliance & Legal и услугу установки. Миграция `004_restore_services.sql` добавляет полный список из 10 услуг с описаниями, составом, сроками и ценами; источники перечислены в `docs/services.md`. Выполняется один раз, дальнейшее редактирование данных не перезаписывает.

## Изображения и текст

- `cover_image`: главное фото, одно на карточку каталога; хранить файлы в `frontend/public/images/extensions/<slug>/` и указывать путь `/images/extensions/<slug>/cover.png`.
- `gallery`: массив дополнительных изображений для подробной страницы, например `["/images/extensions/<slug>/settings.png"]`. Обложка включается в галерею автоматически.
- `short_description`: короткое описание для каталога и верхнего блока страницы модуля.
- `description`: подробное описание; переносы строк сохраняются.
- `user_guide_url`: ссылка README / User Guide.
- `affiliate_url`: ссылка кнопки View Partner Offer / Buy on Partner Website.
- `price_from`: цена партнёра в USD; `install_price` — цена нашей установки в USD.
- `rating` и `reviews`: реальные показатели; при `reviews=0` фиктивный рейтинг не отображается.
- `recommended` / `best_seller`: редакционные флаги, по умолчанию false.
- `features`, `use_cases`, `tags`, `magento_versions`: массивы строк.

Для изменения цены услуги установки править также `services.price`: backend получает сумму из услуги, не доверяет переданной браузером цене. Для CCPA начальная установка $60, как в прежнем каталоге; цена партнёра $159 проверена 2026-10-16 и может измениться.

## Редактирование

Вендоры и модули теперь редактируются через `/admin_panel`, см. `docs/admin-panel.md`. SQL и JSON-импорт остаются доступны для массового наполнения и остальных таблиц, без открытия PostgreSQL в интернет.

```bash
docker compose exec postgres psql -U pubsetup -d pubsetup
```

Пример изменения существующего модуля:

```sql
UPDATE extensions
SET short_description = 'Your short description',
    description = 'Your full description',
    cover_image = '/images/extensions/ccpa/cover.png',
    user_guide_url = 'https://amasty.com/user-guides/magento-2-california-consumer-privacy-act/'
WHERE slug = 'ccpa';
```

Для массового наполнения сохранить JSON вида `{"partners":[...],"categories":[...],"extensions":[...],"services":[...]}`. Каждая строка требует `id` (UUID), расширения ссылаются на `partner_id` и `category_id`. Существующие UUID можно получить из БД, новые — через `SELECT gen_random_uuid()`. Использовать имена столбцов PostgreSQL, не camelCase из frontend.

```bash
docker compose run --rm -T migrate php bin/console app:import - < catalog.json
```

В production использовать `bash scripts/prod.sh run --rm -T migrate php bin/console app:import - < catalog.json`. Импорт выполняется транзакционно и обновляет строки по `id`. Перед массовым изменением production выполнять backup. Не менять текст уже применённых миграций: последующие изменения контента выполнять через импорт/SQL или новую миграцию.

Текстовые изменения видны при следующем серверном запросе страницы. Новые изображения в production требуют пересборки frontend image; в development каталог `public/images` смонтирован отдельно.
