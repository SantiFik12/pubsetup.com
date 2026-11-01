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
        $dryRun = (bool) $input->getOption('dry-run');
        $write = static function (string $message) use ($output): void {
            $time = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Warsaw'));
            $message = preg_replace('/[\x00-\x1f\x7f]/u', ' ', $message);
            $output->writeln('['.$time->format('H:i:s').'] '.$message, OutputInterface::OUTPUT_RAW);
        };
        $statuses = ['updated' => 'обновлён', 'would_update' => 'будет обновлён', 'unchanged' => 'без изменений', 'failed' => 'ошибка', 'skipped' => 'пропущен'];
        $write($dryRun ? 'Пробный обход: подготовка очереди. Каталог не изменяется.' : 'Обновление каталога: подготовка очереди.');
        $progress = static function (array $event) use ($write, $statuses): void {
            switch ($event['event']) {
                case 'start':
                    $write(($event['resumed'] ? 'Продолжение запуска ' : 'Запуск ').$event['run_id'].'. Модулей: '.$event['total'].', уже обработано: '.$event['completed'].'.');
                    $write('Журнал: /admin_panel/refreshes/'.$event['run_id']);
                    break;
                case 'checking':
                    $write('['.$event['position'].'/'.$event['total'].'] '.$event['vendor_name'].' — '.$event['module_name'].': чтение страницы');
                    break;
                case 'retry':
                    $write('Повторная попытка после временной ошибки: '.$event['message']);
                    break;
                case 'media':
                    $write('Проверка локальных файлов и загрузка недостающих изображений…');
                    break;
                case 'result':
                    $message = '['.$event['completed'].'/'.$event['total'].'] '.$event['vendor_name'].' — '.$event['module_name'].': '.($statuses[$event['status']] ?? $event['status']);
                    if ($event['error']) {
                        $message .= '. '.$event['error'];
                    }
                    if ($event['warnings']) {
                        $message .= '. Предупреждений: '.$event['warnings'];
                    }
                    $write($message);
                    break;
            }
        };
        $id = $this->refresh->run((string) $input->getOption('vendor'), $dryRun, (int) $delay, (bool) $input->getOption('refresh-media'), $progress);
        if (!$id) {
            $write('Обход уже выполняется другим процессом. Новый запуск не создан.');

            return Command::SUCCESS;
        }
        $summary = $this->refresh->summary($id);
        $seconds = $summary['duration_seconds'];
        $duration = sprintf('%02d:%02d:%02d', intdiv($seconds, 3600), intdiv($seconds % 3600, 60), $seconds % 60);
        $write('ГОТОВО. '.('success' === $summary['status'] ? 'Успешно.' : 'Частично успешно.').' Длительность: '.$duration.'.');
        $write(sprintf('Проверено: %d/%d; %s: %d; без изменений: %d; ошибок: %d; пропущено: %d; с предупреждениями: %d.', $summary['total'] - $summary['skipped'], $summary['total'], $dryRun ? 'планируется обновить' : 'обновлено', $dryRun ? $summary['would_update'] : $summary['updated'], $summary['unchanged'], $summary['failed'], $summary['skipped'], $summary['warned']));
        $write('Отчёт: /admin_panel/refreshes/'.$id);

        return Command::SUCCESS;
    }
}
