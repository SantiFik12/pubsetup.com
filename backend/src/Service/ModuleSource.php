<?php

declare(strict_types=1);

namespace App\Service;

interface ModuleSource
{
    public function inspect(string $url): array;

    public function materialize(array $data, array $media = []): array;
}
