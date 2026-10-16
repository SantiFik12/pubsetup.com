<?php

declare(strict_types=1);
namespace App\Service;
final class CatalogService
{
    public function __construct(private readonly Database $db) {}
    public function all(): array
    {
        $queries = [
            'partners' => 'SELECT * FROM partners ORDER BY name',
            'categories' => 'SELECT * FROM categories ORDER BY name',
            'extensions' => 'SELECT * FROM extensions ORDER BY created_at DESC',
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
        return $result;
    }
}
