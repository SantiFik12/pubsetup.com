<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Controller\ModuleClickController;
use App\Service\AdminCatalog;
use App\Service\CatalogService;
use App\Service\Database;
use App\Service\ModuleSourceImporter;
use Symfony\Component\HttpFoundation\Request;

if (!getenv('ADMIN_TEST_DATABASE_URL')) {
    exit(0);
}
$db = new Database(getenv('ADMIN_TEST_DATABASE_URL'));
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$check = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$admin = new AdminCatalog($db);
$source = 'https://seo-import.example/module-'.bin2hex(random_bytes(4)).'.html';
$fields = ModuleSourceImporter::extract('<html><head><title>Magento 2 Import SEO Widget</title><meta name="description" content="Imported product filtering widget."></head><body><h1>Magento 2 Import SEO Widget</h1><p>A product filtering widget from the source.</p></body></html>', $source);
$id = $admin->importModule($source, '', '', $fields);
$module = $admin->module($id);
$slug = $module['slug'];
$companionSource = 'https://seo-import.example/companion-'.bin2hex(random_bytes(4)).'.html';
$companionFields = ModuleSourceImporter::extract('<html><head><title>Magento 2 Import SEO Widget Companion</title><meta name="description" content="A related product filtering widget from the source."></head><body><h1>Magento 2 Import SEO Widget Companion</h1><p>A related product filtering widget from the source.</p></body></html>', $companionSource);
$companionId = $admin->importModule($companionSource, '', '', $companionFields);
$companionSlug = $admin->module($companionId)['slug'];
$before = new CatalogService($db)->all();
$check(in_array($slug, array_column($before['extensions'], 'slug'), true), 'New import missing from public catalog');
$response = new ModuleClickController()->click(Request::create('/go/module/'.$slug, 'GET'), 'module', $slug, $db);
$check('/extension/'.rawurlencode($slug) === $response->getTargetUrl(), 'Imported module has inconsistent redirect target');
$updated = ModuleSourceImporter::extract('<html><head><title>Magento 2 Stock Reporting</title><meta name="description" content="Updated source capabilities."></head><body><h1>Magento 2 Stock Reporting</h1><p>Updated stock reporting capabilities.</p></body></html>', $source);
$admin->updateFromSource($id, $updated);
$refreshed = $admin->module($id);
$check($slug === $refreshed['slug'], 'Source refresh changed an existing module URL');
$check($refreshed['name'] !== $module['name'], 'Source refresh did not update imported content');
$check($id === $admin->importModule($source, '', '', $updated), 'Repeated import duplicated a module');
$after = new CatalogService($db)->all();
$public = array_values(array_filter($after['extensions'], static fn (array $item): bool => $item['id'] === $id));
$check(1 === count($public) && $public[0]['slug'] === $slug, 'Refreshed module has inconsistent public URL');
$check(1 === (int) $public[0]['views'], 'Source refresh lost the existing click counter');
if ($path = getenv('SEO_IMPORT_SNAPSHOT')) {
    file_put_contents($path, json_encode(['slug' => $slug, 'companionSlug' => $companionSlug, 'before' => $before, 'after' => $after], JSON_THROW_ON_ERROR));
}
echo "SEO import checks passed: parser, new import, stable URL, refresh, repeated import and counters.\n";
