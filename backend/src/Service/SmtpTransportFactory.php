<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;
use Symfony\Component\Mailer\Transport\TransportInterface;

final readonly class SmtpTransportFactory
{
    public function __construct(private string $smtpHost, private int $smtpPort,
        private string $smtpUsername, #[\SensitiveParameter] private string $smtpPassword,
        private string $smtpEncryption)
    {
    }

    public function configurationError(): ?string
    {
        if ('' === trim($this->smtpHost) || '' === trim($this->smtpUsername) || '' === $this->smtpPassword) {
            return 'SMTP is not configured. Set SMTP_HOST, SMTP_USERNAME and SMTP_PASSWORD.';
        }
        if ($this->smtpPort < 1 || $this->smtpPort > 65535 || !in_array($this->smtpEncryption, ['ssl', 'tls'], true)) {
            return 'Invalid SMTP configuration. Set SMTP_PORT and SMTP_ENCRYPTION (ssl or tls).';
        }

        return null;
    }

    public function create(): TransportInterface
    {
        // Credentials are supplied as separate values; passwords need no URL encoding.
        $transport = new EsmtpTransport($this->smtpHost, $this->smtpPort, 'ssl' === $this->smtpEncryption);
        $transport->setUsername($this->smtpUsername)->setPassword($this->smtpPassword);
        $transport->setRequireTls(true);
        /** @var SocketStream $stream */
        $stream = $transport->getStream();
        $stream->setTimeout(20);

        return $transport;
    }
}
