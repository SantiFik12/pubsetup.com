<?php
declare(strict_types=1);

// Standalone behavioral tests with small Magento doubles. Live integration checks are in README.md.
namespace Magento\Framework\App {
    interface ActionInterface { public function execute(); }
}
namespace Magento\Framework\App\Action {
    interface HttpGetActionInterface extends \Magento\Framework\App\ActionInterface {}
}
namespace Magento\Backend\Block {
    class Template {
        public function __construct($context, array $data = []) {}
        protected function _toHtml() {}
    }
}
namespace Magento\Backend\Block\Template { class Context {} }
namespace Magento\Framework\App\Config {
    interface ScopeConfigInterface { public function getValue($path); }
}
namespace Magento\Framework\App\Request {
    class Http {
        public function __construct(public string $action = '', public string $method = 'GET', public mixed $namespace = null, public mixed $section = null) {}
        public function getFullActionName(): string { return $this->action; }
        public function getMethod(): string { return $this->method; }
        public function getParam(string $name): mixed { return $name === 'section' ? $this->section : $this->namespace; }
    }
}
namespace Magento\Framework\Controller\Result {
    class RawFactory { public function create(): Raw { return new Raw(); } }
    class Raw {
        public int $code = 200;
        public string $contents = '';
        public function setHttpResponseCode(int $code): self { $this->code = $code; return $this; }
        public function setHeader(...$args): self { return $this; }
        public function setContents(string $contents): self { $this->contents = $contents; return $this; }
    }
}
namespace Magento\Backend\Model\Auth {
    class Session {
        public function __construct(public mixed $user = null) {}
        public function getUser(): mixed { return $this->user; }
    }
}
namespace Magento\Framework\Exception {
    class LocalizedException extends \Exception {}
    class AuthenticationException extends LocalizedException {}
}
namespace Magento\Framework\Mail { interface TransportInterface {} }
namespace Magento\Framework\Data\Form\Element {
    class AbstractElement {
        public bool $disabled = false;
        public bool $readonly = false;
        public bool $disableInheritance = false;
        public string $comment = '';
        public function __construct(public string $type, public string $identifier, public string $value) {}
        public function getType(): string { return $this->type; }
        public function getHtmlId(): string { return $this->identifier; }
        public function getName(): string { return $this->identifier; }
        public function setDisabled(bool $v): self { $this->disabled = $v; return $this; }
        public function setReadonly(bool $v): self { $this->readonly = $v; return $this; }
        public function setIsDisableInheritance(bool $v): self { $this->disableInheritance = $v; return $this; }
        public function setValue(string $v): self { $this->value = $v; return $this; }
        public function setComment(string $v): self { $this->comment = $v; return $this; }
    }
}
namespace Magento\Sales\Api\Data { interface OrderInterface { public function getEntityId(); } }
namespace Magento\Framework\Event { class Observer {} }
namespace Magento\TwoFactorAuth\Observer { class ControllerActionPredispatch {} }
namespace Magento\Authorization\Model {
    interface UserContextInterface {
        public const USER_TYPE_ADMIN = 2;
        public function getUserId();
        public function getUserType();
    }
}
namespace Magento\User\Model {
    class UserFactory {
        public string $username = 'demo_viewer';
        public string $role = 'Pubsetup Demo Viewer';
        public int $id = 1;
        public function create(): \TestUser { return new \TestUser($this->username, $this->role, $this->id); }
    }
}
namespace {
    function __(string $message): string { return $message; }
    final class TestUser {
        public function __construct(public string $username, public string $role, public int $id = 1) {}
        public function getId(): int { return $this->id; }
        public function getUserName(): string { return $this->username; }
        public function getRole(): object { return new class($this->role) {
            public function __construct(private string $role) {}
            public function getRoleName(): string { return $this->role; }
        }; }
        public function loadByUsername($username): self { return $this; }
        public function load($id): self { return $this; }
    }
    spl_autoload_register(function (string $class): void {
        $prefix = 'Pubsetup\\Demo\\';
        if (str_starts_with($class, $prefix)) {
            require dirname(__DIR__).'/module/Pubsetup/Demo/'.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
        }
    });
    $checks = 0;
    function check(bool $condition, string $label): void {
        global $checks;
        ++$checks;
        if (!$condition) throw new \RuntimeException($label);
    }
    function rejects(callable $operation, string $label): void {
        try { $operation(); } catch (\Magento\Framework\Exception\LocalizedException $e) {
            check(true, $label); return;
        }
        check(false, $label);
    }

