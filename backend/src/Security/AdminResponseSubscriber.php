<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class AdminResponseSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::RESPONSE => 'onResponse'];
    }

    public function onResponse(ResponseEvent $event): void
    {
        $path = $event->getRequest()->getPathInfo();
        if (preg_match('#^/(?:api(?:/|$)|email(?:/|$)|health$)#', $path)) {
            $event->getResponse()->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }
        if (!str_starts_with($path, '/admin_panel')) {
            return;
        }
        $headers = $event->getResponse()->headers;
        $headers->set('Cache-Control', 'private, no-store');
        $headers->set('X-Robots-Tag', 'noindex, nofollow');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('Content-Security-Policy', "default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    }
}
