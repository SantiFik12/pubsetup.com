<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\String\Slugger\AsciiSlugger;

final readonly class AdminCatalog
{
    public function __construct(private Database $db)
    {
    }

    public function vendors(): array
    {
        return $this->db->fetchAll('SELECT p.*, (SELECT count(*) FROM extensions e WHERE e.partner_id=p.id) AS modules, COALESCE((SELECT sum(m.affiliate_clicks) FROM module_metrics m JOIN extensions e ON e.id=m.extension_id WHERE e.partner_id=p.id),0) AS affiliate_clicks FROM partners p ORDER BY p.name');
    }

    public function vendor(string $id): ?array
    {
        return $this->db->fetchAll('SELECT * FROM partners WHERE id::text = :id', ['id' => $id])[0] ?? null;
    }

    public function modules(?string $vendor, string $query): array
    {
        return $this->db->fetchAll("SELECT e.id,e.slug,e.name,e.original_url,e.affiliate_url,e.cover_image,e.price_from,e.published,e.updated_at,e.source_updated_at,p.name AS vendor,c.name AS category,COALESCE(m.module_clicks,0) AS module_clicks,COALESCE(m.affiliate_clicks,0) AS affiliate_clicks
            FROM extensions e JOIN partners p ON p.id=e.partner_id JOIN categories c ON c.id=e.category_id LEFT JOIN module_metrics m ON m.extension_id=e.id
            WHERE (:vendor = '' OR e.partner_id::text = :vendor_id) AND (:q = '' OR e.name ILIKE :pattern OR e.slug ILIKE :slug_pattern) ORDER BY p.name,e.name",
            ['vendor' => $vendor ?? '', 'vendor_id' => $vendor ?? '', 'q' => $query, 'pattern' => '%'.$query.'%', 'slug_pattern' => '%'.$query.'%']);
    }

    public function module(string $id): ?array
    {
        $row = $this->db->fetchAll('SELECT row_to_json(e) AS data FROM extensions e WHERE e.id::text = :id', ['id' => $id])[0] ?? null;

        return $row ? json_decode($row['data'], true, 512, JSON_THROW_ON_ERROR) : null;
    }

    public function categories(): array
    {
        return $this->db->fetchAll('SELECT id,name,slug FROM categories ORDER BY name');
    }

    public function deletionInfo(string $kind, string $id): ?array
    {
        [$table, $related, $foreignKey] = match ($kind) {
            'vendor' => ['partners', 'extensions', 'partner_id'],
            'module' => ['extensions', 'orders', 'extension_id'],
            default => throw new \InvalidArgumentException('Неизвестный тип записи.'),
        };

        return $this->db->fetchAll("SELECT r.id,r.name,(SELECT count(*) FROM $related d WHERE d.$foreignKey=r.id) AS dependencies FROM $table r WHERE r.id::text=:id", ['id' => $id])[0] ?? null;
    }

    public function deleteRecord(string $kind, string $id): bool
    {
        $table = match ($kind) {
            'vendor' => 'partners',
            'module' => 'extensions',
            default => throw new \InvalidArgumentException('Неизвестный тип записи.'),
        };
        $pdo = $this->db->connection();
        $pdo->beginTransaction();
        try {
            // Serialize deletion with foreign-key checks from new modules/orders.
            $row = $this->db->fetchAll("SELECT id FROM $table WHERE id::text=:id FOR UPDATE", ['id' => $id]);
            if ([] === $row) {
                $pdo->commit();

                return false;
            }
            $info = $this->deletionInfo($kind, $id);
            if ((int) $info['dependencies'] > 0) {
                throw new \InvalidArgumentException('vendor' === $kind ? 'Сначала удалите модули вендора или перенесите их к другому вендору.' : 'Модуль связан с заказами. Снимите его с публикации, чтобы сохранить историю заказов.');
            }
            $this->db->execute("DELETE FROM $table WHERE id::text=:id", ['id' => $id]);
            $pdo->commit();

            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public function totals(): array
    {
        return $this->db->fetchAll('SELECT (SELECT count(*) FROM partners) AS vendors,(SELECT count(*) FROM extensions) AS modules,(SELECT COALESCE(sum(module_clicks),0) FROM module_metrics) AS module_clicks,(SELECT COALESCE(sum(affiliate_clicks),0) FROM module_metrics) AS affiliate_clicks')[0];
    }

    public static function url(string $value, bool $required = false): string
    {
        $value = trim($value);
        if ('' === $value && !$required) {
            return '';
        }
        $parts = parse_url($value);
        if (!filter_var($value, FILTER_VALIDATE_URL) || !is_array($parts) || !in_array($parts['scheme'] ?? '', ['http', 'https'], true) || isset($parts['user']) || isset($parts['pass']) || strlen($value) > 2048) {
            throw new \InvalidArgumentException('Укажите корректную ссылку http:// или https://.');
        }

        return $value;
    }

    private function slug(string $slug, string $name): string
    {
        if ('' === trim($slug)) {
            $slug = (string) new AsciiSlugger()->slug($name)->lower();
        }
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 150) {
            throw new \InvalidArgumentException('Slug: латинские буквы, цифры и дефисы, до 150 символов.');
        }

        return $slug;
    }

    private function text(array $input, string $key, int $max, bool $required = false): string
    {
        $value = $input[$key] ?? '';
        if (!is_string($value) || strlen(trim($value)) > $max || ($required && '' === trim($value))) {
            throw new \InvalidArgumentException('Проверьте поле '.$key.'.');
        }

        return trim($value);
    }

    private function money(array $input, string $key): string
    {
        $value = $this->text($input, $key, 12);
        if ('' === $value) {
            return '0';
        }
        if (!preg_match('/^\d{1,8}(\.\d{1,2})?$/D', $value)) {
            throw new \InvalidArgumentException('Цена должна быть положительным числом с точностью до цента.');
        }

        return $value;
    }

    public function saveVendor(array $input, ?string $id): string
    {
        $name = $this->text($input, 'name', 200, true);
        $slug = $this->slug($this->text($input, 'slug', 150), $name);
        $template = AffiliateLinks::validate($this->text($input, 'affiliate_template', 2048));
        $applyAll = isset($input['apply_affiliate_all']);
        if ($applyAll && '' === $template) {
            throw new \InvalidArgumentException('Для применения ко всем модулям заполните affiliate-ссылку вендора.');
        }
        // Validate expanded links before changing either the vendor or overrides.
        foreach ($this->db->fetchAll('SELECT original_url,affiliate_url FROM extensions WHERE partner_id::text=:id', ['id' => $id ?? '']) as $module) {
            if ('' !== $template && ($applyAll || '' === $module['affiliate_url'])) {
                AffiliateLinks::resolve('', $template, $module['original_url']);
            }
        }
        $values = ['name' => $name, 'slug' => $slug, 'description' => $this->text($input, 'description', 10000), 'website' => self::url($this->text($input, 'website', 2048)), 'logo_letter' => mb_substr($name, 0, 2), 'affiliate_template' => $template];
        if ([] !== $this->db->fetchAll('SELECT id FROM partners WHERE slug=:slug AND id::text <> :id', ['slug' => $slug, 'id' => $id ?? ''])) {
            throw new \InvalidArgumentException('Вендор с таким slug уже существует.');
        }
        $connection = $this->db->connection();
        // Automatic vendor creation also runs inside importModule's transaction.
        $ownTransaction = !$connection->inTransaction();
        if ($ownTransaction) {
            $connection->beginTransaction();
        }
        try {
            if ($id) {
                $this->db->execute('UPDATE partners SET name=:name,slug=:slug,description=:description,website=:website,logo_letter=:logo_letter,affiliate_template=:affiliate_template WHERE id=:id', $values + ['id' => $id]);
            } else {
                $id = $this->db->fetchAll('INSERT INTO partners(name,slug,description,website,logo_letter,affiliate_template) VALUES (:name,:slug,:description,:website,:logo_letter,:affiliate_template) RETURNING id', $values)[0]['id'];
            }
            if ($applyAll) {
                $this->db->execute("UPDATE extensions SET affiliate_url='' WHERE partner_id=:id", ['id' => $id]);
            }
            if ($ownTransaction) {
                $connection->commit();
            }

            return $id;
        } catch (\Throwable $error) {
            if ($ownTransaction) {
                $connection->rollBack();
            }
            throw $error;
        }
    }

    public function saveModule(array $input, ?string $id): string
    {
        $name = $this->text($input, 'name', 250, true);
        $slug = $this->slug($this->text($input, 'slug', 150), $name);
        $partner = $this->text($input, 'partner_id', 36, true);
        $category = $this->text($input, 'category_id', 36, true);
        if (!$this->vendor($partner) || [] === $this->db->fetchAll('SELECT id FROM categories WHERE id::text=:id', ['id' => $category])) {
            throw new \InvalidArgumentException('Выберите вендора и категорию.');
        }
        if ([] !== $this->db->fetchAll('SELECT id FROM extensions WHERE slug=:slug AND id::text<>:id', ['slug' => $slug, 'id' => $id ?? ''])) {
            throw new \InvalidArgumentException('Модуль с таким slug уже существует.');
        }
        $lines = static fn (string $value): array => array_values(array_unique(array_filter(array_map(trim(...), preg_split('/[\r\n]+/', $value)))));
        $tags = array_values(array_unique(array_filter(array_map(trim(...), explode(',', $this->text($input, 'tags', 2000))))));
        $priceType = $this->text($input, 'price_type', 20);
        if (!in_array($priceType, ['one-time', 'subscription', 'free'], true)) {
            throw new \InvalidArgumentException('Выберите тип цены.');
        }
        $cover = $this->text($input, 'cover_image', 2048);
        $gallery = $lines($this->text($input, 'gallery', 20000));
        foreach ([$cover, ...$gallery] as $image) {
            if ('' !== $image && !preg_match('#^/(?:images/|media/modules/)[a-zA-Z0-9_./-]+$#D', $image)) {
                self::url($image, true);
            }
        }
        $payload = [
            'name' => $name, 'slug' => $slug, 'partner_id' => $partner, 'category_id' => $category,
            'short_description' => $this->text($input, 'short_description', 2000), 'description' => $this->text($input, 'description', 30000),
            'original_url' => self::url($this->text($input, 'original_url', 2048), true),
            'affiliate_url' => self::url($this->text($input, 'affiliate_url', 2048)),
            'user_guide_url' => self::url($this->text($input, 'user_guide_url', 2048)),
            'price_from' => 'free' === $priceType ? '0' : $this->money($input, 'price_from'), 'price_type' => $priceType,
            'install_price' => $this->money($input, 'install_price'), 'cover_image' => $cover, 'gallery' => $gallery,
            'features' => $lines($this->text($input, 'features', 10000)), 'tags' => $tags,
            'magento_versions' => array_values(array_filter(array_map(trim(...), explode(',', $this->text($input, 'magento_versions', 500))))),
            'hyva_compatible' => isset($input['hyva_compatible']), 'published' => isset($input['published']),
        ];
        $previous = $id ? ($this->module($id) ?? []) : [];
        $generated = ModuleSeo::generate(array_replace($previous, $input, $payload));
        foreach (['seo_title' => ModuleSeo::TITLE_LIMIT, 'seo_description' => ModuleSeo::DESCRIPTION_LIMIT] as $key => $limit) {
            $value = $this->text($input, $key, $limit * 4);
            if (mb_strlen($value) > $limit) {
                throw new \InvalidArgumentException('Проверьте длину поля '.$key.'.');
            }
            $payload[$key] = '' !== $value ? $value : $generated[$key];
        }
        foreach (['seo_source_title' => 4000, 'seo_source_description' => 16000] as $key => $limit) {
            if (array_key_exists($key, $input)) {
                $payload[$key] = $this->text($input, $key, $limit);
            }
        }
        // json_populate_record preserves PostgreSQL array/JSON/enum types and restricts writable columns.
        $columns = array_keys($payload);
        $quoted = array_map(static fn (string $key): string => '"'.$key.'"', $columns);
        $json = json_encode($payload, JSON_THROW_ON_ERROR);
        if ($id) {
            $assignments = implode(',', array_map(static fn (string $key): string => '"'.$key.'"=r."'.$key.'"', $columns));
            $this->db->execute('UPDATE extensions e SET '.$assignments.' FROM json_populate_record(NULL::extensions,CAST(:data AS json)) r WHERE e.id=:id', ['data' => $json, 'id' => $id]);

            return $id;
        }

        return $this->db->fetchAll('INSERT INTO extensions ('.implode(',', $quoted).') SELECT '.implode(',', $quoted).' FROM json_populate_record(NULL::extensions,CAST(:data AS json)) RETURNING id', ['data' => $json])[0]['id'];
    }

    public function importModule(string $url, string $affiliate, string $vendor, array $fields): string
    {
        $url = self::url($url, true);
        $affiliate = self::url($affiliate);
        if (empty($fields['name']) || empty($fields['description'])) {
            throw new \InvalidArgumentException('На странице не найдены данные модуля.');
        }
        $connection = $this->db->connection();
        $connection->beginTransaction();
        try {
            $existing = $this->db->fetchAll("SELECT id FROM extensions WHERE split_part(original_url,'?',1)=:url", ['url' => strtok($url, '?')])[0] ?? null;
            if ($existing) {
                $this->updateFromSource($existing['id'], $fields);
                if ('' !== $affiliate) {
                    $this->db->execute('UPDATE extensions SET affiliate_url=:url WHERE id=:id', ['url' => $affiliate, 'id' => $existing['id']]);
                }
                $connection->commit();

                return $existing['id'];
            }
            $host = strtolower(preg_replace('/^www\./i', '', parse_url($url, PHP_URL_HOST)));
            if ('' !== $vendor && !$this->vendor($vendor)) {
                throw new \InvalidArgumentException('Вендор не найден.');
            }
            if ('' === $vendor) {
                foreach ($this->vendors() as $candidate) {
                    if (strtolower(preg_replace('/^www\./i', '', parse_url($candidate['website'], PHP_URL_HOST) ?? '')) === $host) {
                        $vendor = $candidate['id'];
                        break;
                    }
                }
            }
            if ('' === $vendor) {
                $name = trim(preg_replace('/\s+store$/i', '', $fields['_vendor'] ?? '')) ?: ucfirst(explode('.', $host)[0]);
                $vendorSlug = $this->slug('', $host);
                $known = $this->db->fetchAll('SELECT id FROM partners WHERE slug=:slug', ['slug' => $vendorSlug])[0] ?? null;
                $vendor = $known['id'] ?? $this->saveVendor(['name' => $name, 'slug' => $vendorSlug, 'website' => 'https://'.$host], null);
            }
            $category = $this->sourceCategory($fields, true);
            $slugBase = $this->slug('', $fields['name']);
            $slug = $slugBase;
            $suffix = 2;
            while ([] !== $this->db->fetchAll('SELECT id FROM extensions WHERE slug=:slug', ['slug' => $slug])) {
                $slug = substr($slugBase, 0, 140).'-'.$suffix++;
            }
            $input = array_replace($fields, ['slug' => $slug, 'partner_id' => $vendor, 'category_id' => $category, 'original_url' => $url, 'affiliate_url' => $affiliate, 'price_type' => $fields['price_type'] ?? 'one-time', 'install_price' => '60', 'published' => '1']);
            foreach (['gallery', 'features'] as $key) {
                $input[$key] = implode("\n", $fields[$key] ?? []);
            }
            foreach (['magento_versions', 'tags'] as $key) {
                $input[$key] = implode(', ', $fields[$key] ?? []);
            }
            foreach (['short_description' => 2000, 'description' => 30000] as $key => $limit) {
                $input[$key] = mb_strcut($input[$key] ?? '', 0, $limit, 'UTF-8');
            }
            if (empty($fields['hyva_compatible'])) {
                unset($input['hyva_compatible']);
            }
            $id = $this->saveModule($input, null);
            $this->updateFromSource($id, $fields);
            $connection->commit();

            return $id;
        } catch (\Throwable $error) {
            $connection->rollBack();
            throw $error;
        }
    }

    private function sourceCategory(array $fields, bool $fallback = false): ?string
    {
        $category = ModuleCategory::detect($fields);
        if (null === $category && !$fallback) {
            return null;
        }
        $category ??= ['slug' => 'other', 'name' => 'Other Extensions', 'icon' => 'Package'];
        $description = 'Explore '.$category['name'].' Magento 2 extensions. Compare features, compatibility and partner prices, with professional installation from pubsetup.com.';
        $this->db->execute("INSERT INTO categories(slug,name,icon,description) VALUES (:slug,:name,:icon,:description) ON CONFLICT(slug) DO UPDATE SET description=EXCLUDED.description WHERE trim(categories.description)=''", $category + ['description' => $description]);

        return $this->db->fetchAll('SELECT id FROM categories WHERE slug=:slug', ['slug' => $category['slug']])[0]['id'];
    }

    public function updateFromSource(string $id, array $fields): void
    {
        if ([] === $fields) {
            throw new \InvalidArgumentException('Источник не вернул данные модуля.');
        }
        $category = $this->sourceCategory($fields);
        if (null !== $category) {
            $fields['category_id'] = $category;
        }
        $stored = $this->module($id) ?? [];
        $fields = array_replace($fields, ModuleSeo::generate(array_replace($stored, $fields)));
        $allowed = ['seo_title', 'seo_description', 'seo_source_title', 'seo_source_description', 'category_id', 'name', 'short_description', 'description', 'price_from', 'rating', 'reviews', 'cover_image', 'gallery', 'user_guide_url', 'features', 'magento_versions', 'hyva_compatible', 'price_type'];
        $fields = array_intersect_key($fields, array_flip($allowed));
        if ([] === $fields) {
            throw new \InvalidArgumentException('Источник не вернул данные модуля.');
        }
        $updates = implode(',', array_map(static fn (string $key): string => '"'.$key.'"=r."'.$key.'"', array_keys($fields)));
        $this->db->execute('UPDATE extensions e SET '.$updates.',source_updated_at=now() FROM json_populate_record(NULL::extensions,CAST(:data AS json)) r WHERE e.id=:id', ['data' => json_encode($fields, JSON_THROW_ON_ERROR), 'id' => $id]);
    }
}
