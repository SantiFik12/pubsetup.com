<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\CatalogRefresh;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:catalog:refresh', description: 'Check published vendor modules, update changed data and record a resumable run')]
final class CatalogRefreshCommand extends Command
{
    public function __construct(private readonly CatalogRefresh $refresh)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('vendor', null, InputOption::VALUE_REQUIRED, 'Restrict to a vendor UUID', '');
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Record planned changes without changing catalog data or downloading media');
        $this->addOption('refresh-media', null, InputOption::VALUE_NONE, 'Download media again, including images replaced at the same source URL');
        $this->addOption('delay', null, InputOption::VALUE_REQUIRED, 'Minimum seconds between product requests to one host', '3');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $delay = $input->getOption('delay');
        if (!is_string($delay) || !ctype_digit($delay) || (int) $delay > 60) {
            $output->writeln('<error>Delay must be an integer between 0 and 60.</error>');

            return Command::INVALID;
        }
        $id = $this->refresh->run((string) $input->getOption('vendor'), (bool) $input->getOption('dry-run'), (int) $delay, (bool) $input->getOption('refresh-media'));
        $output->writeln($id ? 'Catalog refresh finished: '.$id.' (see /admin_panel/refreshes)' : 'Another catalog refresh is already running.');

        return Command::SUCCESS;
    }
}
