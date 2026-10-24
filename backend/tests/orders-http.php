<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\Database;
use Symfony\Component\HttpClient\HttpClient;

$url = getenv('ADMIN_TEST_URL');
$databaseUrl = getenv('ADMIN_TEST_DATABASE_URL');
if (!$url || !$databaseUrl) {
    echo "Set ADMIN_TEST_URL and ADMIN_TEST_DATABASE_URL for isolated admin HTTP checks.\n";
    exit(0);
}
if (!in_array(parse_url($url, PHP_URL_HOST), ['app', 'localhost', '127.0.0.1'], true)) {
    throw new RuntimeException('Use a local test HTTP server');
}
$db = new Database($databaseUrl);
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$password = 'OrderTest-LocalOnly-2026';
$db->execute("INSERT INTO admin_users(email,password_hash) VALUES ('orders-http@example.test',:password)", ['password' => password_hash($password, PASSWORD_BCRYPT)]);
$order = $db->fetchAll("SELECT * FROM orders WHERE email='admin-order-qa@example.test' ORDER BY created_at DESC LIMIT 1")[0];
$http = HttpClient::create(['max_redirects' => 0]);
$cookies = [];
$request = static function (string $method, string $path, array $options = []) use ($http, $url, &$cookies): array {
    $headers = [];
    if ([] !== $cookies) {
        $headers['Cookie'] = implode('; ', $cookies);
    }
    $response = $http->request($method, $url.$path, $options + ['headers' => $headers]);
    $responseHeaders = $response->getHeaders(false);
    foreach ($responseHeaders['set-cookie'] ?? [] as $cookie) {
        $pair = explode(';', $cookie, 2)[0];
        $cookies[explode('=', $pair, 2)[0]] = $pair;
    }

    return [$response->getStatusCode(), $response->getContent(false), $responseHeaders];
};
$checks = 0;
$check = static function (bool $ok, string $message) use (&$checks): void {
    ++$checks;
    if (!$ok) {
        throw new RuntimeException($message);
    }
};
foreach (['/admin_panel/orders', '/admin_panel/orders/'.$order['id']] as $path) {
    [$status, $html, $headers] = $request('GET', $path);
    $check(in_array($status, [302, 303], true) && str_contains($headers['location'][0], '/admin_panel/login'), 'Anonymous visitor can access orders');
    $check(!str_contains($html, $order['email']) && str_contains(implode(' ', $headers['cache-control']), 'no-store'), 'Order information leaked or response was cacheable');
}
[, $html] = $request('GET', '/admin_panel/login');
$dom = new DOMDocument();
@$dom->loadHTML($html);
$token = new DOMXPath($dom)->query('//input[@name="_csrf_token"]')->item(0)?->getAttribute('value');
$check(is_string($token) && '' !== $token, 'Login CSRF token missing');
[$status] = $request('POST', '/admin_panel/login', ['body' => ['email' => 'orders-http@example.test', 'password' => $password, '_csrf_token' => $token]]);
$check(in_array($status, [302, 303], true), 'Admin login failed');
[$status, $html, $headers] = $request('GET', '/admin_panel/orders?q='.urlencode($order['order_code']));
$check(200 === $status && str_contains($html, $order['order_code']) && str_contains($html, 'Заказы'), 'Order list failed to render');
$check(str_contains(implode(' ', $headers['x-robots-tag']), 'noindex'), 'Order list must not be indexed');
[$status, $html, $headers] = $request('GET', '/admin_panel/orders/'.$order['id']);
$check(200 === $status && str_contains($html, 'Попытки исчерпаны') && str_contains($html, 'Test SMTP error'), 'Order detail or email diagnostics failed to render');
$check(str_contains($html, '&lt;script&gt;escaped notes&lt;/script&gt;') && !str_contains($html, '<script>escaped notes</script>'), 'Customer notes were not escaped');
$check(!str_contains($html, 'href="javascript:'), 'Unsafe imported website was linked');
$check(str_contains(implode(' ', $headers['cache-control']), 'no-store'), 'Order details must not be cached');
[$status] = $request('GET', '/admin_panel/orders/invalid-id');
$check(404 === $status, 'Unknown order must return 404');
[$status] = $request('POST', '/admin_panel/orders/'.$order['id'], ['body' => ['status' => 'paid']]);
$check(405 === $status, 'Order view must not accept mutations');
$check($db->fetchAll('SELECT status FROM orders WHERE id=:id', ['id' => $order['id']])[0]['status'] === $order['status'], 'Viewing or posting changed an order');
echo "Admin order HTTP checks: $checks passed.\n";
