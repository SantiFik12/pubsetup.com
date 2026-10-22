<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\Mail\TransportInterface;

final class BlockMail
{
    public function aroundSendMessage(TransportInterface $subject, callable $proceed): void
    {
        // Deliberately do not call the transport, including when a mail queue is processed.
    }
}
