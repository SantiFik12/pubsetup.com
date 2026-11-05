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

$vendor = $catalog->saveVendor(['name' => 'Bulk deletion QA', 'slug' => 'bulk-delete-'.$suffix], null);
$otherVendor = $catalog->saveVendor(['name' => 'Keep QA', 'slug' => 'keep-delete-'.$suffix], null);
$modules = [];
foreach ([$vendor, $vendor, $otherVendor] as $index => $partner) {
    $modules[] = $db->fetchAll("INSERT INTO extensions(name,slug,partner_id,category_id,published) VALUES ('Bulk module',:slug,:vendor,:category,CAST(:published AS boolean)) RETURNING id", ['slug' => 'bulk-delete-'.$suffix.'-'.$index, 'vendor' => $partner, 'category' => $category, 'published' => 1 === $index ? 'false' : 'true'])[0]['id'];
}
foreach ($modules as $child) {
    $db->execute('INSERT INTO module_metrics(extension_id,module_clicks) VALUES (:id,7)', ['id' => $child]);
    $db->execute('INSERT INTO catalog_source_state(module_id) VALUES (:id)', ['id' => $child]);
}
$run = $db->fetchAll('INSERT INTO catalog_refresh_runs DEFAULT VALUES RETURNING id')[0]['id'];
$db->execute("INSERT INTO catalog_refresh_items(run_id,module_id,module_name,vendor_name,source_url) VALUES (:run,:module,'Bulk module','Bulk deletion QA','https://example.test/module')", ['run' => $run, 'module' => $modules[0]]);
$order = $db->fetchAll("INSERT INTO orders(service_id,extension_id,customer_name,email,amount) VALUES (:service,:module,'Bulk QA','delete@example.test',60) RETURNING id", ['service' => $service, 'module' => $modules[0]])[0]['id'];
$check(2 === (int) $catalog->deletionInfo('vendor', $vendor)['dependencies'], 'Bulk confirmation must count published and draft modules');
// Force failure after child deletion to verify the entire transaction rolls back.
$db->execute('RESET ROLE');
$db->execute("CREATE FUNCTION delete_qa_$suffix() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''Deletion QA rollback''; END'");
$db->execute("CREATE TRIGGER delete_qa_$suffix BEFORE DELETE ON partners FOR EACH ROW WHEN (OLD.slug = 'bulk-delete-$suffix') EXECUTE FUNCTION delete_qa_$suffix()");
$db->execute('SET ROLE pubsetup_app');
try {
    $catalog->deleteRecord('vendor', $vendor);
    throw new RuntimeException('Forced vendor deletion failure was ignored');
} catch (PDOException) {
    $check(null !== $catalog->vendor($vendor) && null !== $catalog->module($modules[0]) && null !== $catalog->module($modules[1]), 'Partial vendor deletion was not rolled back');
    $check($modules[0] === $db->fetchAll('SELECT extension_id FROM orders WHERE id=:id', ['id' => $order])[0]['extension_id'], 'Rollback lost the order association');
    $check(7 === (int) $db->fetchAll('SELECT module_clicks FROM module_metrics WHERE extension_id=:id', ['id' => $modules[0]])[0]['module_clicks'], 'Rollback lost module metrics');
}
$db->execute('RESET ROLE');
$db->execute("DROP TRIGGER delete_qa_$suffix ON partners");
$db->execute("DROP FUNCTION delete_qa_$suffix()");
$db->execute('SET ROLE pubsetup_app');
$check($catalog->deleteRecord('vendor', $vendor) && null === $catalog->vendor($vendor), 'Vendor with modules was not deleted with runtime permissions');
foreach (array_slice($modules, 0, 2) as $child) {
    $check(null === $catalog->module($child), 'Published or draft module survived vendor deletion');
    $check([] === $db->fetchAll('SELECT * FROM module_metrics WHERE extension_id=:id', ['id' => $child]) && [] === $db->fetchAll('SELECT * FROM catalog_source_state WHERE module_id=:id', ['id' => $child]), 'Vendor deletion left metrics or source state');
}
$savedOrder = $db->fetchAll('SELECT extension_id,amount FROM orders WHERE id=:id', ['id' => $order]);
$check(1 === count($savedOrder) && null === $savedOrder[0]['extension_id'] && 60.0 === (float) $savedOrder[0]['amount'], 'Vendor deletion removed or changed the order');
$history = $db->fetchAll('SELECT module_id,module_name,vendor_name FROM catalog_refresh_items WHERE run_id=:id', ['id' => $run]);
$check(1 === count($history) && null === $history[0]['module_id'] && 'Bulk deletion QA' === $history[0]['vendor_name'], 'Vendor deletion lost refresh history');
$check(null !== $catalog->vendor($otherVendor) && null !== $catalog->module($modules[2]) && 7 === (int) $db->fetchAll('SELECT module_clicks FROM module_metrics WHERE extension_id=:id', ['id' => $modules[2]])[0]['module_clicks'], 'Vendor deletion affected another vendor');
$catalog->deleteRecord('vendor', $otherVendor);
$db->execute('RESET ROLE');
$db->execute('DELETE FROM orders WHERE id=:id', ['id' => $order]);
$db->execute('DELETE FROM catalog_refresh_items WHERE run_id=:id', ['id' => $run]);
$db->execute('DELETE FROM catalog_refresh_runs WHERE id=:id', ['id' => $run]);
$db->execute('SET ROLE pubsetup_app');
$check(!$catalog->deleteRecord('module', 'invalid-id') && !$catalog->deleteRecord('vendor', $vendor), 'Missing records must not report successful deletion');
try {
    $catalog->deleteRecord('orders', $order);
    throw new RuntimeException('Unexpected deletion target accepted');
} catch (InvalidArgumentException) {
    $check(true, 'Unsupported deletion target rejected');
}
echo "Catalog deletion: $checks checks passed.\n";
