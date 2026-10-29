<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\Database;
use Symfony\Component\HttpClient\HttpClient;

$url = getenv('ADMIN_TEST_URL');
$databaseUrl = getenv('ADMIN_TEST_DATABASE_URL');
if (!$url || !$databaseUrl) {
    echo "Set ADMIN_TEST_URL and ADMIN_TEST_DATABASE_URL for isolated deletion HTTP checks.\n";
    exit(0);
}
if (!in_array(parse_url($url, PHP_URL_HOST), ['app', 'localhost', '127.0.0.1'], true)) {
    throw new RuntimeException('Use a local test HTTP server');
}
$db = new Database($databaseUrl);
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$suffix = bin2hex(random_bytes(5));
$password = 'Deletion-QA-LocalOnly';
$email = 'delete-'.$suffix.'@example.test';
$db->execute('INSERT INTO admin_users(email,password_hash) VALUES (:email,:password)', ['email' => $email, 'password' => password_hash($password, PASSWORD_BCRYPT)]);
$vendor = $db->fetchAll("INSERT INTO partners(name,slug,logo_letter) VALUES ('<script>Vendor</script>',:slug,'D') RETURNING id", ['slug' => 'http-delete-'.$suffix])[0]['id'];
$category = $db->fetchAll('SELECT id FROM categories LIMIT 1')[0]['id'];
$http = HttpClient::create(['max_redirects' => 0]);
$cookies = [];
$request = static function (string $method, string $path, array $body = []) use ($http, $url, &$cookies): array {
    $response = $http->request($method, $url.$path, ['body' => $body, 'headers' => ['Cookie' => implode('; ', $cookies)]]);
    $headers = $response->getHeaders(false);
    foreach ($headers['set-cookie'] ?? [] as $cookie) {
        $pair = explode(';', $cookie, 2)[0];
        $cookies[explode('=', $pair, 2)[0]] = $pair;
    }

    return [$response->getStatusCode(), $response->getContent(false), $headers];
};
$token = static function (string $html, string $name): string {
    $document = new DOMDocument();
    @$document->loadHTML($html);

    return new DOMXPath($document)->query('//input[@name="'.$name.'"]')->item(0)?->getAttribute('value') ?? '';
};
$checks = 0;
$check = static function (bool $condition, string $message) use (&$checks): void {
    ++$checks;
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$vendorPath = '/admin_panel/vendors/'.$vendor.'/delete';
foreach ([$vendorPath, '/admin_panel/modules/invalid-id/delete'] as $path) {
    [$status, , $headers] = $request('GET', $path);
    $check(302 === $status && str_contains($headers['location'][0], '/admin_panel/login'), 'Anonymous visitor accessed deletion');
}
[, $html] = $request('GET', '/admin_panel/login');
[$status] = $request('POST', '/admin_panel/login', ['email' => $email, 'password' => $password, '_csrf_token' => $token($html, '_csrf_token')]);
$check(302 === $status, 'Admin login failed');
[$status, $html] = $request('GET', $vendorPath);
$vendorToken = $token($html, '_token');
$check(200 === $status && '' !== $vendorToken && str_contains($html, '&lt;script&gt;Vendor&lt;/script&gt;'), 'Confirmation form missing or record name not escaped');
$check(1 === count($db->fetchAll('SELECT id FROM partners WHERE id=:id', ['id' => $vendor])), 'GET deleted a vendor');
[$status] = $request('POST', $vendorPath, ['confirm' => 'delete']);
$check(403 === $status, 'Deletion without CSRF accepted');
[$status] = $request('POST', $vendorPath, ['_token' => $vendorToken]);
$check(422 === $status, 'Deletion without explicit confirmation accepted');
// Create a dependency after the administrator opened the confirmation page.
$module = $db->fetchAll("INSERT INTO extensions(name,slug,partner_id,category_id) VALUES ('HTTP delete module',:slug,:vendor,:category) RETURNING id", ['slug' => 'http-delete-'.$suffix, 'vendor' => $vendor, 'category' => $category])[0]['id'];
[$status, $html] = $request('POST', $vendorPath, ['_token' => $vendorToken, 'confirm' => 'delete']);
$check(422 === $status && str_contains($html, 'У вендора есть модули'), 'New dependency did not block deletion');
$modulePath = '/admin_panel/modules/'.$module.'/delete';
[$status, $html, $headers] = $request('GET', $modulePath);
$moduleToken = $token($html, '_token');
$check(200 === $status && '' !== $moduleToken && str_contains(implode(' ', $headers['cache-control']), 'no-store'), 'Module confirmation failed or was cacheable');
[$status] = $request('POST', $modulePath, ['_token' => $vendorToken, 'confirm' => 'delete']);
$check(403 === $status, 'Vendor CSRF token accepted for module deletion');
[$status] = $request('POST', $modulePath, ['_token' => $moduleToken, 'confirm' => 'delete']);
$check(302 === $status && [] === $db->fetchAll('SELECT id FROM extensions WHERE id=:id', ['id' => $module]), 'Confirmed module deletion failed');
[$status] = $request('GET', $modulePath);
$check(404 === $status, 'Deleted module still available');
[$status] = $request('POST', $vendorPath, ['_token' => $vendorToken, 'confirm' => 'delete']);
$check(302 === $status && [] === $db->fetchAll('SELECT id FROM partners WHERE id=:id', ['id' => $vendor]), 'Confirmed empty vendor deletion failed');
[$status] = $request('GET', '/admin_panel/vendors/invalid-id/delete');
$check(404 === $status, 'Invalid vendor ID must return 404');
echo "Catalog deletion HTTP: $checks checks passed.\n";
