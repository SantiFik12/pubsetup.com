<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Controller\Admin;

use Magento\Backend\Model\UrlInterface;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\Controller\Result\RedirectFactory;

/** A stable public link; never hard-code the installation's backend front name. */
class Index implements HttpGetActionInterface
{
    public function __construct(private UrlInterface $backendUrl, private RedirectFactory $redirects)
    {
    }

    public function execute()
    {
        return $this->redirects->create()->setUrl($this->backendUrl->getUrl('adminhtml/auth/login'));
    }
}
