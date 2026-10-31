<?php

declare(strict_types=1);

namespace App\Service;

final class AffiliateLinks
{
    public static function validate(string $template): string
    {
        $template = trim($template);
        if (strlen($template) > 2048 || preg_match('/[{}]/', str_replace(['{url}', '{url_encoded}'], '', $template))) {
            throw new \InvalidArgumentException('Укажите affiliate-ссылку, параметры ?ref=… или шаблон с {url} / {url_encoded}, до 2048 символов.');
        }
        if ('' !== $template) {
            self::resolve('', $template, 'https://vendor.example/module.html');
        }

        return $template;
    }

    public static function resolve(string $individual, string $template, string $original): string
    {
        if ('' !== $individual) {
            return AdminCatalog::url($individual, true);
        }
        if ('' === $template) {
            return AdminCatalog::url($original, true);
        }
        if (str_starts_with($template, '?')) {
            // Append tracking parameters before a fragment, preserving product options.
            $parts = explode('#', $original, 2);
            $target = $parts[0].(str_contains($parts[0], '?') ? '&' : '?').substr($template, 1);
            if (isset($parts[1])) {
                $target .= '#'.$parts[1];
            }
        } else {
            $target = str_replace(['{url_encoded}', '{url}'], [rawurlencode($original), $original], $template);
        }

        return AdminCatalog::url($target, true);
    }
}
