<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\AdminCatalog;
use App\Service\Database;

$databaseUrl = getenv('ADMIN_TEST_DATABASE_URL');
if (!$databaseUrl) {
    echo "Set ADMIN_TEST_DATABASE_URL for module pagination checks.\n";
    exit(0);
}
$db = new Database($databaseUrl);
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$db->execute('SET ROLE pubsetup_app');
$catalog = new AdminCatalog($db);
$suffix = bin2hex(random_bytes(5));
$vendor = $catalog->saveVendor(['name' => 'Pagination QA', 'slug' => 'pagination-'.$suffix], null);
$category = $catalog->categories()[0]['id'];
for ($number = 0; $number < 57; ++$number) {
    $db->execute('INSERT INTO extensions(name,slug,partner_id,category_id) VALUES (:name,:slug,:vendor,:category)', ['name' => 'Pagination '.$suffix, 'slug' => 'page-'.$suffix.'-'.$number, 'vendor' => $vendor, 'category' => $category]);
}
$check = static function (bool $ok, string $message): void {
    if (!$ok) {
        throw new RuntimeException($message);
    }
};
$first = $catalog->modulePage($vendor, '', 1);
$second = $catalog->modulePage($vendor, '', 2);
$third = $catalog->modulePage($vendor, '', 3);
$check(57 === $first['total'] && 3 === $first['pages'] && 25 === count($first['modules']) && 25 === count($second['modules']) && 7 === count($third['modules']), 'Admin pagination lost rows or ignored the limit');
$ids = [...array_column($first['modules'], 'id'), ...array_column($second['modules'], 'id'), ...array_column($third['modules'], 'id')];
$check(57 === count(array_unique($ids)), 'Equal product names caused pages to overlap');
$check([26, 50] === [$second['from'], $second['to']] && 57 === $third['to'], 'Admin display range incorrect');
$check(3 === $catalog->modulePage($vendor, '', PHP_INT_MAX)['page'] && 1 === $catalog->modulePage($vendor, '', -1)['page'], 'Admin page bounds incorrect');
$check(1 === $catalog->modulePage($vendor, 'page-'.$suffix.'-56')['total'], 'Slug search ignored');
$check(57 === $catalog->modulePage(null, 'Pagination '.$suffix)['total'], 'General list search failed');
$check(0 === $catalog->modulePage($vendor, "%' OR true --")['total'], 'Search interpreted wildcard or SQL input');
$empty = $catalog->modulePage($vendor, 'missing-query');
$check([] === $empty['modules'] && 0 === $empty['from'] && 0 === $empty['to'] && 1 === $empty['page'], 'Empty search broke pagination');
echo "Module pagination database checks passed: limits, stable ordering, filters, bounds and search escaping.\n";
