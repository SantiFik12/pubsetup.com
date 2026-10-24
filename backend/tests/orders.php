<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Service\AdminOrders;
use App\Service\Database;
use App\Service\OrderService;
use App\Service\OrderValidator;

$checks = 0;
$check = static function (bool $condition, string $message) use (&$checks): void {
    ++$checks;
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$check('В очереди' === AdminOrders::deliveryState(['attempts' => 0])['state_label'], 'New mail is not queued');
$check('draft' === AdminOrders::deliveryState(['attempts' => 1])['state_class'], 'Retry state missing');
$check('failed' === AdminOrders::deliveryState(['attempts' => 8])['state_class'], 'Exhausted attempts must be visible');
$check('published' === AdminOrders::deliveryState(['attempts' => 1, 'sent_at' => '2026-10-24', 'last_status' => 'sent'])['state_class'], 'Accepted email state missing');
$check('draft' === AdminOrders::deliveryState(['attempts' => 1, 'sent_at' => '2026-10-24', 'last_status' => 'suppressed'])['state_class'], 'Suppression must not be presented as a sent email');
echo "Admin order delivery states: $checks checks passed.\n";

if (!getenv('ADMIN_TEST_DATABASE_URL')) {
    exit(0);
}
$db = new Database(getenv('ADMIN_TEST_DATABASE_URL'));
if (!str_ends_with($db->fetchAll('SELECT current_database() AS name')[0]['name'], '_test')) {
    throw new RuntimeException('Use a disposable _test database');
}
$service = $db->fetchAll('SELECT id FROM services WHERE price > 0 ORDER BY slug LIMIT 1')[0]['id'];
$created = new OrderService($db, new OrderValidator(), 'admin-order-test@example.test')->create([
    'customer_name' => '<script>QA Customer</script>', 'email' => 'admin-order-qa@example.test',
    'service_id' => $service, 'website' => 'https://example.test/store', 'notes' => "Line 1\n<script>escaped notes</script>",
], 'admin-order-fixture');
$orders = new AdminOrders($db);
$list = $orders->search($created['order_code']);
$check(1 === $list['total'], 'Created service order not found by order code');
$id = $list['orders'][0]['id'];
$detail = $orders->details($id);
$check($detail['order']['email'] === 'admin-order-qa@example.test' && str_contains($detail['order']['notes'], 'escaped notes'), 'Customer data or notes missing');
$check(2 === count($detail['email_jobs']) && [] === $detail['email_logs'], 'Both newly queued emails must be visible');
$check('https://example.test/store' === $detail['order']['website_url'], 'Valid customer website lost');
$check(1 === $orders->search('admin-order-qa@example.test', 'pending')['total'], 'Email/status search failed');
$check(0 === $orders->search($created['order_code'], 'completed')['total'], 'Status filter ignored');
$check(0 === $orders->search("%' OR true --")['total'], 'Search must treat SQL and LIKE metacharacters as data');
$check(null === $orders->details('invalid-id'), 'Invalid order IDs must return not found without a database exception');
$db->execute("UPDATE orders SET website='javascript:alert(1)' WHERE id=:id", ['id' => $id]);
$check(null === $orders->details($id)['order']['website_url'], 'Unsafe imported website must not be linked');
$jobId = $detail['email_jobs'][0]['id'];
$db->execute("UPDATE email_outbox SET attempts=8,last_error='Test SMTP error' WHERE id=:id", ['id' => $jobId]);
$db->execute("INSERT INTO email_send_log(message_id,template_name,recipient_email,status,error_message)
    VALUES (:id,'order-confirmation','admin-order-qa@example.test','failed','Test SMTP error')", ['id' => $jobId]);
$detail = $orders->details($id);
$check('failed' === $detail['email_jobs'][0]['state_class'] && 1 === count($detail['email_logs']), 'Delivery failures or attempt history not visible');
for ($i = 0; $i < 27; ++$i) {
    $db->execute("INSERT INTO orders(service_id,customer_name,email,amount) VALUES (:service,:name,:email,60)",
        ['service' => $service, 'name' => 'Pagination QA '.str_pad((string) $i, 2, '0', STR_PAD_LEFT), 'email' => 'pagination-'.$i.'@example.test']);
}
$first = $orders->search('Pagination QA', '', 1);
$second = $orders->search('Pagination QA', '', 2);
$check(27 === $first['total'] && 25 === count($first['orders']) && 2 === count($second['orders']), 'Order pagination is incomplete');
$check([] === array_intersect(array_column($first['orders'], 'id'), array_column($second['orders'], 'id')), 'Order pages overlap');
$check(2 === $orders->search('Pagination QA', '', PHP_INT_MAX)['page'], 'Out-of-range pages were not clamped');
$check(1 === $orders->search('Pagination QA', '', -9)['page'], 'Negative pages were not clamped');
echo "Admin order database checks passed: $checks checks total.\n";
