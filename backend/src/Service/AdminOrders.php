<?php

declare(strict_types=1);

namespace App\Service;

final readonly class AdminOrders
{
    public const array STATUS_LABELS = [
        'pending' => 'Ожидает обработки', 'paid' => 'Оплачен', 'in_progress' => 'В работе',
        'completed' => 'Завершён', 'cancelled' => 'Отменён',
    ];
    private const int PAGE_SIZE = 25;

    public function __construct(private Database $db)
    {
    }

    public function search(string $query = '', string $status = '', int $page = 1): array
    {
        $query = mb_substr(trim($query), 0, 150);
        $status = isset(self::STATUS_LABELS[$status]) ? $status : '';
        $where = "(:query = '' OR concat_ws(' ',o.order_code,o.customer_name,o.email,s.name,e.name) ILIKE :pattern)
            AND (:status = '' OR o.status::text = :status_value)";
        $params = ['query' => $query, 'pattern' => '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $query).'%', 'status' => $status, 'status_value' => $status];
        $joins = 'FROM orders o JOIN services s ON s.id=o.service_id LEFT JOIN extensions e ON e.id=o.extension_id';
        $total = (int) $this->db->fetchAll('SELECT count(*) AS total '.$joins.' WHERE '.$where, $params)[0]['total'];
        $pages = max(1, (int) ceil($total / self::PAGE_SIZE));
        $page = max(1, min($page, $pages));
        $orders = $this->db->fetchAll('SELECT o.id,o.order_code,o.customer_name,o.email,o.amount,o.status,o.created_at,
            s.name AS service_name,e.name AS extension_name '.$joins.' WHERE '.$where.'
            ORDER BY o.created_at DESC,o.id DESC LIMIT '.self::PAGE_SIZE.' OFFSET :offset', $params + ['offset' => ($page - 1) * self::PAGE_SIZE]);

        return ['orders' => $orders, 'total' => $total, 'page' => $page, 'pages' => $pages, 'query' => $query, 'status' => $status, 'statuses' => self::STATUS_LABELS];
    }

    public function details(string $id): ?array
    {
        $order = $this->db->fetchAll('SELECT o.*,s.name AS service_name,e.name AS extension_name,e.slug AS extension_slug
            FROM orders o JOIN services s ON s.id=o.service_id LEFT JOIN extensions e ON e.id=o.extension_id
            WHERE o.id::text=:id', ['id' => $id])[0] ?? null;
        if (null === $order) {
            return null;
        }
        $jobs = $this->db->fetchAll('SELECT q.*,last_log.status AS last_status FROM email_outbox q
            LEFT JOIN LATERAL (SELECT l.status FROM email_send_log l WHERE l.message_id=q.id::text ORDER BY l.created_at DESC,l.id DESC LIMIT 1) last_log ON true
            WHERE q.order_id::text=:id ORDER BY q.template_name', ['id' => $id]);
        foreach ($jobs as &$job) {
            $job += self::deliveryState($job);
        }
        unset($job);
        $logs = $this->db->fetchAll('SELECT l.template_name,l.recipient_email,l.status,l.error_message,l.created_at
            FROM email_send_log l JOIN email_outbox q ON l.message_id=q.id::text
            WHERE q.order_id::text=:id ORDER BY l.created_at DESC,l.id DESC LIMIT 20', ['id' => $id]);
        $website = $order['website'] ?? '';
        $order['website_url'] = filter_var($website, FILTER_VALIDATE_URL) && in_array(parse_url($website, PHP_URL_SCHEME), ['http', 'https'], true) ? $website : null;

        return ['order' => $order, 'email_jobs' => $jobs, 'email_logs' => $logs, 'statuses' => self::STATUS_LABELS];
    }

    public static function deliveryState(array $job): array
    {
        [$label, $class] = match (true) {
            'suppressed' === ($job['last_status'] ?? null) => ['Адрес исключён из отправки', 'draft'],
            null !== ($job['sent_at'] ?? null) && 'sent' === ($job['last_status'] ?? null) => ['Принято почтовым сервером', 'published'],
            null !== ($job['sent_at'] ?? null) => ['Обработано', 'draft'],
            (int) $job['attempts'] >= 8 => ['Попытки исчерпаны', 'failed'],
            (int) $job['attempts'] > 0 => ['Ожидает повторной отправки', 'draft'],
            default => ['В очереди', 'draft'],
        };

        return ['state_label' => $label, 'state_class' => $class];
    }
}
