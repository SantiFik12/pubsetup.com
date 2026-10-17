<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final readonly class ModuleImages
{
    public function __construct(#[Autowire('%kernel.project_dir%/var/storage/modules')] private string $directory)
    {
    }

    public function upload(UploadedFile $file): string
    {
        if (!$file->isValid() || $file->getSize() > 8 * 1024 * 1024) {
            throw new \InvalidArgumentException('Фото не загрузилось или превышает 8 МБ.');
        }

        return $this->store(file_get_contents($file->getPathname()));
    }

    public function store(string $content): string
    {
        if (strlen($content) > 8 * 1024 * 1024) {
            throw new \InvalidArgumentException('Фото превышает 8 МБ.');
        }
        $mime = new \finfo(FILEINFO_MIME_TYPE)->buffer($content);
        $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
        $size = @getimagesizefromstring($content);
        if (null === $extension || false === $size || $size[0] * $size[1] > 40000000) {
            throw new \InvalidArgumentException('Загрузите корректное изображение JPG, PNG или WebP до 40 мегапикселей.');
        }
        if (!is_dir($this->directory) && !mkdir($this->directory, 0755, true) && !is_dir($this->directory)) {
            throw new \RuntimeException('Не удалось создать каталог изображений.');
        }
        $filename = bin2hex(random_bytes(20)).'.'.$extension;
        if (false === file_put_contents($this->directory.'/'.$filename, $content, LOCK_EX)) {
            throw new \RuntimeException('Не удалось сохранить изображение.');
        }

        return '/media/modules/'.$filename;
    }
}
