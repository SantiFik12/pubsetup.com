<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Model;

use Magento\Backend\Model\Auth\Session;

final class ViewerSession
{
    public function __construct(private Session $session, private AdminPolicy $policy)
    {
    }

    public function isDemo(): bool
    {
        $user = $this->session->getUser();
        return $user && $this->policy->isDemoIdentity(
            (string) $user->getUserName(), (string) $user->getRole()->getRoleName()
        );
    }

    public function isPublicViewer(): bool
    {
        $user = $this->session->getUser();
        return $user && $this->policy->isPublicViewer(
            (string) $user->getUserName(), (string) $user->getRole()->getRoleName()
        );
    }
}
