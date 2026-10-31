<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\ModuleSourceImporter;

$check = static function (bool $condition, string $message): void {
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

echo "Module importer: 35 checks passed.\n";
