<?php

declare(strict_types=1);

namespace App\Service;

final readonly class OrderService
{
    public function __construct(private Database $db, private OrderValidator $validator, private string $notificationTo)
    {
    }

    public function create(array $input, string $ip): array
    {
        $data = $this->validator->validate($input);
        // Only the gateway-provided address reaches this method; no client forwarded header is used.
        $key = hash('sha256', $ip);
        $limit = $this->db->fetchAll("INSERT INTO request_limits(key) VALUES (:key)
            ON CONFLICT(key) DO UPDATE SET count = CASE WHEN request_limits.window_start < now() - interval '1 hour' THEN 1 ELSE request_limits.count + 1 END,
            window_start = CASE WHEN request_limits.window_start < now() - interval '1 hour' THEN now() ELSE request_limits.window_start END RETURNING count", ['key' => $key]);
        if ((int) $limit[0]['count'] > 10) {
            throw new \OverflowException('Too many requests. Please try again later.');
        }
        $service = $this->db->fetchAll('SELECT price FROM services WHERE id = :id', ['id' => $data['service_id']])[0] ?? null;
        if (null === $service) {
            throw new \InvalidArgumentException('Service not found');
        }
        if ((float) $service['price'] <= 0) {
            throw new \InvalidArgumentException('This service requires a quote. Please contact us before ordering.');
        }
        if (null !== $data['extension_id'] && [] === $this->db->fetchAll('SELECT id FROM extensions WHERE id = :id AND published = true', ['id' => $data['extension_id']])) {
            throw new \InvalidArgumentException('Extension not found');
        }
        $pdo = $this->db->connection();
        $pdo->beginTransaction();
        try {
            // Client-supplied prices and statuses are intentionally ignored.
            $order = $this->db->fetchAll('INSERT INTO orders(customer_name,email,website,notes,service_id,extension_id,amount)
                VALUES (:customer_name,:email,:website,:notes,:service_id,:extension_id,:amount) RETURNING id,order_code', [...$data, 'amount' => $service['price']])[0];
            foreach (['order-notification' => $this->notificationTo, 'order-confirmation' => $data['email']] as $template => $recipient) {
                $this->db->execute('INSERT INTO email_outbox(order_id,template_name,recipient_email) VALUES (:id,:template,:recipient)',
                    ['id' => $order['id'], 'template' => $template, 'recipient' => $recipient]);
            }
            $pdo->commit();

            return ['order_code' => $order['order_code']];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
