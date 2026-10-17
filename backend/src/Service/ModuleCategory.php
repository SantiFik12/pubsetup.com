<?php

declare(strict_types=1);

namespace App\Service;

final class ModuleCategory
{
    private const array DEFINITIONS = [
        ['navigation-search', 'Navigation & Search', 'Search', 'layered navigation|navigation|advanced search|search|product filter|product filtering'],
        ['compliance', 'Compliance & Legal', 'Scale', 'privacy|gdpr|ccpa|consent|compliance|cookie consent'],
        ['checkout', 'Checkout', 'ShoppingCart', 'one step checkout|checkout|shopping cart|abandoned cart'],
        ['shipping-payments', 'Shipping & Payments', 'Truck', 'shipping|delivery|payment|payments|shipping rates'],
        ['seo-performance', 'SEO & Performance', 'Gauge', 'seo|search engine optimization|site speed|page speed|performance|cache|caching'],
        ['promotions', 'Promotions', 'Tag', 'promotion|promotions|discount|discounts|coupon|coupons|free gift|special offer'],
        ['analytics-reporting', 'Analytics & Reporting', 'ChartColumn', 'analytics|reporting|reports|tracking|google analytics'],
        ['b2b', 'B2B', 'Building2', 'b2b|company account|company accounts|request a quote|wholesale'],
        ['catalog-management', 'Catalog Management', 'Package', 'catalog|product feed|product import|product export|product management|product attributes'],
        ['sales-marketing', 'Sales & Marketing', 'Megaphone', 'marketing|email|newsletter|loyalty|reward|rewards|affiliate|cross sell|upsell'],
    ];

    public static function detect(array $fields): ?array
    {
        // The vendor's product category wins; product title wins over incidental SEO/marketing copy.
        $candidates = [...($fields['_categories'] ?? []), $fields['name'] ?? '', parse_url($fields['_source_url'] ?? '', PHP_URL_PATH) ?: '', $fields['short_description'] ?? ''];
        foreach ($candidates as $text) {
            if (!is_string($text)) {
                continue;
            }
            $text = preg_replace('/[^\p{L}\p{N}]+/u', ' ', mb_strtolower($text));
            $best = null;
            $bestScore = 0;
            foreach (self::DEFINITIONS as [$slug, $name, $icon, $keywords]) {
                preg_match_all('/(?<!\p{L})(?:'.$keywords.')(?!\p{L})/u', $text, $matches);
                $score = array_sum(array_map(strlen(...), array_unique($matches[0])));
                if ($score > $bestScore) {
                    $best = ['slug' => $slug, 'name' => $name, 'icon' => $icon];
                    $bestScore = $score;
                }
            }
            if (null !== $best) {
                return $best;
            }
        }

        return null;
    }
}
