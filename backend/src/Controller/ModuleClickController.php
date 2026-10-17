<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminCatalog;
use App\Service\Database;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class ModuleClickController
{
    #[Route('/go/{kind}/{slug}', methods: ['GET'], requirements: ['kind' => 'module|affiliate'])]
    public function click(Request $request, string $kind, string $slug, Database $db): RedirectResponse
    {
        $module = $db->fetchAll('SELECT id,slug,original_url,affiliate_url FROM extensions WHERE slug=:slug AND published=true', ['slug' => $slug])[0] ?? null;
        if (!$module) {
            throw new NotFoundHttpException();
        }
        $target = 'module' === $kind ? '/extension/'.rawurlencode($module['slug']) : ($module['affiliate_url'] ?: $module['original_url']);
        if ('affiliate' === $kind) {
            try {
                AdminCatalog::url($target, true);
            } catch (\InvalidArgumentException) {
                throw new NotFoundHttpException();
            }
        }
        // Native links avoid Next.js prefetch; HEAD probes do not count as clicks.
        if ($request->isMethod('GET')) {
            $column = 'module' === $kind ? 'module_clicks' : 'affiliate_clicks';
            $db->execute('INSERT INTO module_metrics(extension_id,'.$column.') VALUES (:id,1) ON CONFLICT(extension_id) DO UPDATE SET '.$column.'=module_metrics.'.$column.'+1', ['id' => $module['id']]);
        }

        return new RedirectResponse($target, 302, ['Cache-Control' => 'private, no-store', 'X-Robots-Tag' => 'noindex, nofollow']);
    }
}
