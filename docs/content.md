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

## Обложки и статья о товарных фидах

По согласованию с владельцем для новых обложек генерируется один вариант в стиле существующих баннеров; несколько вариантов — только по отдельному запросу. Для статьи `magento-2-product-feeds-mapping-variants-and-validation` выбран второй вариант из набора от 26 ноября 2026. Он сохранён как `/images/blog/pubsetup-magento-2-product-feeds.webp` (1670×941, около 100 КБ).

Миграция `021_product_feed_guide.sql` добавляет статью при обычном деплое и сохраняет уже существующий материал с тем же slug. Исходник находится в `content/blog/`. Таблица сопоставления, блок CSV, нумерованный список и ссылки на первоисточники включены в данные статьи. Рендерер поддерживает ограниченный безопасный набор inline-разметки: ссылки HTTP(S)/внутренние пути, жирный текст и inline-код; произвольный HTML не интерпретируется.

Карточка Data Feed Manager показывает ссылку на руководство только если статья присутствует в опубликованном каталоге. Обратная ссылка и карточка модуля включены в статью. Источники, дата редакционной проверки и условность учебных данных указаны в тексте.

Миграция `022_zoho_inventory_setup_guide.sql` добавляет руководство по настройке Zoho Inventory и проверке синхронизации. Обложка создана в одном варианте и сохранена как `/images/blog/pubsetup-magento-2-zoho-inventory-setup.webp`. Ссылка из модуля на руководство определяется общей логикой по фактическому упоминанию модуля в статье, без списка ручных исключений. На главной выводятся шесть последних материалов, полный список остаётся в `/blog`.
# Extra-fee guide (2026-11-26)

Source: `content/blog/magento-2-extra-fees-tax-and-refund-checklist.md`. Migration `023_extra_fee_checklist_guide.sql` inserts the article without overwriting an existing slug. One generated cover is stored at `/images/blog/pubsetup-magento-2-extra-fees.webp`. Rebuild frontend assets and apply migrations through the normal deployment process. The article includes an eight-case acceptance worksheet, attributed Amasty examples and Adobe credit-memo documentation, and contextual internal links to both reviewed product pages. No module records are modified.

## Payment and shipping restrictions guides (2026-11-27)

Two separate guides cover payment-method availability and delivery-method eligibility. Sources are in `content/blog/magento-2-payment-restrictions-customer-groups-and-cart-rules.md` and `content/blog/magento-2-shipping-restrictions-rules-and-checkout-testing.md`. Migrations `024_payment_restrictions_guide.sql` and `025_shipping_restrictions_guide.sql` publish them through the normal deployment process and preserve any existing article with the same slug. Each article has a nine-case worksheet, a five-step release checklist and attributed Adobe/Amasty documentation. Vendor behaviour is distinguished from editorial test suggestions and other vendors' capabilities.

Both articles reference actual catalog modules and each other. Existing shared logic adds reciprocal guide links on the referenced module pages, lists both articles in the sitemap and keeps the homepage feed limited to six. No module records or importer behaviour are changed.

One generated cover per article is saved in `frontend/public/images/blog/` as `pubsetup-magento-2-payment-restrictions.webp` and `pubsetup-magento-2-shipping-restrictions.webp` (about 117 and 119 KiB). The built-in imagegen prompt set and asset paths are recorded in `content/blog-assets/2026-11-27-banner-prompts.md`. Rebuild the frontend to include these assets.

## API, ERP / CRM and cron guides (2026-11-28)

Migrations `028_api_integration_guide.sql`, `029_erp_crm_integration_guide.sql` and `030_cron_indexers_guide.sql` add three guides with November 28 publication dates. The matching Markdown sources are in `content/blog/`. Existing articles with the same slug are preserved. These migrations do not modify module or service records.

The API guide distinguishes deployment-specific authentication, retry decisions and asynchronous completion. The ERP / CRM guide covers identifiers, field ownership and inventory mapping. The cron guide provides a read-only diagnostic command block and an evidence worksheet; it does not instruct readers to reset job state or run a full rebuild as a first step. All use primary Adobe documentation and distinguish editorial planning from tested results.

The articles link to relevant services, to each other and to existing catalog modules where appropriate. Reciprocal module links use the existing shared resolver, the homepage remains capped at six latest articles and sitemap entries come from the public catalog. One built-in imagegen cover per article is stored in `frontend/public/images/blog/`: `pubsetup-magento-2-api-integration.webp`, `pubsetup-magento-2-erp-crm-integration.webp`, `pubsetup-magento-2-cron-indexers.webp`. Prompts and asset paths are recorded in `content/blog-assets/2026-11-28-banner-prompts.md`. Rebuild frontend assets as part of deployment.
