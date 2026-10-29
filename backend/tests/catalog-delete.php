<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\AdminCatalog;
use App\Service\Database;

$databaseUrl = getenv('ADMIN_TEST_DATABASE_URL');
if (!$databaseUrl) {
    echo "Set ADMIN_TEST_DATABASE_URL for isolated catalog deletion checks.\n";
    exit(0);
}
$db = new Database($databaseUrl);
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$db->execute('SET ROLE pubsetup_app');
$checks = 0;
$check = static function (bool $condition, string $message) use (&$checks): void {
    ++$checks;
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$suffix = bin2hex(random_bytes(5));
$vendor = $db->fetchAll("INSERT INTO partners(name,slug,logo_letter) VALUES ('Deletion QA',:slug,'D') RETURNING id", ['slug' => 'delete-'.$suffix])[0]['id'];
$category = $db->fetchAll('SELECT id FROM categories LIMIT 1')[0]['id'];
$module = $db->fetchAll("INSERT INTO extensions(name,slug,partner_id,category_id) VALUES ('Deletion module',:slug,:vendor,:category) RETURNING id", ['slug' => 'delete-'.$suffix, 'vendor' => $vendor, 'category' => $category])[0]['id'];
$db->execute('INSERT INTO module_metrics(extension_id,module_clicks) VALUES (:id,5)', ['id' => $module]);
$catalog = new AdminCatalog($db);
$check(1 === (int) $catalog->deletionInfo('vendor', $vendor)['dependencies'], 'Vendor dependency count missing');
try {
    $catalog->deleteRecord('vendor', $vendor);
    throw new RuntimeException('Vendor with modules was deleted');
} catch (InvalidArgumentException) {
    $check(null !== $catalog->vendor($vendor) && null !== $catalog->module($module), 'Blocked vendor deletion changed its records');
}
$service = $db->fetchAll('SELECT id FROM services LIMIT 1')[0]['id'];
$order = $db->fetchAll("INSERT INTO orders(service_id,extension_id,customer_name,email,amount) VALUES (:service,:module,'Deletion QA','delete@example.test',60) RETURNING id", ['service' => $service, 'module' => $module])[0]['id'];
$check(1 === (int) $catalog->deletionInfo('module', $module)['dependencies'], 'Module order dependency count missing');
try {
    $catalog->deleteRecord('module', $module);
    throw new RuntimeException('Module linked to an order was deleted');
} catch (InvalidArgumentException) {
    $check($module === $db->fetchAll('SELECT extension_id FROM orders WHERE id=:id', ['id' => $order])[0]['extension_id'], 'Blocked module deletion changed order history');
}
// The runtime role cannot delete orders; remove only our fixture using the test database owner.
$db->execute('RESET ROLE');
$db->execute('DELETE FROM orders WHERE id=:id', ['id' => $order]);
$db->execute('SET ROLE pubsetup_app');
$check($catalog->deleteRecord('module', $module) && null === $catalog->module($module), 'Unreferenced module was not deleted with runtime permissions');
$check([] === $db->fetchAll('SELECT * FROM module_metrics WHERE extension_id=:id', ['id' => $module]), 'Module statistics did not cascade');
$check($catalog->deleteRecord('vendor', $vendor) && null === $catalog->vendor($vendor), 'Empty vendor was not deleted with runtime permissions');
$check(!$catalog->deleteRecord('module', 'invalid-id') && !$catalog->deleteRecord('vendor', $vendor), 'Missing records must not report successful deletion');
try {
    $catalog->deleteRecord('orders', $order);
    throw new RuntimeException('Unexpected deletion target accepted');
} catch (InvalidArgumentException) {
    $check(true, 'Unsupported deletion target rejected');
}
echo "Catalog deletion: $checks checks passed.\n";
