<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\ModuleImages;
use App\Service\ModuleSourceImporter;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

$checks = 0;
$check = static function (bool $condition, string $message) use (&$checks): void {
    ++$checks;
    if (!$condition) {
        throw new RuntimeException($message);
    }
};

// Mageworx renders separate thumbnail/full-size sliders and lazy-loads later slides.
$html = <<<'HTML'
<html><head><meta property="og:image" content="/module-icon.png"></head><body>
<header><a href="/docs/unrelated/">User guide</a></header>
<div class="menu"><a href="/product-attachments.html">Product Attachments Add videos, user guides, price lists and more</a></div>
<a href="#guide">User guide</a>
<div id="mw-card-links"><a href="https://support.mageworx.com/manuals/marketing-sales-suite/"><span>User guide</span><svg></svg></a></div>
<div class="mw-card-description"><div class="mw-card-option">Rewards program</div><div class="mw-card-option">Review reminders</div></div>
<div id="mw-slider"><img src="/thumb-1.png"><img data-src="/thumb-2.png"></div>
<ul id="mw-slider-gallery">
<li><img src="/full-1.png"></li>
<li data-t="/thumb-2.png"><img src="data:image/gif;base64,placeholder" data-src="//cdn.mageworx.com/full-2.png"></li>
<li><img data-src="/full-3.png"></li>
<li><img data-src="/full-3.png"></li>
<li><img src="data:image/gif;base64,placeholder"></li>
</ul>
<img data-src="/unrelated-banner.png">
<footer><a href="/manuals/unrelated/">User guide</a></footer>
</body></html>
HTML;
$source = 'https://www.mageworx.com/magento-2-marketing-and-sales-suite.html';
$parsed = ModuleSourceImporter::extract($html, $source);
$expected = ['https://www.mageworx.com/full-1.png', 'https://cdn.mageworx.com/full-2.png', 'https://www.mageworx.com/full-3.png'];
$check($expected === $parsed['_images'], 'Full-size gallery order, lazy images or deduplication failed');
$check($expected[0] === $parsed['_image'], 'Cover must use the first screenshot');
$check('https://support.mageworx.com/manuals/marketing-sales-suite/' === $parsed['user_guide_url'], 'Navigation text was mistaken for the product guide');
$check(['Rewards program', 'Review reminders'] === $parsed['features'], 'Mageworx product features missing');
$fallback = ModuleSourceImporter::extract('<div id="mw-slider"><img data-src="/preview.png"></div><img src="/banner.png">', $source);
$check(['https://www.mageworx.com/preview.png'] === $fallback['_images'], 'Thumbnail-only slider fallback failed');
$generic = ModuleSourceImporter::extract('<a href="/user-guides/">User Guides</a><footer><a href="/docs/other/">User Guide</a></footer>', $source);
$check(!isset($generic['user_guide_url']), 'Generic documentation or footer leaked into product guide');

$plumrocket = <<<'HTML'
<html><head><meta property="og:image" content="/module-icon.png"></head><body>
<div id="product-gallery-origin"><a href="javascript: " onclick="openPhotoSwipe(0)"><img src="/thumbnail.png"></a></div>
<script>
var items = [{"src":"/unrelated.png"}];
function openPhotoSwipe(index) {
    function stopVideo() { return; }
    var items = [{"src":"https:\/\/plumrocket.com\/media\/screenshot-1.png","w":1260,"h":820},{"src":"/media/screenshot-2.png","w":1260,"h":820},{"src":"/media/screenshot-2.png"},{"src":"/video.mp4","isVideo":true},{"html":"<iframe src='video'></iframe>","isVideo":true},{"src":"/video.mp4","type":"video"},{"src":"data:image/gif;base64,placeholder"}];
    new PhotoSwipe(element, ui, items, options);
}
</script>
</body></html>
HTML;
$plumrocketSource = 'https://plumrocket.com/magento-social-login-pro';
$screenshots = ModuleSourceImporter::extract($plumrocket, $plumrocketSource);
$check(['https://plumrocket.com/media/screenshot-1.png', 'https://plumrocket.com/media/screenshot-2.png'] === $screenshots['_images'], 'PhotoSwipe screenshots missing, unordered, or mixed with thumbnails/videos/unrelated arrays');
$check('https://plumrocket.com/media/screenshot-1.png' === $screenshots['_image'], 'PhotoSwipe first screenshot must replace the icon');
$invalidGallery = str_replace('"src":"https:', 'src:"https:', $plumrocket);
$invalid = ModuleSourceImporter::extract($invalidGallery, $plumrocketSource);
$check(['https://plumrocket.com/module-icon.png'] === $invalid['_images'], 'Invalid JavaScript must not be evaluated; metadata fallback required');
$unrelated = ModuleSourceImporter::extract('<meta property="og:image" content="/icon.png"><script>var items = [{"src":"/other.png"}];</script>', $plumrocketSource);
$check(['https://plumrocket.com/icon.png'] === $unrelated['_images'], 'Generic JavaScript items array must not be treated as a product gallery');

$firebear = <<<'HTML'
<meta property="og:price:amount" content="599.00"><meta property="og:price:currency" content="USD">
<meta property="og:image" content="/icon.png"><h1>Improved Import &amp; Export</h1>
<div class="product-view"><div class="features-slider"><ul><li>Scheduled import and export</li><li>Map product attributes</li></ul></div><img src="/partner-badge.png"></div>
<div class="support-links"><a href="/blog/improved-import-magento-2-extension-manual.html"><i></i> Extension manual</a></div>
<div class="product-img-box product-images"><div class="owl-carousel"><img src="/screen-1.png"><img data-src="/screen-2.png"></div></div>
<div class="features-slider"><li>Unrelated site feature</li></div>
HTML;
$firebearSource = 'https://firebearstudio.com/the-improved-import.html';
$firebearFields = ModuleSourceImporter::extract($firebear, $firebearSource);
$check('599.00' === $firebearFields['price_from'], 'Firebear Open Graph USD price missing');
$check('https://firebearstudio.com/blog/improved-import-magento-2-extension-manual.html' === $firebearFields['user_guide_url'], 'Firebear extension manual missing');
$check(['https://firebearstudio.com/screen-1.png', 'https://firebearstudio.com/screen-2.png'] === $firebearFields['_images'], 'Firebear product carousel missing or contains unrelated images');
$check(['Scheduled import and export', 'Map product attributes'] === $firebearFields['features'], 'Firebear product features missing or unrelated features leaked');
$check(!isset(ModuleSourceImporter::extract(str_replace('USD', 'EUR', $firebear), $firebearSource)['price_from']), 'Non-USD Open Graph price must not be imported as USD');

