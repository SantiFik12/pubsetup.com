<?php

declare(strict_types=1);

namespace App\Service;

final readonly class CatalogService
{
    public function __construct(private Database $db)
    {
    }

    public function all(): array
    {
        $queries = [
            'partners' => 'SELECT * FROM partners ORDER BY name',
            'categories' => 'SELECT * FROM categories ORDER BY name',
            'extensions' => 'SELECT e.*,COALESCE(m.module_clicks,0) AS views FROM extensions e LEFT JOIN module_metrics m ON m.extension_id=e.id WHERE e.published = true ORDER BY e.created_at DESC',
            'services' => 'SELECT * FROM services ORDER BY position, price',
            'blogPosts' => 'SELECT * FROM blog_posts WHERE published = true ORDER BY date DESC',
            'seoLandings' => 'SELECT * FROM seo_landings WHERE published = true ORDER BY slug',
        ];
        $result = [];
        foreach ($queries as $key => $query) {
            // PostgreSQL converts arrays, JSON, booleans and numbers to their JSON types.
            $rows = $this->db->fetchAll('SELECT row_to_json(r) AS data FROM ('.$query.') r');
            $result[$key] = array_map(static fn (array $row): array => json_decode($row['data'], true, 512, JSON_THROW_ON_ERROR), $rows);
        }
        $templates = array_column($result['partners'], 'affiliate_template', 'id');
        foreach ($result['extensions'] as &$module) {
            $template = $templates[$module['partner_id']] ?? '';
            if ('' === $module['affiliate_url'] && '' !== $template) {
                try {
                    $module['affiliate_url'] = AffiliateLinks::resolve('', $template, $module['original_url']);
                } catch (\InvalidArgumentException) {
                    // Invalid legacy/source URLs must not break the public catalog.
                }
            }
        }
        unset($module);

        return $result;
    }
}
