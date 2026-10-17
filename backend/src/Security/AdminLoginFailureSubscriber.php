<?php

declare(strict_types=1);

namespace App\Security;

use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;

final readonly class AdminLoginFailureSubscriber implements EventSubscriberInterface
{
    public function __construct(private LoggerInterface $logger)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [LoginFailureEvent::class => 'onFailure'];
    }

    public function onFailure(LoginFailureEvent $event): void
    {
        if ('admin' !== $event->getFirewallName()) {
            return;
        }

        // Log only the failure type, never submitted credentials or session tokens.
        $this->logger->warning('Admin login failed: '.$event->getException()::class);
    }
}