$mageplaza = <<<'HTML'
<meta property="og:image" content="/icon.png"><meta name="description" content="Fallback description">
<script type="application/ld+json">{
"@type":"Product","name":"One Step Checkout","description":"Product description",
"aggregateRating":{"ratingValue":"5.0","bestRating":5,"reviewCount":"227"},
"offers":{"price":"199","priceCurrency":"USD"},
"review":[{"reviewBody":"Line one
Line two with \"quotes\" and \\path"}]
}</script>
<section><div id="buy-now-mobile-target"><h1>Checkout</h1></div>
<div><img alt="tick icon"><div>Compatible with Hyva theme</div></div>
<div><img alt="tick icon"><div>Customize checkout on one page</div></div>
<div><img alt="tick icon"><div>Need API/GraphQL? Chat now</div></div></section>
<a href="https://docs.mageplaza.com/magento/one-step-checkout/standard">User Guide</a>
<div id="heroSlider">GALLERY</div>
<div id="heroSliderNav"><img src="/thumbnail.webp"></div>
<a data-fancybox="gallery" href="/unrelated.webp">Unrelated gallery</a>
HTML;
$gallery = '';
for ($index = 1; $index <= 28; ++$index) {
    $gallery .= '<a data-fancybox="gallery" href="//cdn2.mageplaza.com/shot-'.$index.'.webp"><img data-src="/thumb.webp"></a>';
}
$gallery .= '<a data-fancybox="gallery" href="//cdn2.mageplaza.com/shot-1.webp">Duplicate</a><a data-fancybox="gallery" data-type="iframe" href="/video.webp">Video</a><a data-fancybox="gallery" href="javascript:alert(1)">Invalid</a>';
$mageplaza = str_replace('GALLERY', $gallery, $mageplaza);
$mageplazaSource = 'https://www.mageplaza.com/magento-2-one-step-checkout-extension/';
$mageplazaFields = ModuleSourceImporter::extract($mageplaza, $mageplazaSource);
$check('199.00' === $mageplazaFields['price_from'] && 5.0 === $mageplazaFields['rating'] && 227 === $mageplazaFields['reviews'], 'JSON-LD with raw review newlines lost product data');
$check(28 === count($mageplazaFields['_images']) && 'https://cdn2.mageplaza.com/shot-28.webp' === $mageplazaFields['_images'][27], 'Mageplaza gallery truncated or contains unrelated/duplicate/video images');
$check('https://cdn2.mageplaza.com/shot-1.webp' === $mageplazaFields['_image'], 'Mageplaza cover must use the first screenshot');
$check(['Compatible with Hyva theme', 'Customize checkout on one page'] === $mageplazaFields['features'] && $mageplazaFields['hyva_compatible'], 'Product features or explicit Hyva compatibility missing');
$check('https://docs.mageplaza.com/magento/one-step-checkout/standard' === $mageplazaFields['user_guide_url'], 'Mageplaza standard guide missing');
$invalidJson = ModuleSourceImporter::extract('<h1>Fallback</h1><script type="application/ld+json">{"@type":"Product","name":runJavaScript()}</script>', $mageplazaSource);
$check('Fallback' === $invalidJson['name'], 'Invalid JSON syntax must not be evaluated or repaired');
$noHyva = ModuleSourceImporter::extract('<header>Hyva-ready extensions</header><section><div id="buy-now-mobile-target"><h1>Product</h1></div><div><img alt="tick icon"><div>Custom fields</div></div></section>', $mageplazaSource);
$check(!isset($noHyva['hyva_compatible']), 'Global Hyva marketing leaked into product compatibility');

$oldMageplaza = <<<'HTML'
<meta property="og:image" content="/icon.svg">
<div id="heroSlider"><img src="/icon.svg"><img src="data:image/svg+xml,placeholder" data-src="/Feature1.webp"><img data-src="/Feature2.webp"></div>
<div id="heroSliderNav"><img data-src="/thumb.webp"></div>
<div id="mp-screenshots"><a data-fancybox="gallery" href="/S1.webp"><img data-src="/thumb1.webp"></a><a data-fancybox="gallery" href="/S2.gif">Animation</a><a data-fancybox="gallery" href="/S3.webp">Screenshot</a></div>
<a data-fancybox="gallery" href="/unrelated.webp">Unrelated</a>
HTML;
$oldImages = ModuleSourceImporter::extract($oldMageplaza, $mageplazaSource);
$check(['https://www.mageplaza.com/Feature1.webp', 'https://www.mageplaza.com/Feature2.webp', 'https://www.mageplaza.com/S1.webp', 'https://www.mageplaza.com/S3.webp'] === $oldImages['_images'], 'Older Mageplaza hero or separate screenshots missing, or unsupported media leaked');
$check('https://www.mageplaza.com/Feature1.webp' === $oldImages['_image'], 'Unsupported SVG icon must not replace a usable raster cover');

$promotionalMageplaza = str_replace('<div id="heroSlider">', '<div id="heroSlider"><img alt="flash sale" src="/media/flash-slae/badge_installation_osc.png"><img alt="Free installation badge" src="/free-install.png">', $oldMageplaza);
$promotionalImages = ModuleSourceImporter::extract($promotionalMageplaza, $mageplazaSource);
$check($oldImages['_images'] === $promotionalImages['_images'] && $oldImages['_image'] === $promotionalImages['_image'], 'Promotional installation overlays must not enter the cover or gallery');

