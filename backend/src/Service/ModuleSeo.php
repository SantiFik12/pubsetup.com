<?php

declare(strict_types=1);

namespace App\Service;

final class ModuleSeo
{
    public const int TITLE_LIMIT = 65;
    public const int DESCRIPTION_LIMIT = 160;

    public static function generate(array $module): array
    {
        $name = self::clean($module['name'] ?? 'Magento 2 Extension');
        $title = self::title($name, self::clean($module['seo_source_title'] ?? ''));
        $description = '';
        foreach (['seo_source_description', 'short_description', 'description'] as $field) {
            $text = self::clean($module[$field] ?? '');
            if ('' === $text) {
                continue;
            }
            $sentences = preg_split('/(?<=[.!?])\s+/u', $text);
            $selected = [];
            foreach ($sentences as $sentence) {
                $sentence = self::finish($sentence);
                if (mb_strlen(implode(' ', [...$selected, $sentence])) > self::DESCRIPTION_LIMIT) {
                    break;
                }
                $selected[] = $sentence;
            }
            if ([] !== $selected && mb_strlen(implode(' ', $selected)) >= 60) {
                $description = implode(' ', $selected);
                break;
            }
        }
        if ('' === $description) {
            $intro = self::finish('Explore '.self::words($name, 80));
            $features = $module['features'] ?? [];
            if (is_string($features)) {
                $features = preg_split('/[\r\n]+/', $features);
            }
            foreach ($features as $feature) {
                $sentence = self::finish(self::clean($feature));
                if ('' !== $sentence && mb_strlen($intro.' '.$sentence) <= self::DESCRIPTION_LIMIT) {
                    $description = $intro.' '.$sentence;
                    break;
                }
            }
            if ('' === $description) {
                $description = $intro.' Compare features and compatibility, with expert installation available.';
            }
        }

        return ['seo_title' => $title, 'seo_description' => $description];
    }

    private static function title(string $name, string $source): string
    {
        $parts = preg_split('/\s*[|–—]\s*/u', $source);
        $candidate = $parts[0] ?? '';
        $keywords = array_filter(preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($name)), static fn (string $word): bool => mb_strlen($word) > 2 && !in_array($word, ['magento', 'extension', 'extensions', 'module', 'for', 'and', 'the'], true));
        $matchesProduct = array_any($keywords, fn ($keyword) => preg_match('/(?<!\p{L})'.preg_quote($keyword, '/').'(?!\p{L})/iu', $candidate));
        if ($matchesProduct && preg_match('/\bmagento\s*2\b/iu', $candidate) && mb_strlen($candidate) <= self::TITLE_LIMIT) {
            $title = $candidate;
            foreach (array_slice($parts, 1) as $part) {
                $detail = trim(preg_replace('/\b(?:for\s+)?magento\s*2\b|\b(?:extensions?|modules?)\b/iu', '', $part));
                $detail = trim(preg_replace('/\s+/u', ' ', $detail));
                $tokens = array_filter(preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($detail)), static fn (string $word): bool => mb_strlen($word) > 2 && !in_array($word, ['and', 'the', 'for', 'with', 'from', 'store'], true));
                $new = array_filter($tokens, static fn (string $word): bool => !preg_match('/(?<!\p{L})'.preg_quote($word, '/').'(?!\p{L})/iu', $title));
                if (count($new) >= 2 && mb_strlen($title.' | '.$detail) <= self::TITLE_LIMIT) {
                    $title .= ' | '.$detail;
                    break;
                }
            }
        } else {
            $core = preg_replace('/\b(?:for\s+)?magento\s*2\b/iu', '', $name);
            $core = preg_replace('/^[\s|–—-]+|[\s|–—-]+$/u', '', preg_replace('/\s+/u', ' ', $core));
            $title = 'Magento 2 '.$core;
            $title = self::words($title, self::TITLE_LIMIT);
        }
        foreach (['FAQ', 'SEO', 'GDPR', 'CCPA', 'B2B', 'AJAX'] as $acronym) {
            $title = preg_replace('/\b'.$acronym.'\b/iu', $acronym, $title);
        }

        return $title;
    }

    private static function words(string $text, int $limit): string
    {
        if (mb_strlen($text) <= $limit) {
            return $text;
        }
        $head = mb_substr($text, 0, $limit + 1);
        $space = mb_strrpos($head, ' ');

        return preg_replace('/[\s,;:|–—-]+$/u', '', mb_substr($head, 0, false === $space ? $limit : $space));
    }

    private static function finish(string $text): string
    {
        $text = trim($text);
        if ('' === $text) {
            return '';
        }

        return preg_match('/[.!?]$/u', $text) ? $text : preg_replace('/[\s,;:…]+$/u', '', $text).'.';
    }

    private static function clean(mixed $value): string
    {
        if (!is_string($value)) {
            return '';
        }

        return trim(preg_replace('/\s+/u', ' ', strip_tags(html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'))));
    }
}
