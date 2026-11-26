# Magento 2 Extra Fees: Tax and Refund Checklist

Plan additional checkout charges in Magento 2 with a practical worksheet for fee rules, tax display, payment changes and partial refunds.

![Magento 2 Extra Fees: Tax and Refund Checklist](/images/blog/pubsetup-magento-2-extra-fees.webp)

An additional checkout charge changes more than the cart total. A team needs to explain when it applies, what a customer sees and what happens when an order is partly refunded. Agreeing those details before configuration makes it easier to choose a module and recognize a failed acceptance test.

This guide provides a proposed test plan, not results from a tested installation. Vendor examples are identified below; a setting documented for one extension should not be assumed to exist in another.

## Define the charge before choosing an extension

Write a short requirement for each charge: its purpose, who can encounter it, whether it is optional, how its value is calculated and when it should disappear. For example, optional gift wrapping and a mandatory handling charge require different acceptance cases even when both appear as an extra line at checkout.

Keep the customer-facing label separate from the internal rule name. A shopper should be able to understand the service being purchased, while an administrator needs enough detail to identify the responsible configuration later. Record the intended behaviour for each store view instead of assuming one label and rule fit every storefront.

Before buying, compare the requirement with the module's current documentation. You can start with [MageDelight Extra Fee](/extension/extra-fee) and [Amasty Extra Fee](/extension/extra-fee-for-magento-2). These links identify products to investigate, not a claim that their calculation and refund workflows are interchangeable.

## Separate calculation from display

For a percentage fee, specify the intended calculation base. Ask what happens when products are discounted, a coupon is removed or shipping changes. Record expected amounts for a small, recognizable basket before opening the extension configuration.

Amasty's [tax configuration article](https://support.amasty.com/portal/en/kb/articles/a-guide-on-handling-taxes-for-extra-fees-19-2-2021) describes fee tax-class controls and separate display settings for the cart and order documents. Treat calculation and presentation as separate checks. A clear-looking tax breakdown does not establish that the configured calculation matches your business requirement.

Have the person responsible for the store's tax setup approve the intended treatment. The worksheet below verifies agreed behaviour; it does not choose a tax rate or establish which charges a business may impose.

## Build a small acceptance worksheet

Use a staging store and record the installed Magento, checkout and extension versions. For each row, retain the expected result, actual result and evidence. Include both an eligible basket and a similar basket that should not receive the charge.

| Scenario | Change to make | Evidence to retain |
| --- | --- | --- |
| Eligibility | Move between an included and excluded basket | Fee appears and disappears according to the written rule |
| Quantity | Increase and decrease a qualifying item | Amount follows the agreed calculation base |
| Discount | Apply and remove a relevant coupon | Expected fee and total after each change |
| Checkout | Change the selected delivery or payment method | No stale or duplicated charge remains |
| Store view | Repeat with the relevant language and currency | Appropriate label, currency and rounding |
| Documents | Place and invoice a test order | Fee and tax presentation can be reconciled across records |
| Partial refund | Refund part of a qualifying order | Expected fee treatment and remaining refundable balance |
| Repeat refund | Prepare another credit memo where supported | No fee amount is refunded twice |

These rows are editorial test suggestions, not a list of features every extra-fee extension supports. If a required scenario is unsupported, resolve that gap before release rather than silently removing the test.

## Verify the checkout your customers actually use

Test the selected storefront and checkout implementation. A product listing mentioning Magento compatibility does not, by itself, verify your installed checkout customizations. If your store uses Hyvä or a replacement checkout, use the [compatibility checklist](/blog/hyva-compatible-magento-2-extensions-what-to-check-before-you-buy) to prepare questions for the vendor.

Check both the first calculation and subsequent changes. A charge that appears correctly once can still leave a confusing total after a buyer switches methods or edits the basket. Record the sequence that reproduces a discrepancy; a screenshot of the final total alone may hide the trigger.

## Agree on refund behaviour before release

Amasty's [refund documentation](https://support.amasty.com/portal/en/kb/articles/how-to-handle-refundable-and-non-refundable-fees) describes a per-fee refund eligibility setting. It also explains that an eligible fee can be adjusted when creating a credit memo. Verify the corresponding workflow in the product you actually select; do not copy that setting name into another vendor's installation instructions.

Write an expected outcome for a full refund, a partial refund and a second partial refund. Include the fee's tax component in the reconciliation and explain any retained amount to the team handling customer requests. A mismatch between the written policy and the interface is a release issue even if the order can technically be refunded.

Adobe's [credit memo guide](https://experienceleague.adobe.com/en/docs/commerce-admin/stores-sales/order-management/credit-memos/credit-memo-create) distinguishes online and offline refund workflows and describes general refund adjustments. Confirm the payment outcome separately from the document: an updated credit memo is not sufficient evidence for every payment integration.

## Keep a repeatable release checklist

1. Record the approved eligibility, calculation, display and refund requirements.
2. Confirm the exact module version and checkout combination with the vendor.
3. Configure one representative charge in staging and complete the worksheet.
4. Resolve discrepancies using reproducible steps and expected amounts.
5. Save the approved configuration and repeat the relevant cases after updates.

Assign an owner for future changes to fee rules. When a promotion, checkout or payment module changes, repeat the cases it can affect instead of relying on a screenshot from the original release.

## Sources and disclosure

Reviewed November 26, 2026. Vendor-specific statements follow the linked Amasty documentation; general credit memo information follows Adobe's guide. The worksheet and release recommendations are Pubsetup editorial material. No hands-on testing or financial outcome is claimed.

Disclosure: Pubsetup may earn a commission from partner purchases. Review each product's current documentation before purchasing, or [request extension installation](/services/install-magento-2-extension) with your acceptance worksheet.