$wyomindSource = 'https://www.wyomind.com/magento2/google-shopping-magento.html';
$wyomind = <<<'HTML'
<html><body><h1>Simple Google Shopping</h1>
<nav id="breadcrumb"><a>Magento 2 extensions</a><a>Google Shopping and Data Feed Management</a></nav>
<div id="userguide"><p>Old instructions mention Magento 2.4.1</p><a href="https://devdocs.magento.com/docs/cron.html">Magento cron guide</a><a data-lightbox="overview" href="/pub/media/extensions/other/userguide/guide.png">Guide screenshot</a></div>
<div id="overview">
<div class="feature-1col"><p><strong>Product types</strong><br>Export all product types</p><p><strong>Library<br></strong>Find attributes</p>
<a data-lightbox="overview" href="/pub/media/extensions/sgs/overview/intro.gif">Animation</a>
<a data-lightbox="overview" href="/pub/media/extensions/sgs/overview/first.png"><img src="/thumbnail.png"></a>
<img src="/pub/media/extensions/sgs/overview/second.png">
<a data-lightbox="overview" href="/pub/media/extensions/sgs/overview/first.png">Duplicate</a></div>
<div class="feature-1col"><img src="/pub/media/templates/banner.jpg"></div>
<div class="feature-1col"><p><strong>Other module</strong><br>Unrelated feature</p><a data-lightbox="overview" href="/pub/media/extensions/sgs/overview/advert.png">Advert</a><a href="/magento2/data-feed-manager-magento.html">See more details</a></div>
</div>
<div id="compatibility"><ul><li>2.3.7</li><li>2.4.8</li><li>2.4.9</li><li>2.4.9</li><li>2.0.1</li></ul></div>
DEEP_REVIEWS
<script type="application/ld+json">{"@type":"Product","name":"Simple Google Shopping","brand":"Wyomind","description":"Export your products to Google Shopping","image":"/icon.png","offers":{"price":145,"priceCurrency":"EUR"},"aggregateRating":{"ratingValue":4.9,"reviewCount":545}}</script>
<script type="application/ld+json">{"@type":"Product","name":"Wyomind","aggregateRating":{"ratingValue":4.9,"reviewCount":2610}}</script>
</body></html>
HTML;
// Broken review markup pushes the JSON-LD past libxml's default depth limit.
$wyomind = str_replace('DEEP_REVIEWS', str_repeat('<div>', 300).str_repeat('</div>', 300), $wyomind);
$wyomindFields = ModuleSourceImporter::extract($wyomind, $wyomindSource);
$check('Wyomind' === $wyomindFields['_vendor'] && 4.9 === $wyomindFields['rating'] && 545 === $wyomindFields['reviews'], 'Wyomind product JSON-LD lost after deeply nested reviews or replaced by site-wide ratings');
$check(['https://www.wyomind.com/pub/media/extensions/sgs/overview/first.png', 'https://www.wyomind.com/pub/media/extensions/sgs/overview/second.png'] === $wyomindFields['_images'], 'Wyomind gallery must include originals and unlinked screenshots, excluding GIFs, thumbnails, documentation and other product promotions');
$check($wyomindFields['_images'][0] === $wyomindFields['_image'], 'Wyomind cover must use first supported product screenshot');
$check(['Product types: Export all product types', 'Library: Find attributes'] === $wyomindFields['features'], 'Wyomind features missing or mixed with other modules');
$check($wyomindSource.'?section=documentation#userguide' === $wyomindFields['user_guide_url'], 'Wyomind embedded manual replaced by a Magento guide');
$check(['2.3.7', '2.4.8', '2.4.9'] === $wyomindFields['magento_versions'], 'Wyomind versions must come from compatibility badges, not documentation');
$check('Google Shopping and Data Feed Management' === $wyomindFields['_categories'][0], 'Wyomind product category missing');
$check(!isset($wyomindFields['price_from']) && str_contains($wyomindFields['_warnings'][0], 'EUR'), 'Wyomind EUR price must warn without being imported as USD');
$withoutPanels = ModuleSourceImporter::extract(str_replace(['id="userguide"', 'id="compatibility"'], ['id="other-guide"', 'id="other-versions"'], $wyomind), $wyomindSource);
$check(!isset($withoutPanels['user_guide_url']) && !isset($withoutPanels['magento_versions']), 'Wyomind must not fall back to unrelated guide/version mentions');
$withoutPictures = ModuleSourceImporter::extract(str_replace('id="overview"', 'id="other-overview"', $wyomind), $wyomindSource);
$check(['https://www.wyomind.com/icon.png'] === $withoutPictures['_images'], 'Wyomind product icon fallback missing');

