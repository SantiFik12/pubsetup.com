<?php

declare(strict_types=1);

function secret(string $label): string
{
    fwrite(STDOUT, $label);
    $settings = shell_exec('stty -g');
    if ($settings === null || trim($settings) === '') {
        throw new RuntimeException('Run this command with a terminal (without -T).');
    }
    system('stty -echo');
    try {
        $value = trim((string) fgets(STDIN));
    } finally {
        system('stty '.escapeshellarg(trim($settings)));
        fwrite(STDOUT, PHP_EOL);
    }
    if ($value === '') {
        throw new RuntimeException('The key must not be empty.');
    }
    return $value;
}

$public = secret('Adobe Marketplace public key: ');
$private = secret('Adobe Marketplace private key: ');
$path = getenv('COMPOSER_HOME').'/auth.json';
$auth = is_file($path) ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : [];
$auth['http-basic']['repo.magento.com'] = ['username' => $public, 'password' => $private];
file_put_contents($path, json_encode($auth, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), LOCK_EX);
chmod($path, 0600);
fwrite(STDOUT, "Credentials saved in the separate composer_home volume.\n");
