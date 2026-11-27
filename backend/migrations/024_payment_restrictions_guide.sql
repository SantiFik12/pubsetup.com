-- Editorial guide reviewed 2026-11-27.
-- Source: content/blog/magento-2-payment-restrictions-customer-groups-and-cart-rules.md
-- Preserve an existing article with the same slug.
INSERT INTO blog_posts (id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published)
SELECT id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published
FROM json_populate_record(NULL::blog_posts, $article$
{
  "id": "49387e4b-de06-572f-a5b2-64a5f1680124",
  "slug": "magento-2-payment-restrictions-customer-groups-and-cart-rules",
  "title": "Magento 2 Payment Restrictions: Customer Groups and Cart Rules",
  "excerpt": "Decide when to hide a payment method in Magento 2, check native settings first, and test customer groups, cart thresholds and checkout changes.",
  "cover": "/images/blog/pubsetup-magento-2-payment-restrictions.webp",
  "category": "Implementation Guides",
  "tags": [
    "Magento 2",
    "Checkout",
    "Payment restrictions"
  ],
  "author": "Pubsetup Team",
  "date": "2026-11-27",
  "read_minutes": 7,
  "toc": [
    {
      "id": "check-the-payment-method-s-own-settings-first",
      "label": "Check the payment method's own settings first"
    },
    {
      "id": "turn-customer-group-requirements-into-explicit-rules",
      "label": "Turn customer-group requirements into explicit rules"
    },
    {
      "id": "define-the-amount-used-by-a-threshold",
      "label": "Define the amount used by a threshold"
    },
    {
      "id": "use-a-payment-availability-worksheet",
      "label": "Use a payment-availability worksheet"
    },
    {
      "id": "test-changes-inside-an-existing-checkout-session",
      "label": "Test changes inside an existing checkout session"
    },
    {
      "id": "diagnose-a-rule-that-hides-too-many-methods",
      "label": "Diagnose a rule that hides too many methods"
    },
    {
      "id": "release-with-a-decision-record",
      "label": "Release with a decision record"
    },
    {
      "id": "sources-and-disclosure",
      "label": "Sources and disclosure"
    }
  ],
  "content": [
    {
      "type": "p",
      "text": "A missing payment method can be intentional or a checkout defect. Before adding a restriction rule, write down which buyers should see the method, which basket qualifies and what should happen when either changes. That gives your team something more useful to verify than “the payment option disappeared.”"
    },
    {
      "type": "p",
      "text": "This guide focuses on method availability. It does not configure a payment gateway, promise authorization success or report a hands-on extension test. The decision examples and acceptance worksheet are proposed editorial checks; vendor-specific settings are attributed below."
    },
    {
      "type": "h2",
      "text": "Check the payment method's own settings first"
    },
    {
      "type": "p",
      "text": "An extension is not always necessary. Adobe's [cash-on-delivery configuration guide](https://experienceleague.adobe.com/en/docs/commerce-admin/stores-sales/payments/offline/cash-on-delivery) documents country selection and minimum and maximum order totals for the built-in COD method. Check whether those controls already express your requirement before adding another rule system."
    },
    {
      "type": "p",
      "text": "Record the relevant website and configuration scope, then verify the enabled method with a simple test basket. If it is already unavailable without a restriction module, investigate that baseline first. Adding a new rule to a method that never appeared makes the result difficult to interpret."
    },
    {
      "type": "p",
      "text": "Keep three outcomes separate in the test record: the method is offered, it can be selected, and the resulting order uses the intended method. A rule controlling visibility is only one part of that sequence. Use the provider's test environment for any transaction checks."
    },
    {
      "type": "h2",
      "text": "Turn customer-group requirements into explicit rules"
    },
    {
      "type": "p",
      "text": "Consider a hypothetical store that offers an offline payment option to approved wholesale buyers while keeping it unavailable to guests. Write the intended outcome for the guest, a retail account, an approved wholesale account and an account whose group has just changed. The example defines a requirement, not a ready-to-import configuration."
    },
    {
      "type": "p",
      "text": "For an implementation example, the [Amasty Payment Restrictions guide](https://amasty.com/user-guides/magento-2-payment-restrictions/) documents blocked-method selection, store and customer-group scope, and an option for applying rules to Admin orders. Its empty store and group selections mean all stores or groups, so an empty field should not be interpreted as “no customers.”"
    },
    {
      "type": "p",
      "text": "Compare [Amasty Payment Restrictions](/extension/payment-restrictions-for-magento-2) with [MageDelight Payment Restrictions](/extension/payment-restrictions) if both are on your shortlist. Verify each product against the requirement; the Amasty controls described here do not establish equivalent behaviour in another vendor's module."
    },
    {
      "type": "h2",
      "text": "Define the amount used by a threshold"
    },
    {
      "type": "p",
      "text": "“Hide this method above 100” is incomplete until the team agrees what 100 measures. Write down the currency and whether the intended comparison uses an amount before or after discounts and tax. Do not use the displayed grand total as an undocumented substitute for the rule's configured condition."
    },
    {
      "type": "p",
      "text": "Amasty's guide describes subtotal settings for tax inclusion and discount treatment. Check the installed configuration before entering a threshold. The same basket can become a different acceptance case when a coupon changes the amount used by the condition."
    },
    {
      "type": "p",
      "text": "For an illustrative threshold of 100.00, prepare values immediately below, exactly at and immediately above it: 99.99, 100.00 and 100.01. Write the expected result at equality before testing. These are invented test values, not recommended commercial limits."
    },
    {
      "type": "h2",
      "text": "Use a payment-availability worksheet"
    },
    {
      "type": "p",
      "text": "Start on staging with one named rule and a recorded baseline. For every row, retain the expected method list, the actual list and the steps used to reach it. Include an allowed case as well as a blocked case so the test can detect a rule that removes too much."
    },
    {
      "type": "table",
      "columns": [
        "Case",
        "Test change",
        "Expected result to define"
      ],
      "rows": [
        [
          "Guest",
          "Open checkout without signing in",
          "Available methods for an unregistered buyer"
        ],
        [
          "Approved account",
          "Sign in with the intended customer group",
          "Restricted and permitted methods for that group"
        ],
        [
          "Different group",
          "Repeat with a retail or unapproved account",
          "No accidental access through a broader scope"
        ],
        [
          "Threshold",
          "Try just below, at and above the boundary",
          "Agreed inclusive or exclusive comparison"
        ],
        [
          "Coupon",
          "Apply and remove a relevant discount",
          "Availability follows the intended amount basis"
        ],
        [
          "Address",
          "Change the address used by the condition",
          "Method list updates to match the new address"
        ],
        [
          "Basket contents",
          "Add and remove a qualifying item",
          "Rule stops applying when its condition no longer holds"
        ],
        [
          "Store view",
          "Repeat in an included and excluded storefront",
          "Only the intended scope is affected"
        ],
        [
          "Existing selection",
          "Select a method, then make it ineligible",
          "Checkout handles the stale selection before order placement"
        ]
      ]
    },
    {
      "type": "p",
      "text": "The worksheet proposes questions to test. It does not assert that every listed vendor supports every condition or workflow. If a requirement is absent from the documentation, request a demonstration before treating it as covered."
    },
    {
      "type": "h2",
      "text": "Test changes inside an existing checkout session"
    },
    {
      "type": "p",
      "text": "A fresh page load is not the only customer journey. Select an eligible payment method, change the basket or customer details so it should become ineligible, and then continue through the supported checkout flow. Record whether the selection and the available-method list agree."
    },
    {
      "type": "p",
      "text": "Repeat the relevant path after signing in, changing an address and removing a coupon. If the store has express payment buttons or another checkout entry point, add it to the acceptance scope rather than assuming a test of the main payment step covers it."
    },
    {
      "type": "p",
      "text": "Use the [Hyvä compatibility checklist](/blog/hyva-compatible-magento-2-extensions-what-to-check-before-you-buy) when preparing questions about a theme or checkout replacement. Record the actual version combination in your worksheet. A compatibility badge is a starting point for verification, not evidence that your customizations have been tested."
    },
    {
      "type": "h2",
      "text": "Diagnose a rule that hides too many methods"
    },
    {
      "type": "p",
      "text": "Amasty warns that restrictions from multiple active rules can apply together. When investigating on staging, list all relevant rules before changing the one most recently edited. A test that activates only one rule can miss a conflict present in the intended release configuration."
    },
    {
      "type": "p",
      "text": "Keep the method's native country and amount settings in the same investigation record. Record which condition should explain each exclusion, then repeat the smallest basket that reproduces it. This helps distinguish an intended restriction from a method unavailable for another reason."
    },
    {
      "type": "p",
      "text": "If a related [shipping restriction](/blog/magento-2-shipping-restrictions-rules-and-checkout-testing) prevents the customer reaching payment at all, resolve that journey first. Treat payment availability and delivery eligibility as separate checks, even when the same customer group appears in both."
    },
    {
      "type": "h2",
      "text": "Release with a decision record"
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Approve the customer groups, methods and scope the rule should affect.",
        "Record the threshold basis, boundary outcomes and native method settings.",
        "Complete the worksheet on the installed checkout and module versions.",
        "Repeat the cases with all intended restriction rules active together.",
        "Save the tested configuration and assign an owner for later changes."
      ]
    },
    {
      "type": "p",
      "text": "Revisit the affected cases after checkout, payment or rule changes. If a separate charge is part of the journey, use the [extra-fee tax and refund checklist](/blog/magento-2-extra-fees-tax-and-refund-checklist) to verify its amount independently of method availability."
    },
    {
      "type": "h2",
      "text": "Sources and disclosure"
    },
    {
      "type": "p",
      "text": "Reviewed November 27, 2026. Native COD statements follow Adobe's linked configuration guide. Amasty-specific behaviour follows its linked Payment Restrictions guide. The examples and acceptance plan are Pubsetup editorial material; they do not claim tested compatibility or conversion improvements."
    },
    {
      "type": "p",
      "text": "Disclosure: Pubsetup may earn a commission from partner purchases. Review the selected vendor's current documentation or [request extension installation](/services/install-magento-2-extension) with your completed requirements."
    }
  ],
  "published": true
}
$article$::json)
ON CONFLICT (slug) DO NOTHING;