// Common Magento/Hyva and metadata fallbacks must continue to work alongside
// vendor-specific HTML. These IDs also occur on unrelated storefronts.
$common = <<<'HTML'
<meta property="og:image" content="/fallback.png"><meta name="description" content="Generic fallback description">
<h1>Fallback title</h1>
<script type="application/ld+json">{"@graph":[{"@type":"Product","name":"Privacy Module","brand":{"name":"Original Vendor"},"description":"Original product description","offers":{"price":159,"priceCurrency":"USD"},"aggregateRating":{"ratingValue":90,"bestRating":100,"reviewCount":12}}]}</script>
<div class="product attribute overview">Original product introduction</div>
<div class="amsite-features-block"><li>Hyvä-ready storefront</li><li>Customer privacy</li></div>
<a href="/user-guides/privacy/">User Guide</a>
<div>Magento 2.4.8-p5; 2.4.7-p10</div>
<div id="userguide">Other content</div><div id="compatibility"><li>2.4.1</li></div>
<div id="overview"><div class="feature-1col"><p><strong>Foreign feature</strong><br>Do not override the original</p><a data-lightbox="overview" href="/pub/media/extensions/other/overview/foreign.png">Foreign screenshot</a></div></div>
GALLERY
HTML;
$galleryFormats = [
    'Magento' => '<script type="text/x-magento-init">{"[data-gallery-role=gallery-placeholder]":{"mage/gallery/gallery":{"data":[{"full":"/original.png"},{"full":"/second.png"}]}}}</script>',
    'Hyva' => '<script>const gallery = {"initialImages":[{"full":"/original.png","type":"image"},{"full":"/second.png","type":"image"}],"active":0};</script>',
];
foreach (['www.amasty.com', 'www.mageworx.com', 'plumrocket.com', 'firebearstudio.com', 'www.mageplaza.com', 'unknown-vendor.example', 'wyomind.com.example', 'shop.wyomind.com'] as $host) {
    foreach ($galleryFormats as $format => $galleryHtml) {
        $origin = 'https://'.$host;
        $fields = ModuleSourceImporter::extract(str_replace('GALLERY', $galleryHtml, $common), $origin.'/products/privacy.html');
        $check('Privacy Module' === $fields['name'] && 'Original Vendor' === $fields['_vendor'] && 'Original product introduction' === $fields['short_description'], $host.': common product data changed');
        $check('159.00' === $fields['price_from'] && 4.5 === $fields['rating'] && 12 === $fields['reviews'] && !isset($fields['_warnings']), $host.': price, rating or warnings affected by another vendor');
        $check([$origin.'/original.png', $origin.'/second.png'] === $fields['_images'], $host.': '.$format.' gallery overridden by unrelated HTML');
        $check($origin.'/user-guides/privacy/' === $fields['user_guide_url'] && ['2.4.8-p5', '2.4.7-p10'] === $fields['magento_versions'], $host.': guide or versions overridden by Wyomind rules');
        $check(['Hyvä-ready storefront', 'Customer privacy'] === $fields['features'] && $fields['hyva_compatible'], $host.': features or Hyva compatibility changed');
    }
}
$genericFields = ModuleSourceImporter::extract('<h1>Generic module</h1><meta name="description" content="Generic description"><meta property="og:image" content="/cover.png">', 'https://unknown-vendor.example/module');
$check('Generic module' === $genericFields['name'] && 'Generic description' === $genericFields['description'] && ['https://unknown-vendor.example/cover.png'] === $genericFields['_images'], 'Unknown vendor must retain generic HTML/Open Graph fallback');
// Import order must not leak the previous vendor's fields or gallery.
$check($wyomindFields === ModuleSourceImporter::extract($wyomind, $wyomindSource), 'Interleaved vendor imports changed Wyomind results');

$usdHtml = '<div id="currency-switcher"><a>USD</a></div><div class="price-box"><span class="price">$164</span></div>';
$usdFields = ModuleSourceImporter::extract(str_replace('<h1>', $usdHtml.'<h1>', $wyomind), $wyomindSource);
$check('164.00' === $usdFields['price_from'] && !isset($usdFields['_warnings']), 'Selected Wyomind USD storefront price must override stale EUR JSON-LD without a currency warning');
$unconfirmedUsd = ModuleSourceImporter::extract(str_replace('<h1>', str_replace('>USD<', '>EUR<', $usdHtml).'<h1>', $wyomind), $wyomindSource);
$check(!isset($unconfirmedUsd['price_from']), 'Dollar symbol alone must not override the selected currency');
$thousands = ModuleSourceImporter::extract(str_replace('<h1>', str_replace('$164', '$1,234.50', $usdHtml).'<h1>', $wyomind), $wyomindSource);
$check('1234.50' === $thousands['price_from'], 'USD thousands and decimal separators parsed incorrectly');
$invalidPrice = ModuleSourceImporter::extract(str_replace('<h1>', str_replace('$164', '€145', $usdHtml).'<h1>', $wyomind), $wyomindSource);
$check(!isset($invalidPrice['price_from']), 'EUR visible price must not be imported as USD');
foreach ([
    $wyomindSource => $wyomindSource.'?c=usd',
    $wyomindSource.'?c=eur&ref=partner#overview' => $wyomindSource.'?c=usd&ref=partner',
    $wyomindSource.'?c=usd' => $wyomindSource.'?c=usd',
    'https://wyomind.com/product.html?ref=partner' => 'https://wyomind.com/product.html?ref=partner&c=usd',
    'https://www.mageplaza.com/product?c=eur#overview' => 'https://www.mageplaza.com/product?c=eur#overview',
    'https://wyomind.com.example/product?c=eur' => 'https://wyomind.com.example/product?c=eur',
] as $input => $expectedUrl) {
    $check($expectedUrl === ModuleSourceImporter::requestUrl($input), 'Currency request URL changed another vendor or lost existing query parameters: '.$input);
}
$check($wyomindSource === $usdFields['_source_url'], 'USD request must preserve original source identity');

