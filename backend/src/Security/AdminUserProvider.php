<?php

declare(strict_types=1);

namespace App\Security;

use App\Service\Database;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

final readonly class AdminUserProvider implements UserProviderInterface
{
    public function __construct(private Database $db)
    {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $row = $this->db->fetchAll('SELECT id,email,password_hash FROM admin_users WHERE email = :email AND enabled = true', ['email' => strtolower(trim($identifier))])[0] ?? null;
        if (null === $row) {
            throw new UserNotFoundException();
        }

        return new AdminUser($row['id'], $row['email'], $row['password_hash']);
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof AdminUser) {
            throw new UnsupportedUserException();
        }

        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return AdminUser::class === $class;
    }
}
