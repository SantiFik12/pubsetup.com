<?php

declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
use App\Service\AdminCatalog;
use App\Service\Database;
use App\Service\ModuleImages;
use App\Service\ModuleSourceImporter;

$check = static function (bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } };
foreach (['javascript:alert(1)', 'file:///etc/passwd', 'https://user:password@example.com/private'] as $bad) {
    try {
        AdminCatalog::url($bad, true);
        throw new RuntimeException('Unsafe URL accepted');
    } catch (InvalidArgumentException) {
    }
}
$html = <<<'HTML'
<html><head><meta name="description" content="Fallback text"><script type="application/ld+json">{"@graph":[{"@type":"WebSite"},{"@type":"Product","name":"Test Module","description":"&lt;b&gt;Useful&lt;/b&gt; module","offers":{"price":"159.00","priceCurrency":"USD"},"aggregateRating":{"ratingValue":4.5,"reviewCount":2},"image":"https://example.com/cover.png"}]}</script></head></html>
HTML;
$fields = ModuleSourceImporter::extract($html);
$check('Test Module' === $fields['name'] && '159.00' === $fields['price_from'] && 2 === $fields['reviews'], 'Product metadata extraction failed');
$check(!isset($fields['affiliate_url']) && !isset($fields['slug']), 'Importer must not change owner-owned fields');
$nonUsd = ModuleSourceImporter::extract(str_replace('USD', 'EUR', $html));
$check(!isset($nonUsd['price_from']), 'Non-USD value was treated as USD');
$vendorHtml = <<<'HTML'
<html><head><script type="application/ld+json">{"@type":"Product","name":"Privacy Module","description":"Short product text","image":"/cover.png","aggregateRating":{"ratingValue":90,"bestRating":100,"reviewCount":2}}</script></head><body>
<div class="product attribute overview"><div class="value">Product introduction</div></div>
<div class="amsite-features-block"><ul><li>Hyvä-ready storefront</li><li>Customer privacy</li></ul></div>
<div class="amsite-description-tab"><h2>Product details</h2><p>Full description with product details and useful information about the extension.</p></div>
<div><span>Magento</span> 2.4.8-p5; 2.4.7-p10</div>
<a href="../user-guides/privacy/">User Guide</a>
<script>const gallery = {"initialImages":[{"full":"/shot-1.png","type":"image"},{"full":"//cdn.example.com/shot-2.png","type":"image"}],"active":0};</script>
<footer><a href="/user-guides/">User Guides</a><p>Unrelated footer</p></footer>
</body></html>
HTML;
$parsed = ModuleSourceImporter::extract($vendorHtml, 'https://example.com/products/privacy.html');
$check(4.5 === $parsed['rating'], 'Rating scale not normalized');
$check('Full description with product details and useful information about the extension.' === $parsed['description'] && 'Product introduction' === $parsed['short_description'], 'Full product text or overview missing');
$check('https://example.com/user-guides/privacy/' === $parsed['user_guide_url'], 'Relative User Guide URL not resolved');
$check($parsed['_images'] === ['https://example.com/shot-1.png', 'https://cdn.example.com/shot-2.png'], 'Product gallery missing');
$check($parsed['hyva_compatible'] && $parsed['magento_versions'] === ['2.4.8-p5', '2.4.7-p10'], 'Compatibility not extracted');
$images = new ModuleImages(sys_get_temp_dir().'/pubsetup-invalid-image-test');
try {
    $images->store('<?php echo "unsafe";');
    throw new RuntimeException('Executable upload accepted');
} catch (InvalidArgumentException) {
}
try {
    $images->store('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    throw new RuntimeException('SVG upload accepted');
} catch (InvalidArgumentException) {
}
echo "Admin unit checks passed: URLs, metadata, currency handling, upload types.\n";

if (!getenv('ADMIN_TEST_DATABASE_URL')) {
    exit(0);
}
$db = new Database(getenv('ADMIN_TEST_DATABASE_URL'));
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$admin = new AdminCatalog($db);
$imported = $admin->importModule('https://fixture-vendor.example/privacy.html', 'https://fixture-vendor.example/privacy.html?ref=ours', '', array_diff_key($parsed, ['_images' => true, '_image' => true]));
$importedAgain = $admin->importModule('https://fixture-vendor.example/privacy.html', '', '', ['name' => 'Updated privacy module', 'description' => 'Refreshed source']);
$importedModule = $admin->module($imported);
$check($importedAgain === $imported && 'https://fixture-vendor.example/privacy.html?ref=ours' === $importedModule['affiliate_url'] && $importedModule['published'], 'Import duplicated a module or lost its affiliate URL');
$check($importedModule['features'] === $parsed['features'] && $importedModule['user_guide_url'] === $parsed['user_guide_url'], 'Import did not save extracted content');
$vendor = $admin->saveVendor(['name' => 'QA Vendor', 'slug' => 'qa-vendor', 'website' => 'https://example.com'], null);
$category = $admin->categories()[0]['id'];
$input = ['name' => 'QA Module', 'slug' => 'qa-module', 'partner_id' => $vendor, 'category_id' => $category, 'original_url' => 'https://example.com/module', 'affiliate_url' => 'https://example.com/module?ref=ours', 'user_guide_url' => 'https://example.com/readme', 'price_from' => '159', 'price_type' => 'one-time', 'install_price' => '60', 'description' => 'Original text', 'short_description' => 'Short text', 'gallery' => '', 'cover_image' => '', 'features' => "One\nTwo", 'tags' => 'one, two', 'magento_versions' => '2.4.8', 'published' => '1'];
$id = $admin->saveModule($input, null);
$admin->updateFromSource($id, ['name' => 'Updated source title', 'description' => 'New description', 'affiliate_url' => 'https://attacker.example', 'slug' => 'changed-slug']);
$module = $admin->module($id);
$check($module['affiliate_url'] === $input['affiliate_url'] && 'qa-module' === $module['slug'] && 'Updated source title' === $module['name'], 'Refresh replaced affiliate URL or slug');
$check($module['features'] === ['One', 'Two'] && $module['tags'] === ['one', 'two'], 'Arrays lost their types');
$admin->saveModule(array_diff_key($input, ['published' => true]), $id);
$check(false === $admin->module($id)['published'], 'Module draft was not saved');
$public = new App\Service\CatalogService($db)->all();
$check(!in_array('qa-module', array_column($public['extensions'], 'slug'), true), 'Draft leaked into public catalog');
$check($admin->totals()['modules'] > 0 && [] !== $admin->modules($vendor, 'QA'), 'Vendor modules unavailable');
echo "Admin database checks passed: vendor/module edits, refresh invariants, drafts and counters.\n";