$magezonSource = 'https://www.magezon.com/magento-2-form-builder.html';
$magezon = <<<'HTML'
<html><head><meta name="description" content="Build product forms"></head><body>
<div class="product-info-main"><h1>Magento 2 Form Builder Extension</h1>
<div class="product-reviews-summary"><div class="rating-summary"><div class="rating-result" title="96%"><span style="width:96%">96% of 100</span></div></div><div class="reviews-actions"><a class="action view" href="#reviews"><span>64</span>&nbsp;<span>Customer Reviews</span></a><a href="#review-form">Add Your Review</a></div></div>
<div class="price-box price-final_price" data-product-id="42"><span class="old-price"><span data-price-type="oldPrice" data-price-amount="199"><span class="price">$199.00</span></span></span><span data-price-type="finalPrice" data-price-amount="169"><span class="price">$169.00</span></span></div>
<div class="product-options-wrapper"><label>Installation Support + $50.00</label><label>Priority Support + $99.00</label></div>
</div>
<div class="product-reviews-summary"><div class="rating-result" title="95%"></div><div class="reviews-actions"><a class="action view">44 Customer Reviews</a></div></div>
<div class="price-box"><span data-price-type="finalPrice" data-price-amount="49"><span class="price">$49.00</span></span></div>
</body></html>
HTML;
$magezonFields = ModuleSourceImporter::extract($magezon, $magezonSource);
$check('169.00' === $magezonFields['price_from'], 'Magezon must use final product price, excluding old prices, options and integrations');
$check(4.8 === $magezonFields['rating'] && 64 === $magezonFields['reviews'], 'Magezon main review summary missing or replaced by a secondary marketing summary');
$magezonWithCurrency = str_replace('<h1>', '<meta itemprop="priceCurrency" content="USD"><h1>', $magezon);
$hiddenPrice = ModuleSourceImporter::extract(str_replace('$169.00', '', $magezonWithCurrency), $magezonSource);
$check('169.00' === $hiddenPrice['price_from'], 'Magezon numeric USD final price missing when the visible price is rendered by JavaScript');
$nonUsdMagezon = ModuleSourceImporter::extract(str_replace('content="USD"', 'content="EUR"', $magezonWithCurrency), $magezonSource);
$check(!isset($nonUsdMagezon['price_from']), 'Magezon explicit non-USD currency must not be imported as USD');
$visibleOnlyMagezon = ModuleSourceImporter::extract(str_replace('data-price-type="finalPrice" data-price-amount="169"', '', str_replace('<span class="old-price"><span data-price-type="oldPrice" data-price-amount="199"><span class="price">$199.00</span></span></span>', '', $magezon)), $magezonSource);
$check('169.00' === $visibleOnlyMagezon['price_from'], 'Magezon visible USD price fallback missing');
$withoutMain = ModuleSourceImporter::extract(str_replace('product-info-main', 'other-block', $magezon), $magezonSource);
$check(!isset($withoutMain['rating']) && !isset($withoutMain['reviews']) && !isset($withoutMain['price_from']), 'Magezon adapter must not read unrelated page content');
foreach (['https://other.example/product', 'https://magezon.com.example/product'] as $otherSource) {
    $otherFields = ModuleSourceImporter::extract($magezon, $otherSource);
    $check(!isset($otherFields['rating']) && !isset($otherFields['reviews']) && !isset($otherFields['price_from']), 'Magezon rules leaked into another vendor');
}
$invalidMagezon = ModuleSourceImporter::extract(str_replace(['title="96%"', '64</span>', 'data-price-amount="169"'], ['title="196%"', '-64</span>', 'data-price-amount="-169"'], $magezon), $magezonSource);
$check(!isset($invalidMagezon['rating']) && !isset($invalidMagezon['reviews']) && !isset($invalidMagezon['price_from']), 'Magezon invalid numeric data accepted');
$structuredMagezon = str_replace('<h1>', '<script type="application/ld+json">{"@type":"Product","offers":{"price":179,"priceCurrency":"USD"},"aggregateRating":{"ratingValue":4.7,"reviewCount":65}}</script><h1>', $magezon);
$structuredFields = ModuleSourceImporter::extract($structuredMagezon, $magezonSource);
$check('179.00' === $structuredFields['price_from'] && 4.7 === $structuredFields['rating'] && 65 === $structuredFields['reviews'], 'Magezon HTML fallback must preserve valid structured product data');

$magedelightSource = 'https://www.magedelight.com/elastic-search-magento-2.html';
$magedelightManual = 'https://docs.magedelight.com/display/MAG/Advanced+Search+-+Magento+2';
$magedelight = <<<'HTML'
<header><a href="https://docs.magedelight.com/">User Manuals</a></header>
<div class="guide-link user-linkbox"><svg><title>manual</title></svg><a href="https://docs.magedelight.com/display/MAG/Advanced+Search+-+Magento+2" rel="noindex,nofollow" target="_blank">User Manual</a></div>
<footer><a href="https://docs.magedelight.com/">User Manual</a></footer>
HTML;
$manualFields = ModuleSourceImporter::extract($magedelight, $magedelightSource);
$check($magedelightManual === $manualFields['user_guide_url'], 'Magedelight User Manual link missing or replaced by general documentation');
$check(!isset(ModuleSourceImporter::extract('<header><a href="https://docs.magedelight.com/">User Manual</a></header><footer><a href="https://docs.magedelight.com/">User Manual</a></footer>', $magedelightSource)['user_guide_url']), 'User Manual navigation/footer links must remain excluded');
$check(!isset(ModuleSourceImporter::extract('<a href="#manual">User Manual</a>', $magedelightSource)['user_guide_url']), 'User Manual anchor must not become a document URL');
$check(!isset(ModuleSourceImporter::extract('<a href="javascript:alert(1)">User Manual</a>', $magedelightSource)['user_guide_url']), 'Unsafe User Manual URL accepted');
$check(!isset(ModuleSourceImporter::extract('<a href="/related.html">Read our User Manual tips for another extension</a>', $magedelightSource)['user_guide_url']), 'Incidental manual mention mistaken for a guide label');
$check('https://other.example/manual.pdf' === ModuleSourceImporter::extract('<a href="/manual.pdf">User Manual</a>', 'https://other.example/product.html')['user_guide_url'], 'User Manual support must also work for other vendors');

$vendorIcon = ModuleSourceImporter::extract('<link rel="stylesheet" href="/style.css"><link rel="shortcut icon" href="/media/favicon/default/favicon.ico"><link rel="icon" href="/other.png">', $magedelightSource);
$check('https://www.magedelight.com/media/favicon/default/favicon.ico' === $vendorIcon['_vendor_logo'], 'Vendor favicon missing or wrong link type selected');
$invalidIcon = ModuleSourceImporter::extract('<link rel="icon" href="javascript:alert(1)"><link rel="apple-touch-icon" href="//cdn.example.com/icon.png">', $magedelightSource);
$check('https://cdn.example.com/icon.png' === $invalidIcon['_vendor_logo'], 'Invalid favicon must be skipped for supported icon fallback');
$check(!isset(ModuleSourceImporter::extract('<link rel="stylesheet" href="/style.css">', $magedelightSource)['_vendor_logo']), 'A vendor icon must not be invented from unrelated links');

