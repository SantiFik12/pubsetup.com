<?php
declare(strict_types=1);

namespace Pubsetup\Demo\Model;

/** Explicit read routes only. Never infer safety from an HTTP method or an action suffix. */
final class AdminPolicy
{
    public const USERNAME = 'demo_viewer';
    public const ROLE = 'Pubsetup Demo Viewer';

    public function isDemoIdentity(string $username, string $role): bool
    {
        return strtolower($username) === self::USERNAME || $role === self::ROLE;
    }

    public function isPublicViewer(string $username, string $role): bool
    {
        return strtolower($username) === self::USERNAME && $role === self::ROLE;
    }

    public function allows(string $action, string $method, mixed $namespace = null): bool
    {
        if ($action === 'mui_index_render') {
            return in_array($method, ['GET', 'POST'], true)
                && in_array($namespace, ['product_listing', 'sales_order_grid'], true);
        }
        if (!in_array($method, ['GET', 'HEAD'], true)) {
            return false;
        }
        return in_array($action, [
            'adminhtml_dashboard_index', 'adminhtml_dashboard_ajaxBlock',
            'adminhtml_index_index', 'adminhtml_index_denied',
            'adminhtml_auth_logout',
            'catalog_product_index', 'catalog_product_edit',
            'catalog_category_index', 'catalog_category_edit',
            'catalog_category_categoriesJson',
            'sales_order_index', 'sales_order_view',
        ], true);
    }
}