    // Magento generates subclasses for intercepted controllers and blocks.
    class TestAdminInterceptor extends \Pubsetup\Demo\Controller\Admin\Index {}
    class TestNoticeInterceptor extends \Pubsetup\Demo\Block\AdminNotice {}
    class TestLoginCredentialsInterceptor extends \Pubsetup\Demo\Block\LoginCredentials {}
    check(is_subclass_of(TestAdminInterceptor::class, \Pubsetup\Demo\Controller\Admin\Index::class), 'Controller supports generated interception');
    check(is_subclass_of(TestNoticeInterceptor::class, \Pubsetup\Demo\Block\AdminNotice::class), 'Block supports generated interception');
    check(is_subclass_of(TestLoginCredentialsInterceptor::class, \Pubsetup\Demo\Block\LoginCredentials::class), 'Login block supports generated interception');

    $policy = new \Pubsetup\Demo\Model\AdminPolicy();
    $loginUsers = new \Magento\User\Model\UserFactory();
    $loginConfig = new class implements \Magento\Framework\App\Config\ScopeConfigInterface {
        public function getValue($path) { return $path === \Pubsetup\Demo\Model\AdminPolicy::PUBLIC_PASSWORD_PATH ? 'public-demo-password' : null; }
    };
    $login = new \Pubsetup\Demo\Block\LoginCredentials(new \Magento\Backend\Block\Template\Context(), $loginConfig, $loginUsers, $policy);
    check($login->getDemoUsername() === 'demo_viewer' && $login->getDemoPassword() === 'public-demo-password', 'Login page can show the dedicated public viewer credential');
    $loginUsers->role = 'Administrators';
    check($login->getDemoPassword() === '', 'A privileged role never receives a published credential');
    $loginUsers->role = $policy::ROLE; $loginUsers->username = 'owner';
    check($login->getDemoPassword() === '', 'Another username never receives a published credential');
    $loginUsers->username = $policy::USERNAME; $loginUsers->id = 0;
    check($login->getDemoPassword() === '', 'Missing viewer account does not show a credential');
    $session = new \Magento\Backend\Model\Auth\Session(new TestUser($policy::USERNAME, $policy::ROLE));
    $viewer = new \Pubsetup\Demo\Model\ViewerSession($session, $policy);
    $request = new \Magento\Framework\App\Request\Http();
    $guard = new \Pubsetup\Demo\Plugin\AdminReadOnly($viewer, $policy, $request, new \Magento\Framework\Controller\Result\RawFactory());
    $action = new class implements \Magento\Framework\App\ActionInterface { public function execute() {} };
    $called = false;
    $proceed = function () use (&$called) { $called = true; return 'executed'; };
    foreach ([
        'catalog_product_save', 'catalog_product_delete', 'catalog_product_massDelete',
        'catalog_category_save', 'catalog_category_move', 'catalog_category_delete',
        'sales_order_cancel', 'sales_order_hold', 'sales_order_addComment',
        'sales_order_create_save', 'adminhtml_system_config_save', 'adminhtml_system_account_save',
        'adminhtml_user_save', 'adminhtml_user_role_save', 'adminhtml_cache_flushAll',
        'cms_page_save', 'cms_block_save', 'cms_page_delete', 'customer_index_save', 'customer_index_resetPassword',
        'catalog_rule_promo_catalog_save', 'catalog_rule_promo_catalog_applyRules',
        'sales_rule_promo_quote_save', 'sales_rule_promo_quote_generate',
        'newsletter_queue_save', 'newsletter_subscriber_massDelete',
        'adminhtml_system_store_save', 'adminhtml_system_store_deleteStore',
        'reports_report_statistics_refresh', 'indexer_indexer_massChangeMode', 'adminhtml_sitemap_generate',
        'mui_bookmark_save', 'mui_export_gridToCsv', 'thirdparty_module_index',
    ] as $route) {
        foreach (['GET', 'POST', 'DELETE'] as $method) {
            $called = false;
            $request->action = $route;
            $request->method = $method;
            $result = $guard->aroundExecute($action, $proceed);
            check(!$called && $result->code === 403, "$route $method must never execute");
        }
    }
    foreach (['adminhtml_dashboard_index', 'catalog_product_index', 'catalog_product_edit', 'catalog_category_edit', 'sales_order_index', 'sales_order_view', 'adminhtml_auth_logout'] as $route) {
        $request->action = $route; $request->method = 'GET';
        check($guard->aroundExecute($action, $proceed) === 'executed', "$route remains browsable");
        $request->method = 'POST';
        check($guard->aroundExecute($action, $proceed)->code === 403, "$route POST rejected");
    }
    $request->action = 'mui_index_render'; $request->method = 'POST';
    foreach (['product_listing', 'sales_order_grid', 'cms_page_listing', 'cms_block_listing', 'customer_listing', 'url_rewrite_listing'] as $namespace) {
        $request->namespace = $namespace;
        check($guard->aroundExecute($action, $proceed) === 'executed', 'Read-only grid POST works');
    }
    foreach (['integrations_listing', 'permissions_users', [], null] as $namespace) {
        $request->namespace = $namespace;
        check($guard->aroundExecute($action, $proceed)->code === 403, 'Unapproved grid cannot be rendered');
    }