$branding = '<link rel="icon" href="/favicon.ico"><header><a class="logo" href="/"><img src="/brand/logo.svg"></a></header><img alt="customer logo" src="/customer-logo.png">';
$brandingFields = ModuleSourceImporter::extract($branding, $magedelightSource);
$check('https://www.magedelight.com/brand/logo.svg' === $brandingFields['_vendor_logo'] && 'https://www.magedelight.com/favicon.ico' === $brandingFields['_vendor_favicon'], 'Header logo must take priority over favicon and unrelated customer logos');
$vectorBranding = ModuleSourceImporter::extract('<link rel="icon" href="/favicon.ico"><div class="logo"><a href="/"><svg viewBox="0 0 200 40"><path d="M0 0h20v20z"/></svg></a></div>', $magedelightSource);
$check(str_contains($vectorBranding['_vendor_logo_svg'], '<svg') && str_contains($vectorBranding['_vendor_logo_svg'], 'viewbox='), 'Inline site logo missing');
$check(!isset(ModuleSourceImporter::extract('<img alt="customer logo" src="/customer-logo.png">', $magedelightSource)['_vendor_logo']), 'Customer badges must not become site branding');

$meetanshiSource = 'https://meetanshi.com/magento-2-eu-guarantee-notice-garan-label.html';
$meetanshiGuide = 'https://meetanshi.com/docs/magento-2/eu-guarantee-notice-garan-label/';
$meetanshiMarkup = '<header><nav><a href="/docs/">Documentation</a><div class="user_guide"><i class="icon-book"></i><a href="'.$meetanshiGuide.'" target="_blank">User Guide</a></div></nav></header>';
$check($meetanshiGuide === ModuleSourceImporter::extract($meetanshiMarkup, $meetanshiSource)['user_guide_url'], 'Meetanshi product guide lost inside malformed header/nav nesting');
foreach (['https://other.example/module', 'https://meetanshi.com.example/module'] as $source) {
    $check(!isset(ModuleSourceImporter::extract($meetanshiMarkup, $source)['user_guide_url']), 'Meetanshi exception leaked to another vendor');
}
foreach (['https://other.example/docs/magento-2/product/', '/docs/', '/docs/magento-2/', '#guide', 'javascript:alert(1)'] as $href) {
    $markup = str_replace($meetanshiGuide, $href, $meetanshiMarkup);
    $check(!isset(ModuleSourceImporter::extract($markup, $meetanshiSource)['user_guide_url']), 'Meetanshi recovered an unrelated, generic or unsafe guide');
}
$footerGuide = str_replace(['<header><nav>', '</nav></header>'], ['<footer>', '</footer>'], $meetanshiMarkup);
$check(!isset(ModuleSourceImporter::extract($footerGuide, $meetanshiSource)['user_guide_url']), 'Meetanshi exception must not recover footer links');

$magefanSource = 'https://magefan.com/magento2-blog-extension';
$magefan = <<<'HTML'
<html><head><meta property="product:price:currency" content="USD"><script type="application/ld+json">{"@type":"Product","name":"Magento 2 Blog Extension","description":"Manage a Magento blog","offers":{"price":349,"priceCurrency":"USD"},"aggregateRating":{"ratingValue":4.85,"reviewCount":349},"image":"/module-icon.png"}</script></head><body>
<header><a href="/documentation">Documentation</a><span class="_hyva">Global compatibility</span></header>
<div class="product-sub-menu"><a href="/magento2-blog-extension/documentation">User Guide</a></div>
<main><div class="product-banner">
<div id="versionPlan"><input name="version" value="1797"><input name="version" value="1821"><input name="version" value="1824" checked></div>
<div class="price-box" data-product-id="1797" style="display:none"><span data-price-type="finalPrice" data-price-amount="149">$149</span></div>
<div class="price-box" data-product-id="1821"><span data-price-type="finalPrice" data-price-amount="299">$299</span></div>
<div class="price-box" data-product-id="1824"><span data-price-type="finalPrice" data-price-amount="349">$349</span></div>
<div class="price-box" data-product-id="99"><span data-price-type="finalPrice" data-price-amount="0">Free unrelated option</span><span data-price-type="oldPrice" data-price-amount="1">Old price</span></div>
<div class="product-slider"><picture><img src="/thumbnail.png" data-fancybox="gallery" data-src="//cm.magefan.com/catalog/product/first.png"></picture><div data-fancybox="gallery" data-src="https://cm.magefan.com/catalog/product/second.png"><img src="/thumb2.webp"></div><div style="display:none" data-fancybox="gallery" data-src="/hidden-original.webp"></div><div data-fancybox="gallery" data-src="/hidden-original.webp"></div><div data-fancybox="gallery" data-type="iframe" data-src="/video.png"></div><div data-fancybox="gallery" data-src="javascript:alert(1)"></div></div>
<div class="block-icon"><div class="_hyva">Compatible with Hyva</div><div class="_pwa">PWA ready</div></div><a class="live-demo" href="#live-demo">Live Demo</a>
</div>
<div class="all-features-block"><div class="item-title"><h3>Blog templates</h3></div><div class="item-title"><h3>AI blog writer</h3></div></div>
<div class="related-products"><span data-price-type="finalPrice" data-price-amount="9">$9</span><img data-fancybox="gallery" data-src="/unrelated.png"><h3>Other module</h3></div></main>
<footer><a href="/user-guides">Magefan User Guides</a></footer>
</body></html>
HTML;
$magefanFields = ModuleSourceImporter::extract($magefan, $magefanSource);
$check('149.00' === $magefanFields['price_from'], 'Magefan from-price must use the least expensive current-product plan, not selected Extra, old prices or unrelated options');
$check($magefanSource.'/documentation' === $magefanFields['user_guide_url'], 'Product-specific /documentation suffix was mistaken for a generic documentation directory');
$check(4.85 === $magefanFields['rating'] && 349 === $magefanFields['reviews'], 'Magefan structured review data lost');
$check(['https://cm.magefan.com/catalog/product/first.png', 'https://cm.magefan.com/catalog/product/second.png', 'https://magefan.com/hidden-original.webp'] === $magefanFields['_images'], 'Magefan originals missing or mixed with thumbnails, videos or unrelated products');
$check($magefanFields['_image'] === $magefanFields['_images'][0], 'Magefan screenshot must replace metadata icon as cover');
$check($magefanFields['hyva_compatible'] && $magefanFields['pwa_ready'] && $magefanFields['has_demo'], 'Magefan product compatibility/demo badges missing');
$check(['Blog templates', 'AI blog writer'] === $magefanFields['features'], 'Magefan summary features missing or mixed with recommendation/FAQ headings');
$noBadges = ModuleSourceImporter::extract(str_replace(['class="block-icon"', 'class="live-demo"'], ['class="other-icons"', 'class="other-link"'], $magefan), $magefanSource);
$check(!isset($noBadges['hyva_compatible']) && !isset($noBadges['pwa_ready']) && !isset($noBadges['has_demo']), 'Global Magefan compatibility or unrelated links leaked into product flags');
$eurMagefan = ModuleSourceImporter::extract(str_replace('USD', 'EUR', $magefan), $magefanSource);
$check(!isset($eurMagefan['price_from']), 'Magefan EUR plan prices treated as USD');
foreach (['https://unknown.example/product', 'https://magefan.com.example/product'] as $otherSource) {
    $otherMagefan = ModuleSourceImporter::extract($magefan, $otherSource);
    $check('349.00' === $otherMagefan['price_from'] && !isset($otherMagefan['pwa_ready']), 'Magefan rules changed another vendor');
}
$check(!isset(ModuleSourceImporter::extract('<a href="/documentation">User Guide</a>', $magefanSource)['user_guide_url']), 'Generic documentation directory must remain excluded');

