<?php

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in([__DIR__.'/src', __DIR__.'/tests'])
    ->append([__DIR__.'/config/bundles.php', __DIR__.'/public/index.php', __DIR__.'/bin/console']);

return (new Config())
    ->setRules(['@Symfony' => true])
    ->setRiskyAllowed(false)
    ->setCacheFile(__DIR__.'/var/php-cs-fixer.cache')
    ->setFinder($finder);
