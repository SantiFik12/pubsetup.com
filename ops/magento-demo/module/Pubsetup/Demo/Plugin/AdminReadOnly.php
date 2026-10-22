<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\App\ActionInterface;
use Magento\Framework\App\Request\Http;
use Magento\Framework\Controller\Result\RawFactory;
use Pubsetup\Demo\Model\AdminPolicy;
use Pubsetup\Demo\Model\ViewerSession;

final class AdminReadOnly
{
    public function __construct(
        private ViewerSession $viewer,
        private AdminPolicy $policy,
        private Http $request,
        private RawFactory $rawFactory
    ) {
    }

    public function aroundExecute(ActionInterface $subject, callable $proceed)
    {
        if (!$this->viewer->isDemo()) {
            return $proceed();
        }
        $action = $this->request->getFullActionName();
        // Grids automatically save their current view. Acknowledge the request without
        // executing Magento's controller or persisting settings shared by demo visitors.
        if ($this->viewer->isPublicViewer()
            && $this->policy->ignoresBookmarkSave($action, $this->request->getMethod(), $this->request->getParam('namespace'))) {
            return $this->rawFactory->create()->setHttpResponseCode(200)
                ->setHeader('Content-Type', 'application/json; charset=UTF-8', true)
                ->setContents('{}');
        }
        // A public username accidentally assigned another role must fail closed.
        if (($this->viewer->isPublicViewer() || $action === 'adminhtml_auth_logout')
            && $this->policy->allows($action, $this->request->getMethod(), $this->request->getParam('namespace'), $this->request->getParam('section'))) {
            return $proceed();
        }
        return $this->rawFactory->create()->setHttpResponseCode(403)
            ->setHeader('Content-Type', 'text/plain; charset=UTF-8', true)
            ->setContents('Demo admin is read-only. This action is disabled.');
    }
}