$sizeChart = '<meta property="product:price:currency" content="EUR"><script type="application/ld+json">{"@type":"Product","name":"Size Chart","description":"Size chart templates","offers":{"price":89,"priceCurrency":"EUR"}}</script><div class="product-banner"><div data-product-id="2050"><span data-price-type="oldPrice" data-price-amount="149"></span><span data-price-type="finalPrice" data-price-amount="89"></span></div></div><div data-product-id="99"><span data-price-type="finalPrice" data-price-amount="0"></span></div>';
$sizeChartUrl = 'https://magefan.com/magento-2-size-chart?ref=partner';
$check(!isset(ModuleSourceImporter::extract($sizeChart, $sizeChartUrl)['price_from']), 'Size Chart EUR price must not be stored as USD');
foreach (['success', 'eur', 'unavailable', 'no-cookie', 'different-product', 'already-usd', 'other-vendor'] as $scenario) {
    $calls = [];
    $http = new MockHttpClient(static function (string $method, string $url, array $options) use (&$calls, $scenario, $sizeChart, $check): MockResponse {
        $calls[] = [$url, $options];
        if (1 === count($calls)) {
            return new MockResponse('already-usd' === $scenario ? str_replace('EUR', 'USD', $sizeChart) : $sizeChart);
        }
        if (2 === count($calls)) {
            $check('GET' === $method && str_contains($url, '/directory/currency/switch?') && str_contains($url, 'currency=USD'), 'Magefan did not use its currency switch');
            $check(0 === $options['max_redirects'], 'Currency switch must not follow redirects without session cookies');

            return new MockResponse('', ['http_code' => 'unavailable' === $scenario ? 503 : 302, 'response_headers' => 'no-cookie' === $scenario ? [] : ['set-cookie: PHPSESSID=isolated-session; Path=/; HttpOnly', 'set-cookie: X-Magento-Vary=usd-context; Path=/']]);
        }
        $check(str_contains(implode(';', $options['headers']), 'PHPSESSID=isolated-session') && str_contains(implode(';', $options['headers']), 'X-Magento-Vary=usd-context'), 'USD product request lost currency session cookies');
        $html = 'eur' === $scenario ? $sizeChart : str_replace('EUR', 'USD', $sizeChart);

        return new MockResponse('different-product' === $scenario ? str_replace('Size Chart', 'Another Product', $html) : $html);
    });
    $url = 'other-vendor' === $scenario ? 'https://magefan.com.example/product' : $sizeChartUrl;
    $importer = new ModuleSourceImporter($http, new ModuleImages('/tmp/unused-magefan-test-images'));
    // Mock HTTP must remain independent of external DNS while keeping the SSRF wrapper.
    $safeHttp = new ReflectionProperty(ModuleSourceImporter::class, 'safeHttp')->getValue($importer);
    $dnsCache = new ReflectionProperty($safeHttp, 'dnsCache')->getValue($safeHttp);
    $dnsCache[parse_url($url, PHP_URL_HOST)] = '93.184.216.34';
    $imported = $importer->inspect($url);
    if (in_array($scenario, ['success', 'already-usd'], true)) {
        $check('89.00' === $imported['price_from'] && $sizeChartUrl === $imported['_source_url'], 'Single-price Magefan import failed or changed original URL');
    } else {
        $check(!isset($imported['price_from']), 'Unavailable/unconfirmed USD price must preserve stored price');
        if ('other-vendor' !== $scenario) {
            $check(str_contains(implode(' ', $imported['_warnings']), 'USD'), 'Missing USD price must produce a warning');
        }
    }
    $check(count($calls) === (in_array($scenario, ['already-usd', 'other-vendor'], true) ? 1 : (in_array($scenario, ['unavailable', 'no-cookie'], true) ? 2 : 3)), 'Currency fallback made unexpected requests');
}

