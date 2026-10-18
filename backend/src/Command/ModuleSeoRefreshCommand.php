<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\Database;
use App\Service\ModuleSeo;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:seo:refresh', description: 'Generate missing module SEO metadata from stored content without network requests')]
final class ModuleSeoRefreshCommand extends Command
{
    public function __construct(private readonly Database $db)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Regenerate existing metadata as well');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $force = (bool) $input->getOption('force');
        $rows = $this->db->fetchAll('SELECT row_to_json(e) AS data FROM extensions e'.($force ? '' : " WHERE seo_title='' OR seo_description=''").' ORDER BY id');
        foreach ($rows as $row) {
            $module = json_decode($row['data'], true, 512, JSON_THROW_ON_ERROR);
            $generated = ModuleSeo::generate($module);
            $this->db->execute('UPDATE extensions SET seo_title=:title,seo_description=:description WHERE id=:id', [
                'id' => $module['id'],
                'title' => $force || '' === $module['seo_title'] ? $generated['seo_title'] : $module['seo_title'],
                'description' => $force || '' === $module['seo_description'] ? $generated['seo_description'] : $module['seo_description'],
            ]);
        }
        $output->writeln(sprintf('<info>Updated SEO metadata for %d modules.</info>', count($rows)));

        return Command::SUCCESS;
    }
}
