<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class OrderMailer
{
    public function __construct(private MailerInterface $smtpMailer, private SmtpTransportFactory $smtpFactory,
        private HttpClientInterface $http, private string $mailTransport,
        #[\SensitiveParameter] private string $postmarkToken, private string $messageStream,
        private string $mailFrom, private string $notificationTo)
    {
    }

    public function configurationError(): ?string
    {
        if ('smtp' === $this->mailTransport) {
            return $this->smtpFactory->configurationError();
        }
        if ('postmark' === $this->mailTransport) {
            return '' === $this->postmarkToken ? 'Postmark is not configured. Set POSTMARK_SERVER_TOKEN or use MAIL_TRANSPORT=smtp.' : null;
        }

        return 'Unknown MAIL_TRANSPORT. Choose smtp or postmark.';
    }

    public function send(array $order, array $job): void
    {
        if (null !== $error = $this->configurationError()) {
            throw new \LogicException($error);
        }
        $subject = ('order-notification' === $job['template_name'] ? 'New service order ' : 'Your service order ').$order['order_code'];
        $text = "Order: {$order['order_code']}\nName: {$order['customer_name']}\nService: {$order['service_name']}\nExtension: ".($order['extension_name'] ?? '—')."\nTotal: $".$order['amount']."\nWebsite: ".($order['website'] ?? '—')."\nNotes: ".($order['notes'] ?? '—')."\n\nWe will contact you shortly. No payment is required at this step.\n".$this->notificationTo;
        $html = '<pre>'.htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'</pre>';
        if ('smtp' === $this->mailTransport) {
            $email = new Email()->from(new Address($this->mailFrom, 'pubsetup.com'))
                ->to($job['recipient_email'])->replyTo($this->notificationTo)
                ->subject($subject)->text($text)->html($html);
            $email->getHeaders()->addIdHeader('Message-ID', $job['id'].'@pubsetup.com');
            $this->smtpMailer->send($email);

            return;
        }
        $response = $this->http->request('POST', 'https://api.postmarkapp.com/email', ['timeout' => 20,
            'headers' => ['X-Postmark-Server-Token' => $this->postmarkToken, 'Accept' => 'application/json'],
            'json' => ['From' => 'pubsetup.com <'.$this->mailFrom.'>', 'To' => $job['recipient_email'], 'ReplyTo' => $this->notificationTo,
                'Subject' => $subject, 'TextBody' => $text, 'HtmlBody' => $html,
                'MessageStream' => $this->messageStream, 'Headers' => [['Name' => 'Message-ID', 'Value' => '<'.$job['id'].'@pubsetup.com>']]],
        ]);
        $result = $response->toArray(false);
        if (200 !== $response->getStatusCode() || 0 !== ($result['ErrorCode'] ?? -1)) {
            throw new \RuntimeException('Postmark rejected the message.');
        }
    }

    public function failureMessage(\Throwable $error): string
    {
        // SMTP exceptions can contain AUTH transcripts. Do not store them or credentials.
        if ('smtp' === $this->mailTransport) {
            if ($error instanceof TransportExceptionInterface
                && preg_match('/(?:code|got code)[^0-9]*(53[045])\b/i', $error->getMessage())) {
                return 'SMTP authentication failed. Check SMTP_USERNAME and SMTP_PASSWORD. Automatic retry scheduled.';
            }

            return 'SMTP delivery failed. Check host, port, TLS, credentials and allowed sender alias. Automatic retry scheduled.';
        }

        return 'Postmark delivery failed. Check the server token, sender and stream. Automatic retry scheduled.';
    }
}
