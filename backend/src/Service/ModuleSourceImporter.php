<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\HttpClient\NoPrivateNetworkHttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class ModuleSourceImporter
{
    private HttpClientInterface $safeHttp;

    public function __construct(HttpClientInterface $http, private ModuleImages $images)
    {
        $this->safeHttp = new NoPrivateNetworkHttpClient($http);
    }

    private function download(string $url, int $limit): string
    {
        AdminCatalog::url($url, true);
        $response = $this->safeHttp->request('GET', $url, [
            'timeout' => 10, 'max_duration' => 20, 'max_redirects' => 3,
            'headers' => ['User-Agent' => 'pubsetup.com catalog updater/1.0', 'Accept' => 'text/html,image/*;q=0.9,*/*;q=0.5'],
            'on_progress' => static function (int $now, int $total) use ($limit): void {
                if ($now > $limit || $total > $limit) {
                    throw new \LengthException('Источник возвращает слишком большой файл.');
                }
            },
        ]);
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            $response->cancel();
            throw new \RuntimeException('Источник недоступен. Проверьте ссылку или заполните данные вручную.');
        }
        $content = $response->getContent();
        if (strlen($content) > $limit) {
            throw new \LengthException('Источник возвращает слишком большой файл.');
        }

        return $content;
    }

    private static function structuredData(string $json): ?array
    {
        $value = json_decode($json, true, 64);
        if (JSON_ERROR_CTRL_CHAR === json_last_error()) {
            // Some vendors put literal newlines in review strings. Escape control characters
            // inside JSON strings only; retain normal whitespace and reject other syntax errors.
            $fixed = '';
            $inString = false;
            $escaped = false;
            for ($i = 0, $length = strlen($json); $i < $length; ++$i) {
                $char = $json[$i];
                if ('"' === $char && !$escaped) {
                    $inString = !$inString;
                }
                $fixed .= $inString && ord($char) < 32 ? sprintf('\\u%04x', ord($char)) : $char;
                $escaped = '\\' === $char && !$escaped;
            }
            $value = json_decode($fixed, true, 64);
        }

        return is_array($value) ? $value : null;
    }

    public static function extract(string $html, string $url = ''): array
    {
        $isWyomind = in_array(strtolower(parse_url($url, PHP_URL_HOST) ?? ''), ['wyomind.com', 'www.wyomind.com'], true);
        $document = new \DOMDocument();
        $previous = libxml_use_internal_errors(true);
        try {
            // Wyomind's malformed reviews exceed libxml's default depth and hide
            // its JSON-LD. Keep the existing parser limits for every other vendor.
            // Downloads remain bounded to 3 MiB and external entities stay disabled.
            $flags = LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING;
            if ($isWyomind) {
                $flags |= LIBXML_PARSEHUGE;
            }
            $document->loadHTML('<?xml encoding="UTF-8">'.$html, $flags);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
        $xpath = new \DOMXPath($document);
        $meta = static function (string $key) use ($xpath): string {
            $node = $xpath->query('//meta[@property="'.$key.'" or @name="'.$key.'"]/@content')->item(0);

            return $node ? trim($node->textContent) : '';
        };
        $findProduct = static function (array $data) use (&$findProduct): ?array {
            $types = (array) ($data['@type'] ?? []);
            if (in_array('Product', $types, true) || in_array('SoftwareApplication', $types, true)) {
                return $data;
            }
            foreach ($data as $entry) {
                if (is_array($entry) && ($found = $findProduct($entry))) {
                    return $found;
                }
            }

            return null;
        };
        $product = [];
        foreach ($xpath->query('//script[@type="application/ld+json"]') as $node) {
            $value = self::structuredData($node->textContent);
            if (is_array($value) && ($found = $findProduct($value))) {
                $product = $found;
                break;
            }
        }
        $clean = static fn (mixed $value, int $max): string => is_scalar($value) ? mb_substr(trim(preg_replace('/\s+/u', ' ', strip_tags(html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8')))), 0, $max) : '';
        $title = $clean($product['name'] ?? ($xpath->query('//h1')->item(0)?->textContent ?: $meta('og:title')), 250);
        $description = $clean($product['description'] ?? ($meta('description') ?: $meta('og:description')), 10000);
        $result = [];
        if ('' !== $title) {
            $result['name'] = $title;
        }
        if ('' !== $description) {
            $result['description'] = $description;
            $result['short_description'] = mb_substr($description, 0, 240);
        }
        $categories = [];
        $productCategories = [];
        $collectCategories = static function (array $value) use (&$collectCategories, &$categories, &$productCategories, $clean, $title): void {
            $types = (array) ($value['@type'] ?? []);
            if (in_array('Product', $types, true) || in_array('SoftwareApplication', $types, true)) {
                foreach ((array) ($value['category'] ?? []) as $category) {
                    $name = $clean(is_array($category) ? ($category['name'] ?? '') : $category, 200);
                    if ('' !== $name) {
                        $productCategories[] = $name;
                    }
                }
            }
            if (in_array('BreadcrumbList', $types, true)) {
                foreach ($value['itemListElement'] ?? [] as $entry) {
                    $name = $clean($entry['name'] ?? ($entry['item']['name'] ?? ''), 200);
                    if ('' !== $name && $name !== $title) {
                        $categories[] = $name;
                    }
                }
            }
            foreach ($value as $entry) {
                if (is_array($entry)) {
                    $collectCategories($entry);
                }
            }
        };
        foreach ($xpath->query('//script[@type="application/ld+json"]') as $node) {
            $value = self::structuredData($node->textContent);
            if (is_array($value)) {
                $collectCategories($value);
            }
        }
        foreach ($xpath->query('//*[contains(concat(" ",normalize-space(@class)," ")," breadcrumbs ")]//a | //nav[@aria-label="Breadcrumb"]//a') as $node) {
            $name = $clean($node->textContent, 200);
            if ('' !== $name && $name !== $title) {
                $categories[] = $name;
            }
        }
        $result['seo_source_title'] = $clean($xpath->query('//title')->item(0)?->textContent ?: $meta('og:title'), 1000);
        $result['seo_source_description'] = $clean($meta('description') ?: $meta('og:description'), 4000);
        $result['_categories'] = array_values(array_unique([...$productCategories, ...array_reverse($categories)]));
        $result['_source_url'] = $url;
        $offer = $product['offers'] ?? [];
        if (isset($offer[0])) {
            $offer = $offer[0];
        }
        $price = $offer['price'] ?? $offer['lowPrice'] ?? null;
        if (is_numeric($price) && (float) $price >= 0 && (float) $price < 100000000 && 'USD' === strtoupper((string) ($offer['priceCurrency'] ?? ''))) {
            $result['price_from'] = number_format((float) $price, 2, '.', '');
        }
        $rating = $product['aggregateRating'] ?? [];
        $best = (float) ($rating['bestRating'] ?? 5);
        if (isset($rating['ratingValue']) && is_numeric($rating['ratingValue']) && $best > 0 && (float) $rating['ratingValue'] >= 0 && (float) $rating['ratingValue'] <= $best) {
            $result['rating'] = round((float) $rating['ratingValue'] / $best * 5, 2);
            $count = $rating['reviewCount'] ?? $rating['ratingCount'] ?? null;
            if (is_numeric($count) && $count >= 0 && $count < 2147483647) {
                $result['reviews'] = (int) $count;
            }
        }
        foreach (['product:price', 'og:price'] as $priceKey) {
            if (!isset($result['price_from']) && 'USD' === strtoupper($meta($priceKey.':currency')) && is_numeric($meta($priceKey.':amount'))) {
                $price = (float) $meta($priceKey.':amount');
                if ($price >= 0 && $price < 100000000) {
                    $result['price_from'] = number_format($price, 2, '.', '');
                }
            }
        }
        $class = static fn (string $name): string => 'contains(concat(" ",normalize-space(@class)," ")," '.$name.' ")';
        // Only product content: exclude scripts, navigation, recommendations and footer.
        $overview = $xpath->query('//*['.$class('product').' and '.$class('overview').']')->item(0);
        if ($overview && ($text = $clean($overview->textContent, 1800)) !== '') {
            $result['short_description'] = $text;
        }
        $body = $xpath->query('//*['.$class('amsite-description-tab').'] | //*[@id="description"] | //*[@itemprop="description"]')->item(0);
        if ($body) {
            $paragraphs = [];
            foreach ($xpath->query('.//p[not(ancestor::script) and not(ancestor::style)]', $body) as $node) {
                $text = $clean($node->textContent, 1500);
                if (mb_strlen($text) >= 60 && !preg_match('/trusted by|frequently asked|related products|unleash the power/iu', $text)) {
                    $paragraphs[] = $text;
                }
                if (count($paragraphs) >= 2) {
                    break;
                }
            }
            if ([] !== $paragraphs) {
                $result['description'] = mb_substr(implode("\n\n", array_unique($paragraphs)), 0, 1200);
            }
        }
        $features = [];
        foreach ($xpath->query('//*['.$class('amsite-features-block').']//li | //*[@itemprop="featureList"] | //*['.$class('mw-card-description').']//*['.$class('mw-card-option').'] | //*['.$class('product-view').']//*['.$class('features-slider').']//li') as $node) {
            if (($text = $clean($node->textContent, 400)) !== '') {
                $features[] = $text;
            }
        }
        // Mageplaza's product summary uses icon/text rows rather than a feature list.
        foreach ($xpath->query('//*[@id="buy-now-mobile-target"]/parent::*//div[img[@alt="tick icon"]]/div') as $node) {
            $text = $clean($node->textContent, 400);
            if ('' !== $text && !preg_match('/chat now/iu', $text)) {
                $features[] = $text;
            }
        }
        if ([] !== $features) {
            $result['features'] = array_slice(array_values(array_unique($features)), 0, 20);
            if (preg_match('/hyv[äa].*(?:ready|compatible)|(?:ready|compatible).*hyv[äa]/iu', implode(' ', $features))) {
                $result['hyva_compatible'] = true;
            }
        }
        $guideScore = 0;
        foreach ($xpath->query('//a[@href and not(ancestor::nav) and not(ancestor::header) and not(ancestor::footer)]') as $node) {
            if (!$node instanceof \DOMElement) {
                continue;
            }
            $href = self::resolveUrl($url, $node->getAttribute('href'));
            $label = $clean($node->textContent.' '.$node->getAttribute('aria-label'), 300);
            $guidePath = parse_url($href, PHP_URL_PATH) ?? '';
            $exactLabel = (bool) preg_match('/^(?:user[ -]?guide|readme|documentation|(?:extension )?manual|installation guide)(?:\s*↗)?$/iu', $label);
            $documentPath = (bool) preg_match('~/(?:user-guides?|docs?|documentation|manuals?)/.+~i', $guidePath);
            $score = ($exactLabel ? 2 : 0) + ($documentPath ? 1 : 0);
            // Ignore a generic documentation directory from the site's footer.
            if ($score > $guideScore
                && !str_starts_with(trim($node->getAttribute('href')), '#')
                && !preg_match('~/(?:user-guides?|docs?|documentation|manuals?)/?$~i', $guidePath)) {
                try {
                    $result['user_guide_url'] = AdminCatalog::url($href, true);
                    $guideScore = $score;
                } catch (\InvalidArgumentException) {
                }
            }
        }
        $versions = [];
        foreach ($xpath->query('//text()[not(ancestor::script) and not(ancestor::style) and contains(.,"2.4.") and string-length(.) < 1000]') as $node) {
            if (preg_match_all('/\b2\.[34]\.\d+(?:-p\d+)?\b/', $node->textContent, $matches)) {
                $versions = $matches[0];
                break;
            }
        }
        if ([] !== $versions) {
            $result['magento_versions'] = array_slice(array_values(array_unique($versions)), 0, 20);
        }
        $brand = $product['brand'] ?? ($offer['seller'] ?? []);
        $result['_vendor'] = $clean(is_array($brand) ? ($brand['name'] ?? '') : $brand, 150) ?: $clean($meta('og:site_name'), 150);
        $pictures = [];
        $image = $product['image'] ?? $meta('og:image');
        foreach (is_array($image) && !isset($image['url']) ? $image : [$image] as $entry) {
            $picture = is_array($entry) ? ($entry['url'] ?? $entry['contentUrl'] ?? '') : $entry;
            if (is_string($picture) && '' !== $picture) {
                $pictures[] = self::resolveUrl($url, $picture);
            }
        }
        $fallbackPictures = $pictures;
        $pictures = [];
        // Older Mageplaza pages use unlinked hero images and a separate screenshots block.
        // SVG icons and GIF animations are not supported by our raster image storage.
        foreach ($xpath->query('//*[@id="heroSlider"]//img[not(ancestor::a[@data-fancybox="gallery"])]') as $node) {
            if (!$node instanceof \DOMElement) {
                continue;
            }
            $picture = $node->getAttribute('data-src') ?: $node->getAttribute('src');
            // Promotional overlays are repeated inside slides but are not product images.
            if (preg_match('/flash sale|free installation|badge[_-]installation/iu', $node->getAttribute('alt').' '.$picture)) {
                continue;
            }
            if (preg_match('~\.(?:png|jpe?g|webp)(?:[?#]|$)~i', $picture)) {
                $pictures[] = self::resolveUrl($url, $picture);
            }
        }
        // Mageplaza's main slider links to the originals; thumbnail and feature media repeat them.
        foreach ($xpath->query('//*[@id="heroSlider" or @id="mp-screenshots"]//a[@data-fancybox="gallery" and @href]') as $node) {
            if ($node instanceof \DOMElement && !in_array($node->getAttribute('data-type'), ['iframe', 'video'], true)) {
                $picture = $node->getAttribute('href');
                if (preg_match('~\.(?:png|jpe?g|webp)(?:[?#]|$)~i', $picture)) {
                    $pictures[] = self::resolveUrl($url, $picture);
                }
            }
        }
        // Firebear renders its screenshot carousel directly in the product-images block.
        foreach ($xpath->query('//*['.$class('product-img-box').' and '.$class('product-images').']//img') as $node) {
            if (!$node instanceof \DOMElement) {
                continue;
            }
            $picture = $node->getAttribute('data-src') ?: $node->getAttribute('src');
            if ('' !== $picture && !str_starts_with($picture, 'data:')) {
                $pictures[] = self::resolveUrl($url, $picture);
            }
        }
        // Plumrocket keeps full-size screenshots in the PhotoSwipe opener as a JSON array.
        // Decode only that array; never execute the surrounding JavaScript or import video HTML.
        foreach ($xpath->query('//script[not(@src)]') as $node) {
            if (!preg_match('/function\s+openPhotoSwipe\s*\([^)]*\)\s*\{.*?\b(?:var|let|const)\s+items\s*=\s*(\[.*?\])\s*;/s', $node->textContent, $match)) {
                continue;
            }
            $gallery = json_decode($match[1], true);
            foreach (is_array($gallery) ? $gallery : [] as $entry) {
                if (!is_array($entry) || !empty($entry['isVideo']) || isset($entry['html']) || ($entry['type'] ?? 'image') !== 'image') {
                    continue;
                }
                $picture = $entry['src'] ?? '';
                if (is_string($picture) && '' !== $picture && !str_starts_with($picture, 'data:')) {
                    $pictures[] = self::resolveUrl($url, $picture);
                }
            }
        }
        // Mageworx uses HTML sliders with lazy-loaded full-size images, not Magento gallery JSON.
        foreach (['mw-slider-gallery', 'mw-slider'] as $slider) {
            foreach ($xpath->query('//*[@id="'.$slider.'"]//img') as $node) {
                if (!$node instanceof \DOMElement) {
                    continue;
                }
                $picture = $node->getAttribute('data-src') ?: $node->getAttribute('src');
                if ('' !== $picture && !str_starts_with($picture, 'data:')) {
                    $pictures[] = self::resolveUrl($url, $picture);
                }
            }
            if ([] !== $pictures) {
                break;
            }
        }
        // Hyvä galleries expose JSON data inside a script; never evaluate JavaScript.
        if (preg_match('/["\']initialImages["\']\s*:\s*(\[.*?\])\s*,/s', $html, $match)) {
            $gallery = json_decode($match[1], true);
            foreach (is_array($gallery) ? $gallery : [] as $entry) {
                if (($entry['type'] ?? 'image') !== 'image') {
                    continue;
                }
                $picture = $entry['full'] ?? $entry['img'] ?? '';
                if (is_string($picture) && '' !== $picture) {
                    $pictures[] = self::resolveUrl($url, $picture);
                }
            }
        }
        foreach ($xpath->query('//script[@type="text/x-magento-init"]') as $node) {
            $config = json_decode($node->textContent, true);
            $collectGallery = static function (array $values) use (&$collectGallery, &$pictures, $url): void {
                if (isset($values['full']) && is_string($values['full'])) {
                    $pictures[] = self::resolveUrl($url, $values['full']);
                }
                foreach ($values as $value) {
                    if (is_array($value)) {
                        $collectGallery($value);
                    }
                }
            };
            if (is_array($config)) {
                $collectGallery($config);
            }
        }
        // Product gallery order matches the visible vendor page; metadata often contains only a module icon.
        if ([] === $pictures) {
            $pictures = $fallbackPictures;
        }
        if ([] !== $pictures) {
            $result['_images'] = array_slice(array_values(array_unique($pictures)), 0, 32);
            $result['_image'] = $result['_images'][0];
        }

        if ($isWyomind) {
            $result = self::wyomindData($xpath, $url, $result);
            if (isset($offer['priceCurrency']) && 'USD' !== strtoupper((string) $offer['priceCurrency'])) {
                $result['_warnings'][] = 'Цена источника указана в '.$offer['priceCurrency'].'. Укажите цену в USD вручную; автоматическая конвертация не выполняется.';
            }
        }

        return array_replace($result, ModuleSeo::generate($result));
    }

    private static function wyomindData(\DOMXPath $xpath, string $url, array $result): array
    {
        $clean = static fn (string $html): string => trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags(preg_replace('~<br\s*/?>~i', ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        // The overview ends with promotions for other extensions. Exclude the
        // entire content block linking to another product, including its images.
        $pictures = [];
        $features = [];
        foreach ($xpath->query('//*[@id="overview"]/div[contains(concat(" ",normalize-space(@class)," ")," feature-1col ")]') as $block) {
            foreach ($xpath->query('.//a[@href]', $block) as $link) {
                if (!$link instanceof \DOMElement) {
                    continue;
                }
                $path = parse_url(self::resolveUrl($url, $link->getAttribute('href')), PHP_URL_PATH) ?? '';
                if (str_starts_with($path, '/magento2/') && str_ends_with($path, '.html') && $path !== parse_url($url, PHP_URL_PATH)) {
                    continue 2;
                }
            }
            foreach ($xpath->query('.//p[strong and .//br]', $block) as $node) {
                $text = preg_replace('/\s+:/u', ':', $clean(str_replace('</strong>', ': ', $node->ownerDocument->saveHTML($node))));
                if ('' !== $text) {
                    $features[] = mb_substr($text, 0, 400);
                }
            }
            foreach ($xpath->query('.//a[@data-lightbox and @href] | .//img[not(ancestor::a[@data-lightbox])]', $block) as $node) {
                if (!$node instanceof \DOMElement) {
                    continue;
                }
                $reference = 'a' === $node->nodeName ? $node->getAttribute('href') : ($node->getAttribute('data-src') ?: $node->getAttribute('src'));
                $picture = self::resolveUrl($url, $reference);
                if (preg_match('~^https?://.+/pub/media/extensions/.+/overview/.+\.(?:png|jpe?g|webp)(?:[?#]|$)~i', $picture)) {
                    $pictures[] = $picture;
                }
            }
        }
        if ([] !== $pictures) {
            $result['_images'] = array_slice(array_values(array_unique($pictures)), 0, 32);
            $result['_image'] = $result['_images'][0];
        }
        if ([] !== $features) {
            $result['features'] = array_slice(array_values(array_unique($features)), 0, 20);
        }
        // This vendor embeds the product manual; generic guide scanning finds
        // unrelated Magento instructions inside it instead.
        unset($result['user_guide_url'], $result['magento_versions']);
        if ($xpath->query('//*[@id="userguide"]')->length > 0) {
            $result['user_guide_url'] = strtok($url, '?#').'?section=documentation#userguide';
        }
        $versions = [];
        foreach ($xpath->query('//*[@id="compatibility"]//li') as $node) {
            $version = trim($node->textContent);
            if (preg_match('/^2\.[34](?:\.\d+)?(?:-p\d+)?$/', $version)) {
                $versions[] = $version;
            }
        }
        if ([] !== $versions) {
            $result['magento_versions'] = array_slice(array_values(array_unique($versions)), -20);
        }
        $categories = [];
        foreach ($xpath->query('//*[@id="breadcrumb"]//a') as $node) {
            $categories[] = $clean($node->textContent);
        }
        $result['_categories'] = array_values(array_unique([...array_reverse($categories), ...$result['_categories']]));

        return $result;
    }

    public static function resolveUrl(string $base, string $reference): string
    {
        $reference = trim(html_entity_decode($reference, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $reference)) {
            return $reference;
        }
        $parts = parse_url($base);
        if (!$parts || !isset($parts['host'])) {
            return $reference;
        }
        if (str_starts_with($reference, '//')) {
            return ($parts['scheme'] ?? 'https').':'.$reference;
        }
        $origin = ($parts['scheme'] ?? 'https').'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
        $path = str_starts_with($reference, '/') ? $reference : preg_replace('~/[^/]*$~', '/', $parts['path'] ?? '/').$reference;
        $segments = [];
        foreach (explode('/', $path) as $segment) {
            if ('..' === $segment) {
                array_pop($segments);
            } elseif ('.' !== $segment && '' !== $segment) {
                $segments[] = $segment;
            }
        }

        return $origin.'/'.implode('/', $segments).(str_ends_with($path, '/') && [] !== $segments ? '/' : '');
    }

    public function fetch(string $url): array
    {
        $data = self::extract($this->download($url, 3 * 1024 * 1024), $url);
        if (empty($data['name']) || empty($data['description'])) {
            throw new \RuntimeException('На странице не найдены название и описание модуля. Проверьте ссылку на товар.');
        }
        $pictures = $data['_images'] ?? [];
        unset($data['_image'], $data['_images']);
        $saved = [];
        $deadline = microtime(true) + 75;
        foreach ($pictures as $picture) {
            if (microtime(true) > $deadline) {
                break;
            }
            try {
                $saved[] = $this->images->store($this->download($picture, 8 * 1024 * 1024));
            } catch (\Throwable) { /* Keep existing media if the source image is unavailable. */
            }
        }
        if ([] !== $saved) {
            $data['cover_image'] = array_shift($saved);
        }
        if ([] !== $saved) {
            $data['gallery'] = $saved;
        }
        $data['_warnings'] ??= [];
        if (!isset($data['cover_image'])) {
            $data['_warnings'][] = 'Не удалось скачать главное изображение.';
        }
        if (count($pictures) > count($saved) + (isset($data['cover_image']) ? 1 : 0)) {
            $data['_warnings'][] = 'Часть изображений источника недоступна.';
        }
        if (empty($data['user_guide_url'])) {
            $data['_warnings'][] = 'Ссылка на README / User Guide на странице не найдена.';
        }

        return $data;
    }
}
