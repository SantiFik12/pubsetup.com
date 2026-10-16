<?php

declare(strict_types=1);
namespace App\Command;
use App\Service\Database;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
#[AsCommand(name: 'app:migrate', description: 'Apply versioned PostgreSQL migrations')]
final class MigrateCommand extends Command
{
    public function __construct(private readonly Database $db) { parent::__construct(); }
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $pdo = $this->db->connection();
        $pdo->exec('SELECT pg_advisory_lock(731729001)');
        try {
            $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
            $files = glob(dirname(__DIR__, 2).'/migrations/*.sql'); sort($files);
            foreach ($files as $file) {
                $version = basename($file); $sql = file_get_contents($file); $checksum = hash('sha256', $sql);
                $existing = $this->db->fetchAll('SELECT checksum FROM schema_migrations WHERE version = :v', ['v' => $version]);
                if ($existing !== []) {
                    if (!hash_equals($existing[0]['checksum'], $checksum)) { throw new \RuntimeException('Applied migration changed: '.$version); }
                    continue;
                }
                $pdo->beginTransaction();
                try {
                    $pdo->exec($sql);
                    $this->db->execute('INSERT INTO schema_migrations(version,checksum) VALUES (:v,:c)', ['v' => $version, 'c' => $checksum]);
                    $pdo->commit(); $output->writeln('Applied '.$version);
                } catch (\Throwable $e) { $pdo->rollBack(); throw $e; }
            }
        } finally { $pdo->exec('SELECT pg_advisory_unlock(731729001)'); }
        return Command::SUCCESS;
    }
}
