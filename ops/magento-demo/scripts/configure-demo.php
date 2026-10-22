<?php
declare(strict_types=1);

/** Run only through the CLI service, after setup:upgrade. Never copy into pub/. */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require '/var/www/html/app/bootstrap.php';

use Magento\Authorization\Model\RoleFactory;
use Magento\Authorization\Model\RulesFactory;
use Magento\Framework\App\Bootstrap;
use Magento\Framework\App\State;
use Magento\Sales\Model\Order;
use Magento\Sales\Model\OrderFactory;
use Magento\Sales\Model\Order\AddressFactory;
use Magento\Sales\Model\Order\ItemFactory;
use Magento\Sales\Model\Order\PaymentFactory;
use Magento\Sales\Model\ResourceModel\Order\CollectionFactory;
use Magento\SalesSequence\Model\Manager;
use Magento\Store\Model\StoreManagerInterface;
use Magento\User\Model\UserFactory;
use Pubsetup\Demo\Model\AdminPolicy;

$password = getenv('DEMO_VIEWER_PASSWORD') ?: '';
if (strlen($password) < 12 || !preg_match('/[a-z]/', $password)
    || !preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
    throw new RuntimeException('Set DEMO_VIEWER_PASSWORD in .env: at least 12 characters with upper/lowercase and a number.');
}

$om = Bootstrap::create(BP, $_SERVER)->getObjectManager();
$om->get(State::class)->setAreaCode('adminhtml');
$user = $om->get(UserFactory::class)->create()->loadByUsername(AdminPolicy::USERNAME);
if ($user->getId() && $user->getRole()->getRoleName() !== AdminPolicy::ROLE) {
    throw new RuntimeException('An existing demo_viewer has a different role. Refusing to change that account.');
}

$role = $om->get(RoleFactory::class)->create();
$role->load(AdminPolicy::ROLE, 'role_name');
if (!$role->getId()) {
    $role->setRoleName(AdminPolicy::ROLE)->setRoleType('G')->setParentId(0)->setTreeLevel(1)->save();
}
// Optional Magento modules differ by installation. Grant only registered, explicit resources.
$registered = [];
$collectResources = function (array $nodes) use (&$collectResources, &$registered): void {
    foreach ($nodes as $node) {
        $registered[] = $node['id'];
        $collectResources($node['children'] ?? []);
    }
};
$collectResources($om->get(\Magento\Framework\Acl\AclResource\ProviderInterface::class)->getAclResources());
$resources = array_values(array_intersect(AdminPolicy::aclResources(), $registered));
$om->get(RulesFactory::class)->create()->setRoleId($role->getId())->setResources($resources)->saveRel();
$rules = $om->get(RulesFactory::class)->create()->getCollection()->addFieldToFilter('role_id', $role->getId());
$allowed = [];
foreach ($rules as $rule) {
    if ($rule->getPermission() === 'allow') {
        $allowed[] = $rule->getResourceId();
    }
}
$expected = [...$resources, 'Magento_Backend::admin'];
sort($allowed);
sort($expected);
if ($allowed !== $expected) {
    throw new RuntimeException('Demo role ACL verification failed. Keep the admin demo unpublished.');
}
$om->get(\Magento\User\Model\ResourceModel\User::class)->updateRoleUsersAcl($role);

// Set the password only on creation: rerunning deployment must not add duplicate password history.
if (!$user->getId()) {
    $user->setData([
        'username' => AdminPolicy::USERNAME, 'firstname' => 'Demo', 'lastname' => 'Viewer',
        'email' => 'demo-viewer@example.invalid', 'password' => $password,
        'is_active' => 1, 'interface_locale' => 'en_US', 'role_id' => $role->getId(),
    ])->save();
}
$verifiedUser = $om->get(UserFactory::class)->create()->load($user->getId());
if ($verifiedUser->getRole()->getRoleName() !== AdminPolicy::ROLE
    || !$om->get(\Magento\Framework\Encryption\EncryptorInterface::class)->validateHash($password, $verifiedUser->getPassword())) {
    throw new RuntimeException('Demo account role/password verification failed. Check DEMO_VIEWER_PASSWORD and the dedicated account.');
}

