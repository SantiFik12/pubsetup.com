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

echo "Module importer: 10 checks passed.\n";
