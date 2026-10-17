<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\EmailWorker;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:email-worker', description: 'Deliver queued order emails through Postmark')]
final class EmailWorkerCommand extends Command
{
    public function __construct(private readonly EmailWorker $worker)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('once', null, InputOption::VALUE_NONE, 'Drain available jobs and exit');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        while (true) {
            $processed = $this->worker->processOne();
            if (!$processed) {
                if ($input->getOption('once')) {
                    break;
                }
                sleep(5);
            }
        }

        return Command::SUCCESS;
    }
}