    $request->action = 'mui_bookmark_save';
    foreach (['product_listing', 'sales_order_grid', 'cms_page_listing', 'cms_block_listing', 'customer_listing', 'url_rewrite_listing'] as $namespace) {
        $request->namespace = $namespace;
        $request->method = 'POST';
        $called = false;
        $result = $guard->aroundExecute($action, $proceed);
        check($result->code === 200 && json_decode($result->contents) instanceof \stdClass,
            'Automatic grid bookmark receives a valid JSON success response');
        check(!$called, 'Bookmark save controller never runs: no shared settings are persisted');
        foreach (['GET', 'PUT', 'DELETE'] as $method) {
            $request->method = $method;
            check($guard->aroundExecute($action, $proceed)->code === 403, 'Only POST bookmark acknowledgements are supported');
        }
    }
    $request->method = 'POST';
    foreach (['integrations_listing', 'permissions_users', [], null] as $namespace) {
        $request->namespace = $namespace;
        $called = false;
        check($guard->aroundExecute($action, $proceed)->code === 403 && !$called,
            'Unapproved bookmark namespace stays forbidden');
    }

    foreach ([
        'cms_page_index', 'cms_page_edit', 'cms_block_edit', 'customer_index_index', 'customer_index_edit',
        'catalog_rule_promo_catalog_index', 'catalog_rule_promo_catalog_edit', 'sales_rule_promo_quote_edit',
        'newsletter_template_index', 'search_term_index', 'adminhtml_url_rewrite_index',
        'reports_report_sales_sales', 'reports_report_product_viewed', 'reports_report_customer_orders',
        'adminhtml_system_store_index', 'adminhtml_system_store_editStore', 'adminhtml_cache_index', 'indexer_indexer_list',
    ] as $route) {
        $request->action = $route; $request->method = 'GET';
        check($guard->aroundExecute($action, $proceed) === 'executed', "$route is browsable");
        $request->method = 'POST'; $called = false;
        check($guard->aroundExecute($action, $proceed)->code === 403 && !$called, "$route cannot receive edits via POST");
    }
    $request->action = 'catalog_rule_promo_catalog_grid'; $request->method = 'POST';
    check($guard->aroundExecute($action, $proceed) === 'executed', 'Legacy rule grid filtering can render via POST');
    $request->action = 'adminhtml_system_config_edit'; $request->method = 'GET';
    foreach (['general', 'catalog', 'sales', 'checkout', 'tax'] as $section) {
        $request->section = $section;
        check($guard->aroundExecute($action, $proceed) === 'executed', 'Approved settings section is browsable');
    }
    foreach (['admin', 'system', 'payment', 'carriers', 'web', 'dev', 'oauth', 'thirdparty', [], null] as $section) {
        $request->section = $section; $called = false;
        check($guard->aroundExecute($action, $proceed)->code === 403 && !$called, 'Unapproved configuration cannot be read');
    }
    $request->section = 'general'; $request->method = 'POST';
    check($guard->aroundExecute($action, $proceed)->code === 403, 'Settings cannot be changed through edit POST');
    $fields = new \Pubsetup\Demo\Plugin\ConfigReadOnly($viewer, $policy);
    foreach ([['obscure', 'extension_connection'], ['password', 'connection'], ['text', 'service_api_key'], ['text', 'service_client_secret']] as [$type, $identifier]) {
        $field = new \Magento\Framework\Data\Form\Element\AbstractElement($type, $identifier, 'never-expose-this');
        $fields->beforeRender(new \stdClass(), $field);
        check($field->value === '' && $field->disabled && $field->readonly && $field->disableInheritance,
            'Secrets are removed before HTML rendering and fields are disabled');
    }
    $field = new \Magento\Framework\Data\Form\Element\AbstractElement('text', 'general_store_information_name', 'Demo Store');
    $fields->beforeRender(new \stdClass(), $field);
    check($field->value === 'Demo Store' && $field->disabled, 'Ordinary settings remain visible, but disabled');
    foreach (['Magento_Backend::all', 'Magento_User::acl_users', 'Magento_User::acl_roles', 'Magento_Integration::integrations', 'Magento_Config::config_admin', 'Magento_Config::config_system', 'Magento_Backend::flush_cache_storage'] as $resource) {
        check(!in_array($resource, $policy::aclResources(), true), 'Sensitive ACL resources are never granted');
    }

