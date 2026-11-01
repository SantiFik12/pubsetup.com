<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminCatalog;
use App\Service\Database;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class AdminRefreshController extends AbstractController
{
    #[Route('/admin_panel/refreshes', name: 'admin_refreshes', methods: ['GET'])]
    public function index(Database $db, AdminCatalog $catalog): Response
    {
        $runs = $db->fetchAll("SELECT r.*,count(i.id) AS total,count(i.id) FILTER(WHERE i.status='updated') AS updated,count(i.id) FILTER(WHERE i.status='unchanged') AS unchanged,count(i.id) FILTER(WHERE i.status='would_update') AS would_update,count(i.id) FILTER(WHERE i.status='failed') AS failed,count(i.id) FILTER(WHERE i.status='skipped') AS skipped,count(i.id) FILTER(WHERE i.status IN ('pending','processing')) AS pending,count(i.id) FILTER(WHERE jsonb_array_length(i.warnings)>0) AS warned,(r.status='running' AND (r.heartbeat_at<now()-interval '15 minutes' OR r.error<>'')) AS stalled FROM catalog_refresh_runs r LEFT JOIN catalog_refresh_items i ON i.run_id=r.id GROUP BY r.id ORDER BY r.started_at DESC LIMIT 50");
        $now = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Warsaw'));
        $next = $now->setTime(22, 0);
        $next = '7' !== $now->format('N') ? $next->modify('next sunday') : ($next <= $now ? $next->modify('+7 days') : $next);
        $expected = $next->modify('-7 days');
        $last = $db->fetchAll("SELECT started_at FROM catalog_refresh_runs WHERE dry_run=false AND vendor_id='' ORDER BY started_at DESC LIMIT 1")[0]['started_at'] ?? null;

        return $this->render('admin/refreshes.html.twig', ['vendors' => $catalog->vendors(), 'runs' => $runs, 'next_run' => $next, 'overdue' => !$last || new \DateTimeImmutable($last) < $expected]);
    }

    #[Route('/admin_panel/refreshes/{id}', name: 'admin_refresh_detail', methods: ['GET'])]
    public function detail(string $id, Database $db, AdminCatalog $catalog): Response
    {
        $run = $db->fetchAll('SELECT * FROM catalog_refresh_runs WHERE id::text=:id', ['id' => $id])[0] ?? null;
        if (!$run) {
            throw $this->createNotFoundException();
        }
        $items = $db->fetchAll('SELECT * FROM catalog_refresh_items WHERE run_id=:id ORDER BY vendor_name,module_name', ['id' => $id]);
        foreach ($items as &$item) {
            $item['changes'] = json_decode($item['changes'], true, 512, JSON_THROW_ON_ERROR);
            $item['warnings'] = json_decode($item['warnings'], true, 512, JSON_THROW_ON_ERROR);
        }
        unset($item);

        return $this->render('admin/refresh.html.twig', ['vendors' => $catalog->vendors(), 'run' => $run, 'items' => $items]);
    }
}