$swissupUrl = 'https://swissuplabs.com/magento-extensions/magento-2/one-step-checkout-extension-for-magento-2.html';
$swissupSummary = 'Drive revenue with Magento 2 One step checkout. Three awesome checkout layouts are available. The module allows you to show additional information on Magento Success Page.';
$swissup = '<meta name="description" content="'.$swissupSummary.'"><script type="application/ld+json">{"@type":"Product","name":"M2 Fire Checkout","description":"Full product description","offers":{"price":79,"priceCurrency":"USD"},"aggregateRating":{"ratingValue":99,"bestRating":100,"reviewCount":10}}</script><div class="product attribute overview"><p>Hyvä Luma fallback compatibility.</p><p>Please check our other website Firecheckout.net.</p><p>'.str_repeat('Long product introduction. ', 20).'</p><h3>One Step Checkout demo sites</h3><a href="https://demo.example">Three column layout</a></div>';
foreach ([$swissupUrl, str_replace('://swissuplabs.com', '://www.swissuplabs.com', $swissupUrl)] as $url) {
    $fields = ModuleSourceImporter::extract($swissup, $url);
    $check($swissupSummary === $fields['short_description'], 'Swissup summary must use concise metadata instead of promotional overview');
    $check('Full product description' === $fields['description'] && '79.00' === $fields['price_from'] && 10 === $fields['reviews'], 'Swissup summary rule changed full description, price or reviews');
}
$longSummary = $swissupSummary.' '.str_repeat('Additional product details. ', 20);
$shortened = ModuleSourceImporter::extract(str_replace($swissupSummary, $longSummary, $swissup), $swissupUrl)['short_description'];
$check(mb_strlen($shortened) <= 240 && str_ends_with($shortened, '.'), 'Long Swissup metadata must end at a complete sentence within the limit');
$noSentences = ModuleSourceImporter::extract(str_replace($swissupSummary, str_repeat('Useful checkout functionality ', 30), $swissup), $swissupUrl)['short_description'];
$check(mb_strlen($noSentences) <= 240 && preg_match('/\b(?:Useful|checkout|functionality)…$/u', $noSentences), 'Swissup fallback must preserve whole words');
$withoutMetadata = ModuleSourceImporter::extract(str_replace('<meta name="description" content="'.$swissupSummary.'">', '', $swissup), $swissupUrl)['short_description'];
$check('' !== $withoutMetadata && mb_strlen($withoutMetadata) <= 240, 'Missing Swissup metadata must retain a bounded fallback');
foreach (['https://unknown.example/product', 'https://swissuplabs.com.example/product'] as $url) {
    $unchanged = ModuleSourceImporter::extract($swissup, $url)['short_description'];
    $check(mb_strlen($unchanged) > 240 && str_contains($unchanged, 'Firecheckout.net'), 'Swissup summary rules changed another vendor');
}

$aitocUrl = 'https://www.aitoc.com/content-ai.html';
$aitocIntro = 'ContentAI automates product content creation for Magento stores using artificial intelligence. It generates descriptions and metadata from existing product attributes. Store administrators can configure prompts and review the generated content before publishing it.';
$aitocDetails = str_repeat('The extension provides configurable prompts for product attributes, supports multiple store views and helps teams manage their content workflow. ', 10).'The final paragraph remains complete.';
$aitoc = '<script type="application/ld+json">{"@type":"Product","name":"ContentAI for Magento 2","description":"ContentAI automates content creation. The module generates accurate text co","offers":{"price":125,"priceCurrency":"USD"}}</script><header><p>Header text must never become a product description, even when it is long enough.</p></header><main><aside><p>Installation and support offers must never become product descriptions.</p></aside><section id="overview"><p>'.$aitocIntro.'<script>Unwanted tracking code</script></p><ul><li>Feature list excluded from prose</li></ul><p>'.$aitocDetails.'</p></section><section id="changelog"><p>Changelog text is not part of the product introduction or its detailed description.</p></section></main><footer><p>Footer content must not become part of a description when importing an extension.</p></footer>';
foreach ([$aitocUrl, str_replace('www.', '', $aitocUrl)] as $url) {
    $fields = ModuleSourceImporter::extract($aitoc, $url);
    $check($aitocIntro."\n\n".$aitocDetails === $fields['description'], 'Aitoc full paragraphs were clipped, replaced by metadata or mixed with navigation/scripts');
    $check('ContentAI automates product content creation for Magento stores using artificial intelligence. It generates descriptions and metadata from existing product attributes.' === $fields['short_description'], 'Aitoc summary must contain whole sentences instead of a character slice');
    $check('125.00' === $fields['price_from'], 'Aitoc description handling changed pricing');
}
$fallbackLayout = ModuleSourceImporter::extract(str_replace('id="overview"', 'class="custom-product-content"', $aitoc), $aitocUrl);
$check($aitocIntro."\n\n".$aitocDetails === $fallbackLayout['description'], 'Aitoc main-content fallback lost complete paragraphs');
$metadataOnly = ModuleSourceImporter::extract('<script type="application/ld+json">{"@type":"Product","name":"ContentAI","description":"Content creation is automated for Magento stores. This source ends in the middle of a wor"}</script>', $aitocUrl);
$check('Content creation is automated for Magento stores.' === $metadataOnly['description'] && $metadataOnly['description'] === $metadataOnly['short_description'], 'Aitoc metadata fallback retained an unfinished sentence');
$longSentence = 'This extension '.str_repeat('automates product content creation and ', 10).'keeps the entire product introduction intact.';
$longIntro = ModuleSourceImporter::extract(str_replace($aitocIntro, $longSentence, $aitoc), $aitocUrl);
$check($longSentence === $longIntro['short_description'], 'Aitoc must retain a complete first sentence even when it exceeds 240 characters');
foreach (['https://unknown.example/product', 'https://aitoc.com.example/product'] as $url) {
    $check(ModuleSourceImporter::extract($aitoc, $url)['description'] !== $aitocIntro."\n\n".$aitocDetails, 'Aitoc extraction changed another vendor');
}

echo 'Module importer: '.$checks." checks passed.\n";
