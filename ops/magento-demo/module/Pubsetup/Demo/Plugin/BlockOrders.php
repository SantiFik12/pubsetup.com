<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\Exception\LocalizedException;
use Magento\Sales\Api\Data\OrderInterface;

/** Global scope: checkout, REST, GraphQL, multishipping and admin order placement. */
final class BlockOrders
{
    public const MESSAGE = 'Demo store — ordering is disabled.';

    public function beforePlaceOrder($subject, ...$args): void
    {
        throw new LocalizedException(__(self::MESSAGE));
    }

    public function beforeSubmit($subject, ...$args): void
    {
        throw new LocalizedException(__(self::MESSAGE));
    }

    public function beforePlace($subject, ...$args): void
    {
        throw new LocalizedException(__(self::MESSAGE));
    }

    public function beforeSave($subject, OrderInterface $order): void
    {
        if (!$order->getEntityId()) {
            throw new LocalizedException(__(self::MESSAGE));
        }
    }
}
