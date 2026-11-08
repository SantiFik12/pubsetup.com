-- Promotions purchasing guide. Sources reviewed 2026-11-08; see content/blog/magento-2-promotions-choosing-extensions-for-discounts-free-gifts-and-loyalty-programs.md.
-- Preserve an existing article with this slug.
INSERT INTO blog_posts (id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published)
SELECT id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published
FROM json_populate_record(NULL::blog_posts, $article$
{
  "id": "4bb8935f-b791-5273-9de7-3779e0da33eb",
  "slug": "magento-2-promotions-choosing-extensions-for-discounts-free-gifts-and-loyalty-programs",
  "title": "Magento 2 Promotions: Choosing Extensions for Discounts, Free Gifts, and Loyalty Programs",
  "excerpt": "Choose Magento 2 promotion tools for discounts, free gifts, reward points, and loyalty benefits, with four catalog examples and a practical testing checklist.",
  "cover": "/images/blog/pubsetup-magento-2-promotions-discounts-free-gifts-loyalty.webp",
  "category": "Extension Guides",
  "tags": [
    "Magento 2",
    "Promotions",
    "Loyalty Programs",
    "Magento Extensions"
  ],
  "author": "Pubsetup Team",
  "date": "2026-11-08",
  "read_minutes": 9,
  "toc": [
    {
      "id": "check-what-your-magento-promotion-rules-already-cover",
      "label": "Check what your Magento promotion rules already cover"
    },
    {
      "id": "choose-the-promotion-mechanism-before-the-module",
      "label": "Choose the promotion mechanism before the module"
    },
    {
      "id": "advanced-discounts-amasty-special-promotions-pro",
      "label": "Advanced discounts: Amasty Special Promotions Pro"
    },
    {
      "id": "free-gifts-mageplaza-free-gift",
      "label": "Free gifts: Mageplaza Free Gift"
    },
    {
      "id": "reward-points-mageworx-reward-points",
      "label": "Reward points: Mageworx Reward Points"
    },
    {
      "id": "loyalty-benefits-amasty-loyalty-program",
      "label": "Loyalty benefits: Amasty Loyalty Program"
    },
    {
      "id": "make-the-offer-precise-before-configuring-it",
      "label": "Make the offer precise before configuring it"
    },
    {
      "id": "control-stacking-and-the-total-cost-of-the-offer",
      "label": "Control stacking and the total cost of the offer"
    },
    {
      "id": "check-theme-checkout-and-operational-integrations",
      "label": "Check theme, checkout, and operational integrations"
    },
    {
      "id": "a-staging-checklist-for-your-first-campaign",
      "label": "A staging checklist for your first campaign"
    },
    {
      "id": "which-extension-should-you-choose-first",
      "label": "Which extension should you choose first?"
    }
  ],
  "content": [
    {
      "type": "p",
      "text": "A promotion should give customers a clear reason to act: save on a purchase, qualify for a useful gift, or earn a benefit for returning. The extension you choose should match that promise and apply it consistently across the cart, checkout, and order records."
    },
    {
      "type": "p",
      "text": "Magento 2 already includes promotion tools, so start with the campaign rather than a list of modules. This guide explains when native rules may be enough and when to evaluate extensions for advanced discounts, free gifts, reward points, or customer loyalty benefits. Four examples come from the Pubsetup catalog; the suggested use cases are editorial guidance, not a ranking based on conversion tests."
    },
    {
      "type": "p",
      "text": "Disclosure: Pubsetup may earn a commission when you purchase through partner links. Installation is available as a separate service. Capabilities below are based on vendor documentation reviewed on November 8, 2026. Confirm the current package, integrations, and licensing before buying."
    },
    {
      "type": "h2",
      "text": "Check what your Magento promotion rules already cover"
    },
    {
      "type": "p",
      "text": "Catalog price rules apply promotional prices to products based on conditions, before the products enter the cart. They do not use coupon codes. Cart price rules apply discounts when cart conditions are met and can run automatically or through a valid coupon code."
    },
    {
      "type": "p",
      "text": "That distinction is a useful first filter. A straightforward product sale or a qualifying-cart discount may be possible with your existing configuration. Before buying a module, write a sample order and check whether the native rule options can produce the intended result."
    },
    {
      "type": "list",
      "items": [
        "Define the audience, eligible products, and dates.",
        "Specify whether customers need a coupon or qualify automatically.",
        "Decide how the offer interacts with other active rules.",
        "Check the displayed prices and totals using representative customer and cart scenarios."
      ]
    },
    {
      "type": "p",
      "text": "An extension becomes worth evaluating when you can name the missing behavior: a particular discount condition, a gift-selection journey, a points balance, or purchase-history benefits that your current setup cannot deliver conveniently."
    },
    {
      "type": "h2",
      "text": "Choose the promotion mechanism before the module"
    },
    {
      "type": "table",
      "caption": "Match the campaign to the type of tool you need",
      "columns": [
        "Campaign goal",
        "Approach to evaluate",
        "Example from the catalog",
        "Important decision"
      ],
      "rows": [
        [
          "Run a straightforward sale or coupon",
          "Existing catalog or cart price rules",
          "Check Magento configuration first",
          "Can native conditions express the offer?"
        ],
        [
          "Apply more detailed discount conditions",
          "Advanced promotion rules",
          "Amasty Special Promotions Pro",
          "Which rules and exclusions are required?"
        ],
        [
          "Offer a product when a cart qualifies",
          "Gift rules and selection interface",
          "Mageplaza Free Gift",
          "How are gift stock and eligibility changes handled?"
        ],
        [
          "Give customers value to redeem later",
          "Points earning and spending rules",
          "Mageworx Reward Points",
          "What do points mean and when can customers use them?"
        ],
        [
          "Give regular customers ongoing privileges",
          "Purchase-history or customer-based discounts",
          "Amasty Loyalty Program",
          "How do customers qualify and understand their benefits?"
        ]
      ]
    },
    {
      "type": "p",
      "text": "These approaches can coexist, but combining them adds decisions. Establish which benefits can stack and which tool owns each calculation before configuring several modules. More incentives are not automatically a better customer experience."
    },
    {
      "type": "h2",
      "text": "Advanced discounts: Amasty Special Promotions Pro"
    },
    {
      "type": "p",
      "text": "Amasty Special Promotions Pro extends promotion rules with conditions based on customer attributes and order history. The vendor also documents controls for choosing the base price used in discount calculations and restricting promotions on products that already have special prices."
    },
    {
      "type": "p",
      "text": "We would evaluate it when campaign eligibility is more detailed than a basic discount. For example, a store may want an offer for a defined group of returning customers while excluding selected sale items. Confirm the exact conditions and package required for that scenario."
    },
    {
      "type": "list",
      "items": [
        "Ask the vendor to demonstrate one realistic campaign from qualification to final totals.",
        "Test rule priority and interaction with your existing coupons.",
        "Check how discounted products are treated before applying the campaign catalog-wide."
      ]
    },
    {
      "type": "extension-card",
      "extensionSlug": "special-promotions-pro-for-magento-2"
    },
    {
      "type": "h2",
      "text": "Free gifts: Mageplaza Free Gift"
    },
    {
      "type": "p",
      "text": "Mageplaza Free Gift supports rule-based gift campaigns, gift-selection popups, notifications, and campaign timing and priority. It is worth evaluating when the offer includes a tangible product and customers need a clear way to see or select their gift."
    },
    {
      "type": "p",
      "text": "A possible campaign is a choice of samples once a basket qualifies. The selection interface is only part of the decision: the gift is also inventory that your team must pick and ship. Define what should happen when a customer changes the cart after selecting it."
    },
    {
      "type": "list",
      "items": [
        "Confirm supported gift product types and selection behavior.",
        "Test unavailable stock and carts that stop qualifying after an edit.",
        "Check how gifts appear in order records and the fulfillment workflow."
      ]
    },
    {
      "type": "extension-card",
      "extensionSlug": "magento-2-free-gift-extension-add-free-items-to-cart"
    },
    {
      "type": "h2",
      "text": "Reward points: Mageworx Reward Points"
    },
    {
      "type": "p",
      "text": "Mageworx Reward Points provides earning conditions, fixed or percentage calculations, conversion rates, expiration settings, and customer notifications. It is an option to evaluate when the program needs a balance customers can earn and redeem rather than just a lower price on the current order."
    },
    {
      "type": "p",
      "text": "For a replenishment store, a possible approach is earning points on purchases and using them toward a later order. Explain the monetary value and spending conditions in plain language. A balance is not helpful if customers cannot understand what it buys."
    },
    {
      "type": "list",
      "items": [
        "Define which purchases earn points and when those points become available.",
        "Confirm the redemption interface and integration requirements for your exact checkout.",
        "Test cancellation, full refunds, and partial refunds against the policy you intend to publish."
      ]
    },
    {
      "type": "extension-card",
      "extensionSlug": "reward-points-extension-for-magento-2"
    },
    {
      "type": "h2",
      "text": "Loyalty benefits: Amasty Loyalty Program"
    },
    {
      "type": "p",
      "text": "Amasty Loyalty Program focuses on targeted discounts using cart and customer attributes and purchase history. The vendor documents program information and purchase statistics in customer accounts, with conditions that can support different loyalty levels."
    },
    {
      "type": "p",
      "text": "We would consider this approach when regular customers should qualify for ongoing offers. It differs from requiring a redeemable points currency: the main requirement may be to recognize a qualifying customer and apply a relevant discount. Decide how customers enter, retain, or lose eligibility."
    },
    {
      "type": "list",
      "items": [
        "Write the qualification rules and explain the benefit in a short customer-facing description.",
        "Check which order statuses and history conditions your chosen configuration uses.",
        "Test customers just below and just above the qualifying threshold."
      ]
    },
    {
      "type": "extension-card",
      "extensionSlug": "loyalty-program-for-magento-2"
    },
    {
      "type": "h2",
      "text": "Make the offer precise before configuring it"
    },
    {
      "type": "p",
      "text": "Write a short campaign specification that marketing, development, and customer support can all follow. Avoid phrases such as “spend enough to get a gift” without defining the amount used to determine eligibility."
    },
    {
      "type": "list",
      "items": [
        "Threshold: does eligibility use merchandise value before or after discounts, and does it include tax or shipping?",
        "Audience: which customer groups, websites, and store views are eligible?",
        "Products: are sale items, gift cards, bundles, or selected categories excluded?",
        "Timing: when does the campaign start and end, and which configured time zone applies?",
        "Limits: is the benefit restricted per order, customer, or qualifying quantity?",
        "Changes: what happens when the cart is edited or an order is canceled or refunded?"
      ]
    },
    {
      "type": "p",
      "text": "Use examples with expected results. For a gift threshold of $100, test baskets at $99.99, $100, and $100.01, then repeat after applying a coupon. These are acceptance scenarios, not assumptions that every extension uses the same threshold calculation."
    },
    {
      "type": "h2",
      "text": "Control stacking and the total cost of the offer"
    },
    {
      "type": "p",
      "text": "A campaign can become more generous than intended when a catalog sale, coupon, gift, and reward redemption all apply to the same order. Decide which combinations should be allowed and test the resulting calculation rather than relying on the advertised discount alone."
    },
    {
      "type": "p",
      "text": "For example, consider a $100 basket with a 10% coupon, a gift, and points redemption. The coupon reduces the merchandise amount to $90 before other adjustments; the gift still has a cost to your business. Whether the basket qualifies for the gift depends on the threshold policy and the module configuration. Document the expected outcome before launch."
    },
    {
      "type": "list",
      "items": [
        "Review contribution after discounts, gift cost, shipping support, and relevant fulfillment costs.",
        "Set exclusions or limits where the campaign would be unsuitable.",
        "Compare average order value alongside margin and refunds.",
        "Avoid attributing all sales during a campaign to the offer; account for other marketing activity and seasonal demand."
      ]
    },
    {
      "type": "h2",
      "text": "Check theme, checkout, and operational integrations"
    },
    {
      "type": "p",
      "text": "Promotion calculations and their storefront interfaces need separate attention. A discount may calculate correctly while a gift selector, balance display, or notification fails to appear where customers expect it."
    },
    {
      "type": "p",
      "text": "For Hyvä stores, ask about Hyvä Theme, Hyvä Checkout, and CSP requirements individually. For any storefront, verify the packages and release versions needed by the components you will use. A general compatibility label does not replace testing your cart, checkout, and order flow."
    },
    {
      "type": "list",
      "items": [
        "Cart and mini-cart: customers can understand qualification and see the correct benefits.",
        "Checkout: discounts, gift selection, and points stay consistent as shipping, address, or payment choices change.",
        "Order management: quantities, adjustments, and custom data reach the admin and connected systems.",
        "Returns: refunds and points adjustments match the intended policy.",
        "Customer support: the team can explain the offer and investigate a disputed result."
      ]
    },
    {
      "type": "h2",
      "text": "A staging checklist for your first campaign"
    },
    {
      "type": "p",
      "text": "Start with one campaign and a limited scope. Save the configuration and expected totals so the team can recognize an error and disable the offer quickly if needed."
    },
    {
      "type": "list",
      "items": [
        "Test eligible and ineligible customers, including guests and signed-in shoppers.",
        "Test the threshold boundary and any quantity limits.",
        "Add and remove qualifying products, then apply and remove coupons.",
        "Check your main product types, currencies, store views, and active checkout paths.",
        "Verify gift stock handling and changes to shipping charges where relevant.",
        "Test earning and spending points separately and together if the program allows it.",
        "Follow a successful order, cancellation, and partial refund through connected systems.",
        "Review mobile interactions, keyboard access, messages, and browser errors.",
        "Confirm the campaign stops applying when disabled or outside its configured dates."
      ]
    },
    {
      "type": "p",
      "text": "After launch, monitor the behavior the campaign was intended to change. For a gift offer, review qualification and gift selection. For points, review earning, redemption, and returning customers. For targeted discounts, review eligible-customer uptake. Pair those observations with the actual cost of the benefits."
    },
    {
      "type": "h2",
      "text": "Which extension should you choose first?"
    },
    {
      "type": "p",
      "text": "Use native rules when they cover the campaign clearly. Evaluate advanced promotion rules for more detailed discount logic, a free-gift extension for product rewards, a points module for a redeemable balance, and loyalty rules for ongoing customer privileges."
    },
    {
      "type": "p",
      "text": "You do not need all four approaches at once. Choose one customer promise, verify its economics and edge cases, and use a staging trial to check the implementation. The best extension is the one that makes that promise clear to customers and reliable for the team running the store."
    }
  ],
  "published": true
}
$article$::json)
ON CONFLICT (slug) DO NOTHING;
