<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\Database;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class UnsubscribeController
{
    #[Route('/email/unsubscribe', methods: ['GET', 'POST'])]
    public function unsubscribe(Request $request, Database $db): Response
    {
        $token = $request->query->getString('token');
        if (strlen($token) > 256 || '' === $token) {
            return new Response('Invalid unsubscribe link', 400);
        }
        $row = $db->fetchAll('SELECT email FROM email_unsubscribe_tokens WHERE token = :token', ['token' => $token])[0] ?? null;
        if (null === $row) {
            return new Response('Invalid unsubscribe link', 404);
        }
        if ($request->isMethod('POST')) {
            $pdo = $db->connection();
            $pdo->beginTransaction();
            try {
                $db->execute("INSERT INTO suppressed_emails(email,reason) VALUES (lower(:email),'unsubscribe') ON CONFLICT(email) DO NOTHING", ['email' => $row['email']]);
                $db->execute('UPDATE email_unsubscribe_tokens SET used_at = COALESCE(used_at, now()) WHERE token = :token', ['token' => $token]);
                $pdo->commit();
            } catch (\Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }

            return new Response('You have been unsubscribed.', 200, ['Cache-Control' => 'no-store']);
        }

        return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><title>Unsubscribe</title><h1>Unsubscribe from emails</h1><form method="post"><button>Confirm unsubscribe</button></form></html>', 200, ['Cache-Control' => 'no-store', 'Referrer-Policy' => 'no-referrer']);
    }
}
