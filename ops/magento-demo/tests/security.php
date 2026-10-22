<?php
declare(strict_types=1);

// Standalone behavioral tests with small Magento doubles. Live integration checks are in README.md.
namespace Magento\Framework\App {
    interface ActionInterface { public function execute(); }
}
namespace Magento\Framework\App\Request {
    class Http {
        public function __construct(public string $action = '', public string $method = 'GET', public mixed $namespace = null) {}
        public function getFullActionName(): string { return $this->action; }
        public function getMethod(): string { return $this->method; }
        public function getParam(string $name): mixed { return $this->namespace; }
    }
}
namespace Magento\Framework\Controller\Result {
    class RawFactory { public function create(): Raw { return new Raw(); } }
    class Raw {
        public int $code = 200;
        public function setHttpResponseCode(int $code): self { $this->code = $code; return $this; }
        public function setHeader(...$args): self { return $this; }
        public function setContents(string $contents): self { return $this; }
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
        public function create(): \TestUser { return new \TestUser('demo_viewer', 'Pubsetup Demo Viewer'); }
    }
}
namespace {
    function __(string $message): string { return $message; }
    final class TestUser {
        public function __construct(public string $username, public string $role) {}
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

    $policy = new \Pubsetup\Demo\Model\AdminPolicy();
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
    foreach (['product_listing', 'sales_order_grid'] as $namespace) {
        $request->namespace = $namespace;
        check($guard->aroundExecute($action, $proceed) === 'executed', 'Read-only grid POST works');
    }
    foreach (['customer_listing', 'permissions_users', [], null] as $namespace) {
        $request->namespace = $namespace;
        check($guard->aroundExecute($action, $proceed)->code === 403, 'Unapproved grid cannot be rendered');
    }

    $tfa = new \Pubsetup\Demo\Plugin\DemoTwoFactor($viewer);
    $tfaObserver = new \Magento\TwoFactorAuth\Observer\ControllerActionPredispatch();
    $event = new \Magento\Framework\Event\Observer();
    $tfaCalled = false;
    $verifyTfa = function ($observer) use (&$tfaCalled) { $tfaCalled = true; };
    $tfa->aroundExecute($tfaObserver, $verifyTfa, $event);
    check(!$tfaCalled, 'Only the exact public viewer skips 2FA');
    $session->user->role = 'Administrators';
    $request->action = 'catalog_product_index'; $request->method = 'GET';
    check($guard->aroundExecute($action, $proceed)->code === 403, 'Public username with privileged role fails closed');
    $tfa->aroundExecute($tfaObserver, $verifyTfa, $event);
    check($tfaCalled, 'Wrong role does not skip 2FA');
    $session->user = new TestUser('owner', 'Administrators');
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
