<?php

declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
$client = Symfony\Component\HttpClient\HttpClient::create(['timeout' => 15, 'max_duration' => 30]);
$check = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$get = (static fn (string $path) => $client->request('GET', 'http://gateway:8082'.$path, ['headers' => ['User-Agent' => 'Googlebot']]));
$api = $get('/api/catalog')->toArray();
$routes = ['/' => ['Organization', 'WebSite'], '/extensions' => ['CollectionPage', 'BreadcrumbList'], '/services' => ['CollectionPage', 'BreadcrumbList']];
foreach ($api['extensions'] as $item) {
    $routes['/extension/'.$item['slug']] = ['Product', 'BreadcrumbList'];
}
foreach (array_slice($api['services'], 0, 2) as $item) {
    $routes['/services/'.$item['slug']] = ['Service', 'BreadcrumbList'];
}
foreach ($api['categories'] as $item) {
    $routes['/category/'.$item['slug']] = ['CollectionPage', 'BreadcrumbList'];
}
foreach ($api['partners'] as $item) {
    $routes['/partner/'.$item['slug']] = ['CollectionPage', 'BreadcrumbList'];
}
foreach (array_slice($api['blogPosts'], 0, 1) as $item) {
    $routes['/blog/'.$item['slug']] = ['BlogPosting', 'BreadcrumbList'];
}
foreach ($routes as $path => $expected) {
    $r = $get($path);
    $body = $r->getContent();
    $doc = new DOMDocument();
    @$doc->loadHTML('<?xml encoding="UTF-8">'.$body, LIBXML_NONET);
    $x = new DOMXPath($doc);
    $check(200 === $r->getStatusCode(), 'Bad status '.$path);
    $description = $x->evaluate('string(//meta[@name="description"]/@content)');
    $check('' !== $description && mb_strlen($description) <= 160, 'Description '.$path);
    $check('' !== $x->evaluate('string(//meta[@property="og:image"]/@content)'), 'OG image '.$path);
    $check('' !== $x->evaluate('string(//meta[@name="twitter:image"]/@content)'), 'Twitter image '.$path);
    $canonical = $x->evaluate('string(//link[@rel="canonical"]/@href)');
    $check(parse_url($canonical, PHP_URL_PATH) === $path || ('/' === $path && in_array(parse_url($canonical, PHP_URL_PATH), ['', null, '/'], true)), 'Canonical '.$path);
    $types = [];
    foreach ($x->query('//script[@type="application/ld+json"]') as $node) {
        $schema = json_decode($node->textContent, true, 512, JSON_THROW_ON_ERROR);
        foreach ($schema['@graph'] ?? [$schema] as $entity) {
            $types[] = $entity['@type'] ?? '';
        }
    }
    foreach ($expected as $type) {
        $check(in_array($type, $types, true), 'Missing '.$type.' '.$path);
    }
    echo 'PASS '.$path.PHP_EOL;
}
$xml = $get('/sitemap.xml')->getContent();
$map = simplexml_load_string($xml);
$check(false !== $map, 'Invalid sitemap XML');
$urls = [];
foreach ($map->url as $item) {
    $urls[] = (string) $item->loc;
}
$check(count($urls) === count(array_unique($urls)), 'Duplicate sitemap URLs');
$check(str_contains($xml, '<lastmod>'), 'Missing lastmod');
foreach ($api['categories'] as $category) {
    $has = (bool) array_filter($api['extensions'], fn ($item) => $item['category_id'] === $category['id']);
    $included = (bool) array_filter($urls, fn ($url) => str_ends_with($url, '/category/'.$category['slug']));
    $check($has === $included, 'Empty category sitemap handling');
}
foreach (['/checkout', '/compare'] as $path) {
    $check(str_contains($get($path)->getContent(), 'noindex'), 'Missing noindex '.$path);
}
$robots = $get('/robots.txt')->getContent();
foreach (['/checkout', '/compare', '/admin_panel', '/go/', '/email/'] as $path) {
    $check(!str_contains($robots, 'Disallow: '.$path), 'Blocked noindex '.$path);
}
foreach (['/api/catalog', '/health', '/admin_panel/login', '/email/unsubscribe?token=invalid'] as $path) {
    $h = $get($path)->getHeaders(false);
    $check(str_contains(implode(',', $h['x-robots-tag'] ?? []), 'noindex'), 'Missing header '.$path);
}
$picture = $get('/social-image');
$size = getimagesizefromstring($picture->getContent());
$check(1200 === $size[0] && 630 === $size[1], 'Social image dimensions');
$missing = $get('/extension/seo-check-nonexistent-module');
$check(404 === $missing->getStatusCode(), 'Missing module is a soft 404');
echo 'PASS sitemap, lastmod, robots, noindex headers, social image, HTTP 404'.PHP_EOL;
