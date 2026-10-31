<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Controller\ModuleClickController;
use App\Service\AdminCatalog;
use App\Service\AffiliateLinks;
use App\Service\CatalogService;
use App\Service\Database;
use Symfony\Component\HttpFoundation\Request;

$check = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$original = 'https://vendor.example/module.html?edition=pro#details';
$check($original === AffiliateLinks::resolve('', '', $original), 'Original fallback changed');
$check('https://individual.example/link' === AffiliateLinks::resolve('https://individual.example/link', '?ref=vendor', $original), 'Individual override lost');
$check('https://vendor.example/module.html?edition=pro&ref=vendor#details' === AffiliateLinks::resolve('', '?ref=vendor', $original), 'Query or fragment lost');
$check('https://vendor.example/other.html?ref=vendor' === AffiliateLinks::resolve('', '?ref=vendor', 'https://vendor.example/other.html'), 'Tracking parameter did not preserve product URL');
$check('https://tracking.example/?url='.rawurlencode($original) === AffiliateLinks::resolve('', 'https://tracking.example/?url={url_encoded}', $original), 'Encoded product placeholder broken');
$check($original === AffiliateLinks::resolve('', '{url}', $original), 'Raw product placeholder broken');
$check('https://tracking.example/vendor' === AffiliateLinks::resolve('', 'https://tracking.example/vendor', $original), 'Shared literal URL broken');
foreach (['javascript:alert(1)', 'https://user:pass@example.com/', 'https://example.com/{unknown}', str_repeat('a', 2049), "https://example.com/\r\nLocation:evil"] as $bad) {
    try {
        AffiliateLinks::validate($bad);
        throw new RuntimeException('Unsafe template accepted');
    } catch (InvalidArgumentException) {
    }
}
$check('?ref=vendor' === AffiliateLinks::validate(' ?ref=vendor '), 'Template trimming failed');
echo "Affiliate unit checks passed: inheritance, overrides, query/fragment handling, templates and URL validation.\n";

if (!getenv('ADMIN_TEST_DATABASE_URL')) {
    exit(0);
}
$db = new Database(getenv('ADMIN_TEST_DATABASE_URL'));
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$admin = new AdminCatalog($db);
$suffix = bin2hex(random_bytes(5));
$vendorInput = ['name' => 'Affiliate Test', 'slug' => 'affiliate-'.$suffix, 'website' => 'https://vendor.example', 'affiliate_template' => '?ref=first'];
$vendor = $admin->saveVendor($vendorInput, null);
$first = $admin->importModule('https://vendor.example/first-'.$suffix.'.html', '', $vendor, ['name' => 'First '.$suffix, 'description' => 'First module']);
$second = $admin->importModule('https://vendor.example/second-'.$suffix.'.html', 'https://individual.example/link', $vendor, ['name' => 'Second '.$suffix, 'description' => 'Second module']);
$otherVendor = $admin->saveVendor(['name' => 'Other Affiliate', 'slug' => 'other-affiliate-'.$suffix], null);
$other = $admin->importModule('https://other.example/'.$suffix, 'https://other.example/affiliate', $otherVendor, ['name' => 'Other '.$suffix, 'description' => 'Other module']);
$publicModule = static function (string $id) use ($db): array {
    foreach (new CatalogService($db)->all()['extensions'] as $module) {
        if ($id === $module['id']) {
            return $module;
        }
    }
    throw new RuntimeException('Module missing from public catalog');
};
$firstOriginal = $admin->module($first)['original_url'];
$check($firstOriginal.'?ref=first' === $publicModule($first)['affiliate_url'], 'Existing module did not inherit vendor link');
$check('https://individual.example/link' === $publicModule($second)['affiliate_url'], 'Individual override changed without bulk flag');
$admin->saveVendor(array_replace($vendorInput, ['affiliate_template' => '?ref=changed']), $vendor);
$check($firstOriginal.'?ref=changed' === $publicModule($first)['affiliate_url'], 'Vendor update did not affect inherited link');
$check('https://individual.example/link' === $publicModule($second)['affiliate_url'], 'Vendor update destroyed override');
$admin->saveVendor(array_replace($vendorInput, ['affiliate_template' => '?ref=all', 'apply_affiliate_all' => '1']), $vendor);
$check('' === $admin->module($second)['affiliate_url'], 'Bulk apply did not clear individual override');
$check($admin->module($second)['original_url'].'?ref=all' === $publicModule($second)['affiliate_url'], 'Bulk apply did not update second module');
$check('https://other.example/affiliate' === $admin->module($other)['affiliate_url'], 'Bulk apply affected another vendor');
$controller = new ModuleClickController();
$slug = $admin->module($first)['slug'];
$response = $controller->click(Request::create('/go/affiliate/'.$slug, 'GET'), 'affiliate', $slug, $db);
$check($firstOriginal.'?ref=all' === $response->getTargetUrl(), 'Public redirect disagrees with catalog');
$check(1 === (int) $db->fetchAll('SELECT affiliate_clicks FROM module_metrics WHERE extension_id=:id', ['id' => $first])[0]['affiliate_clicks'], 'Affiliate click counter broken');
$admin->updateFromSource($first, ['name' => 'Refreshed module']);
$check($firstOriginal.'?ref=all' === $publicModule($first)['affiliate_url'], 'Source refresh changed inheritance');
$admin->saveVendor(array_replace($vendorInput, ['affiliate_template' => '']), $vendor);
$check('' === $publicModule($first)['affiliate_url'], 'Removing vendor template did not restore original fallback');
$check($firstOriginal === $controller->click(Request::create('/', 'HEAD'), 'affiliate', $slug, $db)->getTargetUrl(), 'Redirect fallback after clearing template broken');
echo "Affiliate database checks passed: vendor save, inheritance, bulk changes, isolation, catalog, redirects and counters.\n";
