<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminCatalog;
use App\Service\AffiliateLinks;
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
        $module = $db->fetchAll('SELECT e.id,e.slug,e.original_url,e.affiliate_url,p.affiliate_template FROM extensions e JOIN partners p ON p.id=e.partner_id WHERE e.slug=:slug AND e.published=true', ['slug' => $slug])[0] ?? null;
        if (!$module) {
            throw new NotFoundHttpException();
        }
        $target = '/extension/'.rawurlencode($module['slug']);
        if ('affiliate' === $kind) {
            try {
                $target = AffiliateLinks::resolve($module['affiliate_url'], $module['affiliate_template'], $module['original_url']);
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
