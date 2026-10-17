<?php

declare(strict_types=1);

namespace App\Service;

final class Database
{
    private ?\PDO $connection = null;

    public function __construct(private readonly string $databaseUrl)
    {
    }

    public function connection(): \PDO
    {
        if (null !== $this->connection) {
            return $this->connection;
        }
        $url = parse_url($this->databaseUrl);
        if (!is_array($url) || !isset($url['host'], $url['path'], $url['user'])) {
            throw new \RuntimeException('Invalid DATABASE_URL');
        }

        return $this->connection = new \PDO(
            sprintf('pgsql:host=%s;port=%d;dbname=%s', $url['host'], $url['port'] ?? 5432, ltrim($url['path'], '/')),
            rawurldecode($url['user']), rawurldecode($url['pass'] ?? ''),
            [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::ATTR_EMULATE_PREPARES => false],
        );
    }

    public function fetchAll(string $sql, array $params = []): array
    {
        $statement = $this->connection()->prepare($sql);
        $statement->execute($params);

        return $statement->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function execute(string $sql, array $params = []): int
    {
        $statement = $this->connection()->prepare($sql);
        $statement->execute($params);

        return $statement->rowCount();
    }
}
