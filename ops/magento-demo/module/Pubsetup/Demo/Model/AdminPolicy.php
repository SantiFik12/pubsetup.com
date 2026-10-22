<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Model;

/** Explicit read routes only. Never infer safety from an HTTP method or an action suffix. */
final class AdminPolicy
{
    public const USERNAME = 'demo_viewer';
    public const ROLE = 'Pubsetup Demo Viewer';
    public const PUBLIC_PASSWORD_PATH = 'pubsetup_demo/access/public_password';
    private const GRID_NAMESPACES = [
        'product_listing', 'sales_order_grid',
        'customer_listing', 'customer_group_listing', 'customer_online_grid',
        'cms_page_listing', 'cms_block_listing', 'url_rewrite_listing',
        'search_synonyms_grid', 'design_theme_listing',
    ];
    private const CONFIG_SECTIONS = [
        'general', 'currency', 'catalog', 'cataloginventory', 'catalogsearch',
        'customer', 'sales', 'checkout', 'shipping', 'tax', 'newsletter', 'sitemap',
    ];
    private const LEGACY_GRID_ACTIONS = [
        'catalog_rule_promo_catalog_grid', 'sales_rule_promo_quote_grid',
        'newsletter_template_grid', 'newsletter_queue_grid', 'newsletter_subscriber_grid',
        'search_term_grid', 'adminhtml_sitemap_grid', 'review_product_grid', 'adminhtml_system_store_grid',
    ];

    /** Exact resources, never Magento_Backend::all. Unlisted child actions stay denied. */
    public static function aclResources(): array
    {
        return [
            'Magento_Backend::dashboard',
            'Magento_Catalog::catalog', 'Magento_Catalog::catalog_inventory',
            'Magento_Catalog::products', 'Magento_Catalog::categories',
            'Magento_Sales::sales', 'Magento_Sales::sales_operation',
            'Magento_Sales::sales_order', 'Magento_Sales::actions_view',
            'Magento_Customer::customer', 'Magento_Customer::manage',
            'Magento_Customer::online', 'Magento_Customer::group',
            'Magento_Backend::marketing', 'Magento_CatalogRule::promo',
            'Magento_CatalogRule::promo_catalog', 'Magento_SalesRule::quote',
            'Magento_Backend::marketing_communications', 'Magento_Newsletter::template',
            'Magento_Newsletter::queue', 'Magento_Newsletter::subscriber',
            'Magento_Backend::marketing_seo', 'Magento_Search::search', 'Magento_Search::synonyms',
            'Magento_UrlRewrite::urlrewrite', 'Magento_Sitemap::sitemap',
            'Magento_Backend::marketing_user_content', 'Magento_Review::pending', 'Magento_Review::reviews_all',
            'Magento_Backend::content', 'Magento_Backend::content_elements',
            'Magento_Cms::page', 'Magento_Cms::block',
            'Magento_Backend::design', 'Magento_Theme::theme',
            'Magento_Reports::report', 'Magento_Reports::report_marketing',
            'Magento_Reports::shopcart', 'Magento_Reports::product', 'Magento_Reports::abandoned',
            'Magento_Reports::report_search', 'Magento_Reports::salesroot',
            'Magento_Reports::salesroot_sales', 'Magento_Reports::tax', 'Magento_Reports::invoiced',
            'Magento_Reports::shipping', 'Magento_Reports::refunded', 'Magento_Reports::coupons',
            'Magento_Reports::customers', 'Magento_Reports::totals', 'Magento_Reports::customers_orders',
            'Magento_Reports::accounts', 'Magento_Reports::report_products',
            'Magento_Reports::viewed', 'Magento_Reports::bestsellers', 'Magento_Reports::lowstock', 'Magento_Reports::sold',
            'Magento_Backend::stores', 'Magento_Backend::stores_settings', 'Magento_Backend::store',
            'Magento_Config::config', 'Magento_Config::config_general', 'Magento_Config::currency',
            'Magento_Catalog::config_catalog', 'Magento_CatalogInventory::cataloginventory',
            'Magento_Customer::config_customer',
            'Magento_Sales::config_sales', 'Magento_Checkout::checkout',
            'Magento_Shipping::config_shipping', 'Magento_Tax::config_tax',
            'Magento_Newsletter::newsletter', 'Magento_Sitemap::config_sitemap',
            'Magento_Backend::system', 'Magento_Backend::tools', 'Magento_Backend::cache', 'Magento_Indexer::index',
        ];
    }

