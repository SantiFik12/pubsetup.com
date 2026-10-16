<?php

declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
use App\Service\OrderValidator;
$validator = new OrderValidator();
$base = ['customer_name' => ' Alice ', 'email' => 'Alice@example.com', 'service_id' => '11111111-1111-4111-8111-111111111111', 'website' => 'https://example.com', 'notes' => 'Please use staging'];
$valid = $validator->validate($base + ['amount' => -1, 'status' => 'paid']);
if ($valid['customer_name'] !== 'Alice' || $valid['email'] !== 'alice@example.com' || isset($valid['amount']) || isset($valid['status'])) { throw new RuntimeException('Order normalization failed'); }
$cases = [['email' => "bad\r\n@example.com"], ['email' => 'bad'], ['customer_name' => ''], ['customer_name' => ['array']], ['notes' => str_repeat('x', 10001)], ['website' => 'file:///etc/passwd'], ['service_id' => 'bad'], ['extension_id' => 'bad'], ['email' => null]];
foreach ($cases as $patch) {
    try { $validator->validate(array_replace($base, $patch)); }
    catch (InvalidArgumentException) { continue; }
    throw new RuntimeException('Invalid order accepted: '.implode(',', array_keys($patch)));
}
// PHP syntax checks cover every source file, including commands not loaded by the container lint.
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__DIR__).'/src')) as $file) {
    if ($file->getExtension() !== 'php') { continue; }
    exec(escapeshellarg(PHP_BINARY).' -l '.escapeshellarg($file->getPathname()), $output, $code);
    if ($code !== 0) { throw new RuntimeException('PHP syntax error'); }
}
echo 'Order validation: '.(count($cases) + 1)." checks passed. PHP syntax passed.\n";