    $tfa = new \Pubsetup\Demo\Plugin\DemoTwoFactor($viewer);
    $tfaObserver = new \Magento\TwoFactorAuth\Observer\ControllerActionPredispatch();
    $event = new \Magento\Framework\Event\Observer();
    $tfaCalled = false;
    $verifyTfa = function ($observer) use (&$tfaCalled) { $tfaCalled = true; };
    $tfa->aroundExecute($tfaObserver, $verifyTfa, $event);
    check(!$tfaCalled, 'Only the exact public viewer skips 2FA');
    $session->user->role = 'Administrators';
    $request->action = 'mui_bookmark_save'; $request->method = 'POST'; $request->namespace = 'product_listing';
    check($guard->aroundExecute($action, $proceed)->code === 403, 'Wrong public role cannot acknowledge bookmarks');
    $request->action = 'catalog_product_index'; $request->method = 'GET';
    check($guard->aroundExecute($action, $proceed)->code === 403, 'Public username with privileged role fails closed');
    $tfa->aroundExecute($tfaObserver, $verifyTfa, $event);
    check($tfaCalled, 'Wrong role does not skip 2FA');
    $session->user = new TestUser('owner', 'Administrators');
    $field = new \Magento\Framework\Data\Form\Element\AbstractElement('obscure', 'service_api_key', 'owner-secret');
    $fields->beforeRender(new \stdClass(), $field);
    check($field->value === 'owner-secret' && !$field->disabled, 'Owner settings are not altered');
    $request->action = 'mui_bookmark_save'; $request->method = 'POST';
    check($guard->aroundExecute($action, $proceed) === 'executed', 'Owner bookmark saving remains available');
    $request->action = 'catalog_product_save'; $request->method = 'POST';
    check($guard->aroundExecute($action, $proceed) === 'executed', 'Owner administration remains available');
    $tfaCalled = false;
    $tfa->aroundExecute($tfaObserver, $verifyTfa, $event);
    check($tfaCalled, 'Owner 2FA remains active');
    $session->user = new TestUser('second_demo', $policy::ROLE);
    check($guard->aroundExecute($action, $proceed)->code === 403, 'Another user of the demo role cannot mutate');

    $orders = new \Pubsetup\Demo\Plugin\BlockOrders();
    foreach (['beforePlaceOrder', 'beforeSubmit', 'beforePlace'] as $method) {
        rejects(fn () => $orders->$method(new \stdClass()), 'All order placement paths reject');
    }
    $newOrder = new class implements \Magento\Sales\Api\Data\OrderInterface { public function getEntityId() { return null; } };
    rejects(fn () => $orders->beforeSave(new \stdClass(), $newOrder), 'Direct repository creation rejects');
    $mailSent = false;
    (new \Pubsetup\Demo\Plugin\BlockMail())->aroundSendMessage(
        new class implements \Magento\Framework\Mail\TransportInterface {},
        function () use (&$mailSent) { $mailSent = true; }
    );
    check(!$mailSent, 'Mail transport is never invoked');

    $tokens = new \Pubsetup\Demo\Plugin\BlockAdminToken(new \Magento\User\Model\UserFactory(), $policy);
    rejects(fn () => $tokens->beforeCreateAdminAccessToken(new \stdClass(), 'demo_viewer', 'any'), 'Credential API token rejected');
    rejects(fn () => $tokens->beforeCreateAdminToken(new \stdClass(), 1), 'Legacy OAuth token rejected');
    $context = new class implements \Magento\Authorization\Model\UserContextInterface {
        public function getUserId() { return 1; }
        public function getUserType() { return self::USER_TYPE_ADMIN; }
    };
    rejects(fn () => $tokens->beforeCreate(new \stdClass(), $context, null), 'User token issuer rejects demo');
    echo "$checks security checks passed (standalone doubles; Magento integration still required).\n";
}
