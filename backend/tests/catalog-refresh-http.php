<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\Database;
use Symfony\Component\HttpClient\HttpClient;

$url = getenv('ADMIN_TEST_URL');
$databaseUrl = getenv('ADMIN_TEST_DATABASE_URL');
if (!$url || !$databaseUrl) {
    echo "Set ADMIN_TEST_URL and ADMIN_TEST_DATABASE_URL for refresh journal HTTP checks.\n";
    exit(0);
}
if (!in_array(parse_url($url, PHP_URL_HOST), ['localhost', '127.0.0.1', 'pubsetup-refresh-http-qa'], true)) {
    throw new RuntimeException('Use an isolated local HTTP server');
}
$db = new Database($databaseUrl);
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$suffix = bin2hex(random_bytes(5));
$email = 'refresh-'.$suffix.'@example.test';
$password = 'Refresh-QA-LocalOnly';
$db->execute('INSERT INTO admin_users(email,password_hash) VALUES (:email,:hash)', ['email' => $email, 'hash' => password_hash($password, PASSWORD_BCRYPT)]);
$run = $db->fetchAll("INSERT INTO catalog_refresh_runs(status,finished_at) VALUES ('success',now()) RETURNING id")[0]['id'];
$db->execute("INSERT INTO catalog_refresh_items(run_id,module_name,vendor_name,source_url,status,changes,warnings) VALUES (:run,'<script>Source name</script>','QA','https://fixture.example/product','updated',CAST(:changes AS jsonb),CAST(:warnings AS jsonb))", ['run' => $run, 'changes' => json_encode(['reviews' => ['old' => 1, 'new' => 2]], JSON_THROW_ON_ERROR), 'warnings' => '["Source warning"]']);
$client = HttpClient::create(['max_redirects' => 0]);
$cookies = [];
$request = static function (string $method, string $path, array $body = []) use ($client, $url, &$cookies): array {
    $response = $client->request($method, $url.$path, ['body' => $body, 'headers' => ['Cookie' => implode('; ', $cookies)]]);
    $headers = $response->getHeaders(false);
    foreach ($headers['set-cookie'] ?? [] as $cookie) {
        $pair = explode(';', $cookie, 2)[0];
        $cookies[explode('=', $pair, 2)[0]] = $pair;
    }

    return [$response->getStatusCode(), $response->getContent(false), $headers];
};
$check = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
foreach (['/admin_panel/refreshes', '/admin_panel/refreshes/'.$run] as $path) {
    [$status, , $headers] = $request('GET', $path);
    $check(302 === $status && str_contains($headers['location'][0], '/admin_panel/login'), 'Anonymous access to refresh journal');
}
[, $login] = $request('GET', '/admin_panel/login');
$document = new DOMDocument();
@$document->loadHTML($login);
$token = new DOMXPath($document)->query('//input[@name="_csrf_token"]')->item(0)?->getAttribute('value') ?? '';
[$status] = $request('POST', '/admin_panel/login', ['email' => $email, 'password' => $password, '_csrf_token' => $token]);
$check(302 === $status, 'Test admin login failed');
[$status, $html, $headers] = $request('GET', '/admin_panel/refreshes');
$check(200 === $status && str_contains($html, '/admin_panel/refreshes/'.$run) && str_contains($html, 'Europe/Warsaw'), 'Journal summary or SQL aggregation failed');
$check(str_contains(implode(' ', $headers['cache-control']), 'no-store'), 'Admin journal must not be cached');
[$status, $html] = $request('GET', '/admin_panel/refreshes/'.$run);
$check(200 === $status && str_contains($html, 'reviews') && str_contains($html, 'Source warning'), 'Item changes or warnings missing');
$check(str_contains($html, '&lt;script&gt;Source name&lt;/script&gt;') && !str_contains($html, '<script>Source name</script>'), 'Imported names not escaped in journal');
[$status] = $request('GET', '/admin_panel/refreshes/not-an-id');
$check(404 === $status, 'Missing journal run did not return 404');
echo "Catalog refresh HTTP checks passed: authentication, summary, detail, escaping, cache headers and 404.\n";