$store = $om->get(StoreManagerInterface::class)->getDefaultStoreView();
if (!$store) {
    throw new RuntimeException('A default store view is required.');
}
$orderResource = $om->get(\Magento\Sales\Model\ResourceModel\Order::class);
$fixtures = [
    ['demo-order-1@example.invalid', 'Alex', 'Demo', 'Sample yoga bag', 'DEMO-BAG', 34.00],
    ['demo-order-2@example.invalid', 'Sam', 'Sample', 'Sample training shirt', 'DEMO-SHIRT', 29.00],
    ['demo-order-3@example.invalid', 'Taylor', 'Example', 'Sample water bottle', 'DEMO-BOTTLE', 18.00],
];
foreach ($fixtures as [$email, $first, $last, $name, $sku, $amount]) {
    if ($om->get(CollectionFactory::class)->create()->addFieldToFilter('customer_email', $email)->getSize()) {
        continue;
    }
    // Synthetic records only: do not call place(), collect payments, reserve stock or send emails.
    $order = $om->get(OrderFactory::class)->create();
    $order->setData([
        'store_id' => $store->getId(), 'store_name' => $store->getName(),
        'increment_id' => $om->get(Manager::class)->getSequence('order', (int) $store->getId())->getNextValue(),
        'state' => Order::STATE_NEW, 'status' => 'pending',
        'customer_is_guest' => 1, 'customer_email' => $email,
        'customer_firstname' => $first, 'customer_lastname' => $last,
        'customer_group_id' => 0, 'is_virtual' => 1,
        'base_currency_code' => $store->getBaseCurrencyCode(), 'order_currency_code' => $store->getBaseCurrencyCode(),
        'store_currency_code' => $store->getBaseCurrencyCode(), 'global_currency_code' => $store->getBaseCurrencyCode(),
        'base_to_global_rate' => 1, 'base_to_order_rate' => 1, 'store_to_base_rate' => 1, 'store_to_order_rate' => 1,
        'subtotal' => $amount, 'base_subtotal' => $amount,
        'grand_total' => $amount, 'base_grand_total' => $amount,
        'total_due' => $amount, 'base_total_due' => $amount,
        'total_qty_ordered' => 1, 'total_item_count' => 1,
        'send_email' => 0, 'email_sent' => 0,
    ]);
    $address = $om->get(AddressFactory::class)->create()->setData([
        'address_type' => 'billing', 'firstname' => $first, 'lastname' => $last,
        'email' => $email, 'street' => '123 Demo Street', 'city' => 'Los Angeles',
        'postcode' => '90001', 'country_id' => 'US', 'region' => 'California',
        'region_id' => 12, 'telephone' => '0000000000',
    ]);
    $order->setBillingAddress($address);
    $order->setPayment($om->get(PaymentFactory::class)->create()->setMethod('checkmo'));
    $order->addItem($om->get(ItemFactory::class)->create()->setData([
        'store_id' => $store->getId(), 'sku' => $sku, 'name' => $name,
        'product_type' => 'virtual', 'is_virtual' => 1,
        'qty_ordered' => 1, 'price' => $amount, 'base_price' => $amount,
        'original_price' => $amount, 'base_original_price' => $amount,
        'row_total' => $amount, 'base_row_total' => $amount,
    ]));
    $order->addCommentToStatusHistory('Synthetic demo order. No payment, inventory reservation or delivery.');
    // Bypass the public OrderRepository creation guard only in this CLI fixture script.
    $orderResource->save($order);
}
// Force the sales grid to include fixtures even when asynchronous grid indexing is enabled.
$om->get(\Magento\Sales\Model\ResourceModel\Order\Grid::class)->refreshBySchedule();
echo "Demo Viewer configured; three synthetic order fixtures available. No emails sent.\n";