    public function isDemoIdentity(string $username, string $role): bool
    {
        return strtolower($username) === self::USERNAME || $role === self::ROLE;
    }

    public function isPublicViewer(string $username, string $role): bool
    {
        return strtolower($username) === self::USERNAME && $role === self::ROLE;
    }

    public function allows(string $action, string $method, mixed $namespace = null, mixed $section = null): bool
    {
        if ($action === 'mui_index_render') {
            return in_array($method, ['GET', 'POST'], true)
                && in_array($namespace, self::GRID_NAMESPACES, true);
        }
        if (in_array($action, self::LEGACY_GRID_ACTIONS, true)) {
            return in_array($method, ['GET', 'HEAD', 'POST'], true);
        }
        if (!in_array($method, ['GET', 'HEAD'], true)) {
            return false;
        }
        if ($action === 'adminhtml_system_config_edit') {
            return in_array($section, self::CONFIG_SECTIONS, true);
        }
        return in_array($action, [
            'adminhtml_dashboard_index', 'adminhtml_dashboard_ajaxBlock',
            'adminhtml_index_index', 'adminhtml_index_denied',
            'adminhtml_auth_logout',
            'catalog_product_index', 'catalog_product_edit',
            'catalog_category_index', 'catalog_category_edit',
            'catalog_category_categoriesJson',
            'sales_order_index', 'sales_order_view',
            'customer_index_index', 'customer_index_edit', 'customer_online_index',
            'customer_group_index', 'customer_group_edit',
            'cms_page_index', 'cms_page_edit', 'cms_block_index', 'cms_block_edit',
            'catalog_rule_promo_catalog_index', 'catalog_rule_promo_catalog_edit', 'catalog_rule_promo_catalog_grid',
            'sales_rule_promo_quote_index', 'sales_rule_promo_quote_edit', 'sales_rule_promo_quote_grid',
            'newsletter_template_index', 'newsletter_template_edit', 'newsletter_template_grid',
            'newsletter_queue_index', 'newsletter_queue_grid',
            'newsletter_subscriber_index', 'newsletter_subscriber_grid',
            'search_term_index', 'search_term_edit', 'search_term_grid', 'search_term_report',
            'search_synonyms_index', 'search_synonyms_edit',
            'adminhtml_url_rewrite_index', 'adminhtml_url_rewrite_edit',
            'adminhtml_sitemap_index', 'adminhtml_sitemap_edit', 'adminhtml_sitemap_grid',
            'review_product_index', 'review_product_pending', 'review_product_edit', 'review_product_grid',
            'reports_report_sales_sales', 'reports_report_sales_tax', 'reports_report_sales_invoiced',
            'reports_report_sales_shipping', 'reports_report_sales_refunded', 'reports_report_sales_coupons',
            'reports_report_sales_bestsellers',
            'reports_report_shopcart_product', 'reports_report_shopcart_abandoned',
            'reports_report_product_sold', 'reports_report_product_viewed', 'reports_report_product_lowstock',
            'reports_report_customer_accounts', 'reports_report_customer_totals', 'reports_report_customer_orders',
            'adminhtml_system_design_theme_index',
            'adminhtml_system_store_index', 'adminhtml_system_store_grid',
            'adminhtml_system_store_editStore', 'adminhtml_system_store_editGroup', 'adminhtml_system_store_editWebsite',
            'adminhtml_system_config_index', 'adminhtml_cache_index', 'indexer_indexer_list',
        ], true);
    }

    public function redactsConfigField(string $type, string $identifier): bool
    {
        return in_array(strtolower($type), ['password', 'obscure', 'hidden'], true)
            || (bool) preg_match('/password|passwd|secret|token|api.?key|private.?key|access.?key|client.?id|user.?name|account.?(?:id|number)|merchant.?id/i', $identifier);
    }

    public function ignoresBookmarkSave(string $action, string $method, mixed $namespace): bool
    {
        return $action === 'mui_bookmark_save' && $method === 'POST'
            && in_array($namespace, self::GRID_NAMESPACES, true);
    }
}
