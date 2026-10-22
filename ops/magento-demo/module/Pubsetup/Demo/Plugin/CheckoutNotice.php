<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\App\ActionInterface;
use Magento\Framework\App\Request\Http;
use Magento\Framework\Controller\Result\RedirectFactory;
use Magento\Framework\Message\ManagerInterface;

final class CheckoutNotice
{
    public function __construct(private Http $request, private RedirectFactory $redirects, private ManagerInterface $messages)
    {
    }

    public function aroundExecute(ActionInterface $subject, callable $proceed)
    {
        if ($this->request->getFullActionName() === 'checkout_index_index'
            || $this->request->getModuleName() === 'multishipping') {
            $this->messages->addNoticeMessage(__(BlockOrders::MESSAGE));
            return $this->redirects->create()->setPath('checkout/cart');
        }
        return $proceed();
    }
}
