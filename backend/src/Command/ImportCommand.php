<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\Database;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:import', description: 'Import a Supabase JSON export transactionally; does not delete existing records')]
final class ImportCommand extends Command
{
    public const array TABLES = ['partners', 'categories', 'extensions', 'services', 'blog_posts', 'seo_landings', 'app_settings', 'orders', 'contact_messages', 'suppressed_emails', 'email_unsubscribe_tokens', 'email_send_log'];

    public function __construct(private readonly Database $db)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('file', InputArgument::REQUIRED, 'JSON export path, or - for stdin');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = $input->getArgument('file');
        $data = json_decode(file_get_contents('-' === $path ? 'php://stdin' : $path), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) {
            throw new \InvalidArgumentException('Expected a table-to-rows JSON object');
        }
        $pdo = $this->db->connection();
        $pdo->beginTransaction();
        try {
            foreach (self::TABLES as $table) {
                if (!isset($data[$table])) {
                    continue;
                }
                if (!is_array($data[$table]) || !array_is_list($data[$table])) {
                    throw new \InvalidArgumentException('Invalid table '.$table);
                }
                $columns = array_column($this->db->fetchAll('SELECT column_name FROM information_schema.columns WHERE table_schema = :schema AND table_name = :table', ['schema' => 'public', 'table' => $table]), 'column_name');
                foreach ($data[$table] as $row) {
                    if (!is_array($row) || !array_key_exists('id', $row)) {
                        throw new \InvalidArgumentException('Every imported row requires id');
                    }
                    $unknown = array_diff(array_keys($row), $columns);
                    if ([] !== $unknown) {
                        throw new \InvalidArgumentException('Unknown columns in '.$table.': '.implode(',', $unknown));
                    }
                    $names = array_keys($row);
                    $quoted = array_map(static fn (string $c): string => '"'.$c.'"', $names);
                    $update = implode(',', array_map(static fn (string $c): string => '"'.$c.'" = EXCLUDED."'.$c.'"', array_diff($names, ['id'])));
                    $sql = 'INSERT INTO "'.$table.'" ('.implode(',', $quoted).') SELECT '.implode(',', $quoted).' FROM json_populate_record(NULL::"'.$table.'", CAST(:row AS json)) ON CONFLICT(id) '.('' === $update ? 'DO NOTHING' : 'DO UPDATE SET '.$update);
                    $this->db->execute($sql, ['row' => json_encode($row, JSON_THROW_ON_ERROR)]);
                }
                $output->writeln($table.': '.count($data[$table]));
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return Command::SUCCESS;
    }
}
