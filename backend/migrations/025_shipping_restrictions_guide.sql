-- Editorial guide reviewed 2026-11-27.
-- Source: content/blog/magento-2-shipping-restrictions-rules-and-checkout-testing.md
-- Preserve an existing article with the same slug.
INSERT INTO blog_posts (id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published)
SELECT id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published
FROM json_populate_record(NULL::blog_posts, $article$
{
  "id": "a38484fb-1fe8-5945-935b-7432f22d872f",
  "slug": "magento-2-shipping-restrictions-rules-and-checkout-testing",
  "title": "Magento 2 Shipping Restrictions: Rules and Checkout Testing",
  "excerpt": "Plan Magento 2 delivery restrictions by address, cart and customer group, then test mixed baskets, existing selections and unavailable delivery methods.",
  "cover": "/images/blog/pubsetup-magento-2-shipping-restrictions.webp",
  "category": "Implementation Guides",
  "tags": [
    "Magento 2",
    "Checkout",
    "Shipping restrictions"
  ],
  "author": "Pubsetup Team",
  "date": "2026-11-27",
  "read_minutes": 7,
  "toc": [
    {
      "id": "choose-between-native-settings-rates-and-restrictions",
      "label": "Choose between native settings, rates and restrictions"
    },
    {
      "id": "write-a-destination-rule-with-clear-boundaries",
      "label": "Write a destination rule with clear boundaries"
    },
    {
      "id": "decide-what-a-mixed-basket-should-do",
      "label": "Decide what a mixed basket should do"
    },
    {
      "id": "use-a-delivery-eligibility-worksheet",
      "label": "Use a delivery-eligibility worksheet"
    },
    {
      "id": "check-the-no-delivery-path-and-customer-message",
      "label": "Check the no-delivery path and customer message"
    },
    {
      "id": "investigate-conflicts-before-changing-carrier-configuration",
      "label": "Investigate conflicts before changing carrier configuration"
    },
    {
      "id": "release-a-reproducible-set-of-rules",
      "label": "Release a reproducible set of rules"
    },
    {
      "id": "sources-and-disclosure",
      "label": "Sources and disclosure"
    }
  ],
  "content": [
    {
      "type": "p",
      "text": "A delivery restriction should answer a precise question: when must a shipping method stop being available? Changing a delivery price, blocking a service for a destination and explaining that no service can fulfil a basket are different requirements. Separating them makes module selection and checkout testing easier."
    },
    {
      "type": "p",
      "text": "This guide proposes a planning worksheet and release checks. It is not a report of a tested deployment or a promise that any extension supports every scenario below. Vendor-specific examples refer to the linked documentation and should be checked against the installed package."
    },
    {
      "type": "h2",
      "text": "Choose between native settings, rates and restrictions"
    },
    {
      "type": "p",
      "text": "Begin with the shipping method already in use. Adobe's [flat-rate shipping guide](https://experienceleague.adobe.com/en/docs/commerce-admin/stores-sales/delivery/basic-methods/shipping-flat-rate) documents country selection and an option controlling display when the method is not applicable. A straightforward country restriction may already fit that method's settings."
    },
    {
      "type": "p",
      "text": "If the requirement changes the amount charged, evaluate rate configuration instead of treating a zero or unusually high price as a hidden method. If it makes a service ineligible for a particular basket or buyer, write that eligibility rule separately. Confirm the result you need before choosing which module should implement it."
    },
    {
      "type": "p",
      "text": "For example, “standard delivery costs more for this destination” and “express delivery cannot serve this destination” should produce different acceptance records. A rate test checks the amount. A restriction test checks whether the service is available and what the customer can do next."
    },
    {
      "type": "h2",
      "text": "Write a destination rule with clear boundaries"
    },
    {
      "type": "p",
      "text": "List the address fields that determine eligibility, the relevant service and the store views in scope. Prepare an address inside the intended area, one outside it and one near a boundary. Use fictional test addresses appropriate to the staging environment; record exactly which fields the condition should evaluate."
    },
    {
      "type": "p",
      "text": "The [Amasty Shipping Restrictions guide](https://amasty.com/user-guides/magento-2-shipping-restrictions/) describes restrictions for selected carriers and methods, customer-group and store scope, and reusable shipping areas that can include or exclude destinations. Those controls are examples from that module, not a standard configuration interface shared by every vendor."
    },
    {
      "type": "p",
      "text": "Investigate [Amasty Shipping Restrictions](/extension/shipping-restrictions-for-magento-2) or [MageDelight Shipping Restrictions](/extension/shipping-restrictions) against the written requirement. If the task is primarily pricing, also review [Amasty Shipping Rules](/extension/shipping-rules-extension-for-magento-2) and its current documentation before deciding which product belongs in the solution."
    },
    {
      "type": "h2",
      "text": "Decide what a mixed basket should do"
    },
    {
      "type": "p",
      "text": "A rule for one product is incomplete until the team decides what happens when that product shares a basket with unrestricted items. For a hypothetical fragile item, should express delivery be removed for the entire basket, or does the store have a supported process for fulfilling the items separately?"
    },
    {
      "type": "p",
      "text": "Write an expected outcome for an ordinary item alone, the restricted item alone and both together. Add the product types that matter to your catalog, such as configurable selections or a virtual item alongside a physical item. These are questions for the acceptance plan, not claims of automatic split-shipment support."
    },
    {
      "type": "p",
      "text": "Also decide what should happen when the buyer removes the last restricted item. A service that remains unavailable after its triggering condition disappears can be as confusing as one that remains selectable when it should be blocked."
    },
    {
      "type": "h2",
      "text": "Use a delivery-eligibility worksheet"
    },
    {
      "type": "p",
      "text": "Record the baseline delivery options before enabling the new rule. Use the same recognizable baskets throughout the test, and save the address, customer group, selected service and rule state with the result. That context lets another person reproduce an unexpected exclusion."
    },
    {
      "type": "table",
      "columns": [
        "Case",
        "Test change",
        "Evidence to collect"
      ],
      "rows": [
        [
          "Baseline",
          "Use an ordinary basket without the new restriction",
          "Existing eligible methods and their rates"
        ],
        [
          "Destination",
          "Move between included and excluded addresses",
          "Intended service disappears and returns"
        ],
        [
          "Boundary",
          "Try addresses adjacent to the defined area",
          "No unintended gap or overlap in the rule"
        ],
        [
          "Mixed basket",
          "Combine ordinary and restricted products",
          "Agreed whole-basket or supported fulfilment outcome"
        ],
        [
          "Item removal",
          "Remove the last item triggering the rule",
          "Availability is recalculated correctly"
        ],
        [
          "Customer group",
          "Repeat as guest and the intended account group",
          "Scope matches the approved requirement"
        ],
        [
          "Promotion",
          "Apply and remove a relevant shipping promotion",
          "Eligibility and price are independently correct"
        ],
        [
          "No eligible method",
          "Create a basket with no permitted delivery option",
          "Clear explanation and no invalid order placement"
        ],
        [
          "Existing selection",
          "Select a service before making it ineligible",
          "Stale selection is handled before order placement"
        ]
      ]
    },
    {
      "type": "p",
      "text": "Mark any unsupported scenario as an open requirement. Do not interpret the existence of an address condition as proof that all mixed-basket, promotional or checkout flows have been implemented."
    },
    {
      "type": "h2",
      "text": "Check the no-delivery path and customer message"
    },
    {
      "type": "p",
      "text": "For a rule intended to block every available service in a particular case, review the customer journey deliberately. The explanation should distinguish an unsupported destination from an address that is incomplete, and should give the buyer an action the store can actually support."
    },
    {
      "type": "p",
      "text": "Avoid a message that simply recommends another service if the test basket has none. Read it on a narrow screen and with the relevant storefront language. Include the point where a previously selected service becomes invalid, not only the initial empty list of methods."
    },
    {
      "type": "p",
      "text": "If support staff can offer a different fulfilment arrangement, define that process outside the checkout message as well. A friendly explanation should reflect an operating procedure, not invent one that the team cannot deliver."
    },
    {
      "type": "h2",
      "text": "Investigate conflicts before changing carrier configuration"
    },
    {
      "type": "p",
      "text": "Amasty's troubleshooting notes warn that active restriction rules can apply together. List the rules affecting a failed case, then reproduce it with controlled configurations on staging. Restore the intended combination before accepting the result; an isolated rule test cannot demonstrate that the full release works."
    },
    {
      "type": "p",
      "text": "Keep carrier availability and restriction eligibility in separate columns. If the baseline carrier service was never returned for the test address, disabling an extension rule does not prove that service should become available. Capture the original method list before attributing every missing option to the latest configuration change."
    },
    {
      "type": "p",
      "text": "Use the [Hyvä compatibility checklist](/blog/hyva-compatible-magento-2-extensions-what-to-check-before-you-buy) for the installed theme and checkout. If the store supports multiple shipping addresses or an alternate storefront, ask the vendor to demonstrate the required path rather than extending a single-address test result to it."
    },
    {
      "type": "h2",
      "text": "Release a reproducible set of rules"
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Approve the affected methods, destinations and customer scope.",
        "Record the intended mixed-basket and no-delivery outcomes.",
        "Complete the worksheet with the actual checkout and carrier configuration.",
        "Repeat the cases with all intended restrictions and promotions active.",
        "Save the tested rule set and assign an owner for future delivery changes."
      ]
    },
    {
      "type": "p",
      "text": "Keep payment checks separate when preparing the complete checkout release. The [payment-restriction guide](/blog/magento-2-payment-restrictions-customer-groups-and-cart-rules) covers method availability after customer and basket changes. Passing a delivery test does not establish that the remaining payment journey works."
    },
    {
      "type": "h2",
      "text": "Sources and disclosure"
    },
    {
      "type": "p",
      "text": "Reviewed November 27, 2026. Native flat-rate statements follow Adobe's linked guide. Amasty-specific capabilities and rule interaction follow its linked Shipping Restrictions guide. The worksheet and release process are Pubsetup editorial recommendations, not measured delivery or performance results."
    },
    {
      "type": "p",
      "text": "Disclosure: Pubsetup may earn a commission from partner purchases. Confirm current capabilities with the selected vendor, or [request extension installation](/services/install-magento-2-extension) using the agreed acceptance cases."
    }
  ],
  "published": true
}
$article$::json)
ON CONFLICT (slug) DO NOTHING;
