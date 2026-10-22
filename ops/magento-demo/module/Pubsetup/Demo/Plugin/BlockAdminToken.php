<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Plugin;

use Magento\Framework\Exception\AuthenticationException;
use Magento\Authorization\Model\UserContextInterface;
use Magento\User\Model\UserFactory;
use Pubsetup\Demo\Model\AdminPolicy;

final class BlockAdminToken
{
    public function __construct(private UserFactory $users, private AdminPolicy $policy)
    {
    }

    public function beforeCreateAdminAccessToken($subject, $username, $password): void
    {
        $user = $this->users->create()->loadByUsername($username);
        if ($this->policy->isDemoIdentity((string) $username, (string) $user->getRole()->getRoleName())) {
            throw new AuthenticationException(__('API tokens are disabled for the demo account.'));
        }
    }

    public function beforeCreate($subject, UserContextInterface $context, $params): void
    {
        if ($context->getUserType() === UserContextInterface::USER_TYPE_ADMIN) {
            $this->assertNotDemo((int) $context->getUserId());
        }
    }

    public function beforeCreateAdminToken($subject, $userId): void
    {
        $this->assertNotDemo((int) $userId);
    }

    private function assertNotDemo(int $userId): void
    {
        $user = $this->users->create()->load($userId);
        if ($this->policy->isDemoIdentity((string) $user->getUserName(), (string) $user->getRole()->getRoleName())) {
            throw new AuthenticationException(__('API tokens are disabled for the demo account.'));
        }
    }
}
