<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Block;

use Magento\Backend\Block\Template;
use Magento\Backend\Block\Template\Context;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\User\Model\UserFactory;
use Pubsetup\Demo\Model\AdminPolicy;

class LoginCredentials extends Template
{
    public function __construct(Context $context, private ScopeConfigInterface $scopeConfig,
        private UserFactory $users, private AdminPolicy $policy, array $data = [])
    {
        parent::__construct($context, $data);
    }

    public function getDemoUsername(): string
    {
        return AdminPolicy::USERNAME;
    }

    public function getDemoPassword(): string
    {
        $user = $this->users->create()->loadByUsername(AdminPolicy::USERNAME);
        if (!$user->getId() || !$this->policy->isPublicViewer((string) $user->getUserName(), (string) $user->getRole()->getRoleName())) {
            return '';
        }

        return (string) $this->scopeConfig->getValue(AdminPolicy::PUBLIC_PASSWORD_PATH);
    }

    protected function _toHtml()
    {
        return '' !== $this->getDemoPassword() ? parent::_toHtml() : '';
    }
}
