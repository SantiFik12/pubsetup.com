<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class EmailWorker
{
    public function __construct(private Database $db, private HttpClientInterface $http,
        private string $postmarkToken, private string $messageStream,
        private string $mailFrom, private string $notificationTo)
    {
    }

    public function processOne(): bool
    {
        if ('' === $this->postmarkToken) {
            return false;
        }
        $pdo = $this->db->connection();
        $pdo->beginTransaction();
        try {
            $job = $this->db->fetchAll('SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts < 8 AND available_at <= now() ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1')[0] ?? null;
            if (null === $job) {
                $pdo->commit();

                return false;
            }
            $order = $this->db->fetchAll('SELECT o.*, s.name AS service_name, e.name AS extension_name FROM orders o JOIN services s ON s.id = o.service_id LEFT JOIN extensions e ON e.id = o.extension_id WHERE o.id = :id', ['id' => $job['order_id']])[0];
            $suppressed = [] !== $this->db->fetchAll('SELECT id FROM suppressed_emails WHERE lower(email) = lower(:email)', ['email' => $job['recipient_email']]);
            $status = 'suppressed';
            $error = null;
            try {
                if (!$suppressed) {
                    $subject = ('order-notification' === $job['template_name'] ? 'New service order ' : 'Your service order ').$order['order_code'];
                    $text = "Order: {$order['order_code']}\nName: {$order['customer_name']}\nService: {$order['service_name']}\nExtension: ".($order['extension_name'] ?? '—')."\nTotal: $".$order['amount']."\nWebsite: ".($order['website'] ?? '—')."\nNotes: ".($order['notes'] ?? '—')."\n\nWe will contact you shortly. No payment is required at this step.\ncontact@pubsetup.com";
                    $result = $this->http->request('POST', 'https://api.postmarkapp.com/email', ['timeout' => 20,
                        'headers' => ['X-Postmark-Server-Token' => $this->postmarkToken, 'Accept' => 'application/json'],
                        'json' => ['From' => 'pubsetup.com <'.$this->mailFrom.'>', 'To' => $job['recipient_email'], 'ReplyTo' => $this->notificationTo,
                            'Subject' => $subject, 'TextBody' => $text, 'HtmlBody' => '<pre>'.htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8').'</pre>',
                            'MessageStream' => $this->messageStream, 'Headers' => [['Name' => 'Message-ID', 'Value' => '<'.$job['id'].'@pubsetup.com>']]],
                    ])->toArray();
                    if (($result['ErrorCode'] ?? 0) !== 0) {
                        throw new \RuntimeException('Postmark rejected message');
                    }
                    $status = 'sent';
                }
            } catch (\Throwable) {
                $status = 'failed';
                $error = 'Postmark delivery failed; automatic retry scheduled';
            }
            $this->db->execute('INSERT INTO email_send_log(message_id,template_name,recipient_email,status,error_message) VALUES (:id,:template,:email,:status,:error)',
                ['id' => $job['id'], 'template' => $job['template_name'], 'email' => $job['recipient_email'], 'status' => $status, 'error' => $error]);
            $this->db->execute("UPDATE email_outbox SET attempts = attempts + 1, last_error = :error,
                available_at = now() + (LEAST(3600, 30 * power(2, attempts)) * interval '1 second'),
                sent_at = CASE WHEN :done = 1 THEN now() ELSE NULL END WHERE id = :id",
                ['error' => $error, 'done' => 'failed' === $status ? 0 : 1, 'id' => $job['id']]);
            $pdo->commit();

            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
