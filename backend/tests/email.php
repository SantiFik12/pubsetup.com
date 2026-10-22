<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Command\EmailWorkerCommand;
use App\Service\Database;
use App\Service\EmailWorker;
use App\Service\OrderMailer;
use App\Service\SmtpTransportFactory;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;

$checks = 0;
$check = static function (bool $condition, string $message) use (&$checks): void {
    ++$checks;
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$smtp = new SmtpTransportFactory('smtppro.zoho.eu', 465, 'kontakt@artwelve.com', 'test:@/#? password', 'ssl');
$check(null === $smtp->configurationError(), 'Valid Zoho settings rejected');
$transport = $smtp->create();
$check($transport instanceof EsmtpTransport, 'Expected an SMTP transport');
$check('kontakt@artwelve.com' === $transport->getUsername() && 'test:@/#? password' === $transport->getPassword(), 'SMTP credentials must remain separate from the sender, with special characters preserved');
$stream = $transport->getStream();
$check($stream instanceof SocketStream && $stream->isTLS() && 465 === $stream->getPort() && 20.0 === $stream->getTimeout(), 'SSL/465 or timeout configuration failed');
$startTls = new SmtpTransportFactory('smtp.example.test', 587, 'user', 'password', 'tls')->create();
$check($startTls instanceof EsmtpTransport && $startTls->isAutoTls() && $startTls->isTlsRequired(), 'STARTTLS must be required, not opportunistic');
$missing = new SmtpTransportFactory('smtppro.zoho.eu', 465, '', '', 'ssl');
$check(null !== $missing->configurationError(), 'Missing SMTP credentials must be reported');
$check(null !== new SmtpTransportFactory('smtp.example.test', 465, 'user', 'password', 'none')->configurationError(), 'Unencrypted SMTP configuration accepted');

$capture = new class implements MailerInterface {
    public array $messages = [];

    public function send(RawMessage $message, ?Envelope $envelope = null): void
    {
        $this->messages[] = $message;
    }
};
$noHttp = new MockHttpClient(static function (): never { throw new RuntimeException('SMTP must not call Postmark'); });
$mailer = new OrderMailer($capture, $smtp, $noHttp, 'smtp', '', 'outbound', 'contact@pubsetup.com', 'contact@pubsetup.com');
$order = ['order_code' => 'PUB-TEST', 'customer_name' => 'Test Customer', 'service_name' => 'Extension installation', 'amount' => '60.00', 'notes' => '<script>not executable</script>'];
foreach (['order-confirmation' => 'customer@example.test', 'order-notification' => 'contact@pubsetup.com'] as $template => $recipient) {
    $mailer->send($order, ['id' => $template, 'template_name' => $template, 'recipient_email' => $recipient]);
}
$check(2 === count($capture->messages), 'Both customer and administrator emails must be sent');
foreach ($capture->messages as $email) {
    $check($email instanceof Email && 'contact@pubsetup.com' === $email->getFrom()[0]->getAddress(), 'From alias must not be replaced by the authentication mailbox');
    $check('contact@pubsetup.com' === $email->getReplyTo()[0]->getAddress(), 'Incorrect reply-to');
    $check(str_contains($email->getTextBody(), 'PUB-TEST') && str_contains($email->getHtmlBody(), '&lt;script&gt;'), 'Order content missing or HTML unescaped');
    $check(str_ends_with($email->getHeaders()->get('Message-ID')->getBodyAsString(), '@pubsetup.com>'), 'Stable outbox Message-ID missing');
}
$check('customer@example.test' === $capture->messages[0]->getTo()[0]->getAddress(), 'Customer recipient changed');
$check('contact@pubsetup.com' === $capture->messages[1]->getTo()[0]->getAddress(), 'Admin recipient changed');
$error = $mailer->failureMessage(new TransportException('Expected response code "235" but got code "535"; test:@/#? password'));
$check(str_contains($error, 'authentication') && !str_contains($error, 'test:@/#? password'), 'SMTP diagnostics must identify authentication errors without credentials');
$check(!str_contains($mailer->failureMessage(new TransportException('Connection error test:@/#? password')), 'test:@/#? password'), 'Transport exceptions must not leak credentials');

$misconfigured = new OrderMailer($capture, $missing, $noHttp, 'smtp', '', 'outbound', 'contact@pubsetup.com', 'contact@pubsetup.com');
$command = new CommandTester(new EmailWorkerCommand(new EmailWorker(new Database('unused://no-database-connection'), $misconfigured)));
$check(1 === $command->execute(['--once' => true]) && str_contains($command->getDisplay(), 'SMTP_PASSWORD'), 'Worker must fail visibly before touching the queue when unconfigured');
$check(2 === count($capture->messages), 'Missing configuration must not send any email');

$httpCalls = 0;
$http = new MockHttpClient(static function (string $method, string $url, array $options) use (&$httpCalls, $check): MockResponse {
    ++$httpCalls;
    $payload = json_decode($options['body'], true);
    $check('POST' === $method && 'https://api.postmarkapp.com/email' === $url, 'Incorrect Postmark API request');
    $check('pubsetup.com <contact@pubsetup.com>' === $payload['From'], 'Postmark sender changed');

    return new MockResponse('{"ErrorCode":0}');
});
$postmark = new OrderMailer($capture, $missing, $http, 'postmark', 'test-server-token', 'outbound', 'contact@pubsetup.com', 'contact@pubsetup.com');
$postmark->send($order, ['id' => 'postmark-job', 'template_name' => 'order-notification', 'recipient_email' => 'contact@pubsetup.com']);
$check(1 === $httpCalls && 2 === count($capture->messages), 'Postmark must remain available without SMTP credentials');
echo "Email delivery: $checks checks passed. No network connections or real email sends.\n";
