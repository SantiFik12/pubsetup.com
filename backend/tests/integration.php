<?php

declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
use App\Service\CatalogService;
use App\Service\Database;
use App\Service\EmailWorker;
use App\Service\OrderService;
use App\Service\OrderValidator;
use App\Service\OrderMailer;
use App\Service\SmtpTransportFactory;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\NullTransport;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

$db = new Database(getenv('DATABASE_URL'));
$check = static function (bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } };
// Run in a dedicated disposable test database only.
$name = $db->fetchAll('SELECT current_database() AS name')[0]['name'];
if (!str_ends_with($name, '_test')) {
    throw new RuntimeException('Use a disposable database ending in _test');
}
$p = '11111111-1111-4111-8111-111111111111';
$c = '22222222-2222-4222-8222-222222222222';
$s = '33333333-3333-4333-8333-333333333333';
$e = '44444444-4444-4444-8444-444444444444';
$db->execute("INSERT INTO partners(id,slug,name,logo_letter) VALUES (:id,'test-partner','Test Partner','T')", ['id' => $p]);
$db->execute("INSERT INTO categories(id,slug,name) VALUES (:id,'test-category','Test Category')", ['id' => $c]);
$db->execute("INSERT INTO services(id,slug,name,price) VALUES (:id,'test-service','Test Service',79)", ['id' => $s]);
$db->execute("INSERT INTO extensions(id,slug,name,partner_id,category_id,tags,hyva_compatible) VALUES (:id,'test-extension','Test Extension',:p,:c,ARRAY['test'],true)", ['id' => $e, 'p' => $p, 'c' => $c]);
$db->execute("INSERT INTO blog_posts(slug,title,published) VALUES ('private-draft','Draft',false),('public-post','Published',true)");
$catalog = new CatalogService($db)->all();
$check(1 === count($catalog['blogPosts']) && 'public-post' === $catalog['blogPosts'][0]['slug'], 'Draft leaked');
$check($catalog['extensions'][0]['tags'] === ['test'] && true === $catalog['extensions'][0]['hyva_compatible'], 'PostgreSQL JSON types lost');
$orders = new OrderService($db, new OrderValidator(), 'team@example.com');
$input = ['customer_name' => 'Test Buyer', 'email' => 'buyer@example.com', 'service_id' => $s, 'extension_id' => $e, 'amount' => 0, 'status' => 'paid'];
$result = $orders->create($input, 'test-ip');
$row = $db->fetchAll('SELECT * FROM orders WHERE order_code = :code', ['code' => $result['order_code']])[0];
$check(79.0 === (float) $row['amount'] && 'pending' === $row['status'], 'Client changed price or status');
$check(2 === (int) $db->fetchAll('SELECT count(*) AS n FROM email_outbox')[0]['n'], 'Order and emails not saved together');
$db->execute("INSERT INTO suppressed_emails(email,reason) VALUES ('buyer@example.com','unsubscribe')");
$calls = 0;
$http = new MockHttpClient(static function ($method, $url, $options) use (&$calls) {
    ++$calls;
    if ('POST' !== $method || 'https://api.postmarkapp.com/email' !== $url) {
        throw new RuntimeException('Unexpected email request');
    }

    return new MockResponse('{"ErrorCode":0,"MessageID":"test"}');
});
$worker = new EmailWorker($db, new OrderMailer(new Mailer(new NullTransport()), new SmtpTransportFactory('unused', 465, '', '', 'ssl'), $http, 'postmark', 'fake-test-token', 'outbound', 'noreply@example.com', 'team@example.com'));
$worker->processOne();
$worker->processOne();
$check(1 === $calls, 'Suppressed email was sent');
$check([] !== $db->fetchAll("SELECT status FROM email_send_log WHERE status = 'sent'"), 'Sent email not logged');
$check([] !== $db->fetchAll("SELECT status FROM email_send_log WHERE status = 'suppressed'"), 'Suppression not logged');
$orders->create($input, 'another-test-ip');
$failedWorker = new EmailWorker($db, new OrderMailer(new Mailer(new NullTransport()), new SmtpTransportFactory('unused', 465, '', '', 'ssl'), new MockHttpClient(new MockResponse('{"ErrorCode":10}', ['http_code' => 500])), 'postmark', 'fake', 'outbound', 'noreply@example.com', 'team@example.com'));
$failedWorker->processOne();
$check([] !== $db->fetchAll('SELECT id FROM email_outbox WHERE attempts = 1 AND sent_at IS NULL AND available_at > now()'), 'Failed mail was not scheduled for retry');
try {
    $orders->create(array_replace($input, ['service_id' => '99999999-9999-4999-8999-999999999999']), 'missing-service');
    throw new RuntimeException('Missing service accepted');
} catch (InvalidArgumentException) {
}
for ($i = 0; $i < 9; ++$i) {
    $orders->create($input, 'test-ip');
}
try {
    $orders->create($input, 'test-ip');
    throw new RuntimeException('Rate limit bypassed');
} catch (OverflowException) {
}
echo "Integration passed: catalog visibility and types, server prices, atomic order queue, suppression, delivery, retries, missing service, rate limit.\n";
$quoteId = $db->fetchAll("SELECT id FROM services WHERE slug = 'transfer-existing-store'")[0]['id'];
try {
    $orders->create(array_replace($input, ['service_id' => $quoteId]), 'quote-request');
    throw new RuntimeException('Quote-only service accepted as a free order');
} catch (InvalidArgumentException) {
}
echo "Quote-only services cannot be ordered as free work.\n";
