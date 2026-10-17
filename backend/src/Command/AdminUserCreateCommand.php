<?php

declare(strict_types=1);

namespace App\Command;

use App\Security\AdminUser;
use App\Service\Database;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'admin:user:create', description: 'Create an admin_panel user with a hashed password')]
final class AdminUserCreateCommand extends Command
{
    public function __construct(private readonly Database $db, private readonly UserPasswordHasherInterface $hasher)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('email', InputArgument::REQUIRED, 'Administrator email');
        $this->addOption('password-stdin', null, InputOption::VALUE_NONE, 'Read password from stdin; avoids exposing it in process arguments');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $email = strtolower(trim($input->getArgument('email')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
            $output->writeln('<error>Provide a valid email.</error>');

            return Command::INVALID;
        }
        if ([] !== $this->db->fetchAll('SELECT id FROM admin_users WHERE email = :email', ['email' => $email])) {
            $output->writeln('<error>This administrator already exists.</error>');

            return Command::FAILURE;
        }
        if ($input->getOption('password-stdin')) {
            $password = rtrim(stream_get_contents(STDIN, 4097), "\r\n");
        } elseif ($input->isInteractive()) {
            $helper = $this->getHelper('question');
            if (!$helper instanceof QuestionHelper) {
                throw new \LogicException('Question helper is not available.');
            }
            $question = new Question('Password (at least 8 characters): ');
            $question->setHidden(true);
            $question->setHiddenFallback(false);
            $password = (string) $helper->ask($input, $output, $question);
            $confirm = new Question('Repeat password: ');
            $confirm->setHidden(true);
            $confirm->setHiddenFallback(false);
            if ($password !== (string) $helper->ask($input, $output, $confirm)) {
                $output->writeln('<error>Passwords do not match.</error>');

                return Command::INVALID;
            }
        } else {
            $output->writeln('<error>Use interactive mode or --password-stdin.</error>');

            return Command::INVALID;
        }
        if (mb_strlen($password, 'UTF-8') < 8 || strlen($password) > 4096) {
            $output->writeln('<error>Password must be at least 8 characters and at most 4096 bytes.</error>');

            return Command::INVALID;
        }
        $hash = $this->hasher->hashPassword(new AdminUser('', $email, ''), $password);
        $this->db->execute('INSERT INTO admin_users(email,password_hash) VALUES (:email,:hash)', ['email' => $email, 'hash' => $hash]);
        $output->writeln('<info>Administrator created. Sign in at /admin_panel.</info>');

        return Command::SUCCESS;
    }
}
