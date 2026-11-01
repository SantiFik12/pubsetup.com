<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class ModuleImages
{
    public function __construct(#[Autowire('%kernel.project_dir%/var/storage/modules')] private string $directory)
    {
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

    public function exists(string $path): bool
    {
        return (bool) preg_match('~^/media/modules/[a-f0-9]{40}\.(?:svg|png|jpg|webp)$~D', $path) && is_file($this->directory.'/'.basename($path));
    }

    public function storeLogo(string $content): string
    {
        if (strlen($content) > 512 * 1024) {
            throw new \InvalidArgumentException('Логотип слишком большой.');
        }
        if (!str_contains($content, '<svg')) {
            return $this->store($content);
        }
        $document = new \DOMDocument();
        $previous = libxml_use_internal_errors(true);
        try {
            $loaded = $document->loadXML($content, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
        if (!$loaded || $document->doctype || 'svg' !== $document->documentElement?->localName) {
            throw new \InvalidArgumentException('Некорректный SVG-логотип.');
        }
        // Only inert vector primitives. No scripts, CSS, foreign HTML, images,
        // links, animations or external resources survive in the stored SVG.
        $tags = ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'title', 'desc'];
        $attributes = ['xmlns', 'id', 'viewBox', 'width', 'height', 'preserveAspectRatio', 'd', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy', 'transform', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'clip-path', 'clip-rule', 'mask', 'gradientUnits', 'gradientTransform', 'offset', 'stop-color', 'stop-opacity'];
        $tagMap = array_change_key_case(array_combine($tags, $tags), CASE_LOWER);
        $attributeMap = array_change_key_case(array_combine($attributes, $attributes), CASE_LOWER);
        $output = new \DOMDocument();
        // HTML parsers lowercase SVG names (viewBox, clipPath, gradients).
        // Rebuild using canonical SVG names so inline logos keep their geometry.
        $copy = static function (\DOMElement $element) use (&$copy, $output, $tagMap, $attributeMap): ?\DOMElement {
            $tag = $tagMap[strtolower($element->tagName)] ?? null;
            if (null === $tag || !in_array($element->namespaceURI, [null, 'http://www.w3.org/2000/svg'], true)) {
                return null;
            }
            $safe = $output->createElementNS('http://www.w3.org/2000/svg', $tag);
            foreach ($element->attributes as $attribute) {
                $name = $attributeMap[strtolower($attribute->nodeName)] ?? null;
                $value = trim($attribute->value);
                if (null === $name
                    || preg_match('~(?:https?:|data:|javascript:|//|[<>])~i', $value) && 'xmlns' !== $name
                    || str_contains(strtolower($value), 'url') && !preg_match('/^url\(#[a-zA-Z_][\w.-]*\)$/D', $value)) {
                    continue;
                }
                if ('xmlns' !== $name) {
                    $safe->setAttribute($name, $value);
                }
            }
            foreach ($element->childNodes as $child) {
                if ($child instanceof \DOMElement && ($copied = $copy($child))) {
                    $safe->appendChild($copied);
                } elseif ($child instanceof \DOMText && in_array($tag, ['title', 'desc'], true)) {
                    $safe->appendChild($output->createTextNode($child->textContent));
                }
            }

            return $safe;
        };
        $root = $copy($document->documentElement);
        if (!$root) {
            throw new \InvalidArgumentException('Некорректный SVG-логотип.');
        }
        $output->appendChild($root);
        if (!is_dir($this->directory) && !mkdir($this->directory, 0755, true) && !is_dir($this->directory)) {
            throw new \RuntimeException('Не удалось создать каталог изображений.');
        }
        $filename = bin2hex(random_bytes(20)).'.svg';
        if (false === file_put_contents($this->directory.'/'.$filename, $output->saveXML($root), LOCK_EX)) {
            throw new \RuntimeException('Не удалось сохранить логотип.');
        }

        return '/media/modules/'.$filename;
    }
}
