<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\Event\Observer;
use Magento\TwoFactorAuth\Observer\ControllerActionPredispatch;
use Pubsetup\Demo\Model\ViewerSession;

/** Public, read-only account only. The owner's 2FA stays enabled. */
final class DemoTwoFactor
{
    public function __construct(private ViewerSession $viewer)
    {
    }

    public function aroundExecute(ControllerActionPredispatch $subject, callable $proceed, Observer $observer)
    {
        if ($this->viewer->isPublicViewer()) {
            return null;
        }
        return $proceed($observer);
    }
}
