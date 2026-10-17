<?php

declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
use App\Service\Database;

$db = new Database(getenv('DATABASE_URL'));
$expected = [
    'magento-2-setup-from-scratch' => 299,
    'install-magento-2-extension' => 60,
    'security-patches-installation' => 60,
    'magento-2-speed-optimization' => 200,
    'performance-audit' => 499,
    'hyva-theme-migration' => 2499,
    'transfer-existing-store' => 0,
    'magento-server-updates' => 210,
    'migration-m1-to-m2' => 0,
    'migration-consultation' => 50,
];
$rows = $db->fetchAll('SELECT slug,price,description,duration,cardinality(includes) AS included FROM services');
$bySlug = array_column($rows, null, 'slug');
foreach ($expected as $slug => $price) {
    $row = $bySlug[$slug] ?? null;
    if (null === $row || (float) $row['price'] !== (float) $price || '' === trim($row['description']) || '' === trim($row['duration']) || 0 === (int) $row['included']) {
        throw new RuntimeException('Missing or incomplete seeded service: '.$slug);
    }
}
echo "All 10 services have seeded descriptions, included work, timelines and pricing.\n";
