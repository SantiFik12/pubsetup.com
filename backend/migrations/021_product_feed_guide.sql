-- Product feed guide. Sources and editorial review: 2026-11-26.
-- Source: content/blog/magento-2-product-feeds-mapping-variants-and-validation.md.
-- Preserve any existing article with the same slug.
INSERT INTO blog_posts (id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published)
SELECT id, slug, title, excerpt, cover, category, tags, author, date, read_minutes, toc, content, published
FROM json_populate_record(NULL::blog_posts, $article$
{
  "id": "532fa61d-6599-5070-9106-68e74d03dbf1",
  "slug": "magento-2-product-feeds-mapping-variants-and-validation",
  "title": "Magento 2 Product Feeds: Mapping, Variants and Validation",
  "excerpt": "Plan a Magento 2 product feed with an attribute map, a worked variant example and a validation checklist before connecting a sales channel.",
  "cover": "/images/blog/pubsetup-magento-2-product-feeds.webp",
  "category": "Implementation Guides",
  "tags": [
    "Magento 2",
    "Product Feeds",
    "Magento Extensions"
  ],
  "author": "Pubsetup Team",
  "date": "2026-11-26",
  "read_minutes": 8,
  "toc": [
    {
      "id": "define-the-destination-before-choosing-an-extension",
      "label": "Define the destination before choosing an extension"
    },
    {
      "id": "create-an-attribute-map-you-can-review",
      "label": "Create an attribute map you can review"
    },
    {
      "id": "decide-what-a-row-means-for-configurable-products",
      "label": "Decide what a row means for configurable products"
    },
    {
      "id": "work-through-a-small-csv-example",
      "label": "Work through a small CSV example"
    },
    {
      "id": "check-prices-availability-and-images-against-the-storefront",
      "label": "Check prices, availability and images against the storefront"
    },
    {
      "id": "validate-the-file-and-the-receiving-system-separately",
      "label": "Validate the file and the receiving system separately"
    },
    {
      "id": "choose-a-tool-after-the-mapping-is-clear",
      "label": "Choose a tool after the mapping is clear"
    },
    {
      "id": "make-the-update-schedule-observable",
      "label": "Make the update schedule observable"
    },
    {
      "id": "editorial-sources-and-review",
      "label": "Editorial sources and review"
    }
  ],
  "content": [
    {
      "type": "p",
      "text": "A Magento 2 product feed connects two different descriptions of a catalog: the data your store maintains and the fields a sales channel expects. Exporting a file is the middle of that process. First decide what each row represents; afterwards check what the receiving system actually accepted."
    },
    {
      "type": "p",
      "text": "This guide uses Google Merchant Center as a concrete example, with a small fictional clothing catalog. The mapping worksheet and test plan are editorial examples, not results from a live store or a benchmark of a particular extension. Other destinations need their own field mappings and validation rules."
    },
    {
      "type": "h2",
      "text": "Define the destination before choosing an extension"
    },
    {
      "type": "p",
      "text": "Write a short feed brief: destination, Magento website and store view, language, currency, product scope, delivery method and person responsible for failures. If the destination needs a daily export, say when the data must be available rather than simply requesting a daily cron job."
    },
    {
      "type": "p",
      "text": "Separate three jobs in the brief: selecting products, transforming their data and delivering the output. A feed generator may cover all three for your use case, or your project may need another component. Exporting products does not establish how marketplace orders, refunds or stock changes will return to Magento."
    },
    {
      "type": "p",
      "text": "For Google, start with its [product data specification](https://support.google.com/merchants/answer/7052112?hl=en). Required information depends on the product and destination settings. Treat a vendor's sample template as a starting point, then review it against your own catalog."
    },
    {
      "type": "h2",
      "text": "Create an attribute map you can review"
    },
    {
      "type": "p",
      "text": "A Magento product export and a channel feed are different data contracts. Adobe's [product export reference](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/data-transfer/data-attributes-product) describes catalog attributes and CSV columns; the receiving channel defines its own field names and accepted values."
    },
    {
      "type": "p",
      "text": "Use a worksheet like this before building a template. These are mapping decisions to verify, not universal Magento attribute formulas."
    },
    {
      "type": "table",
      "caption": "Product feed mapping worksheet",
      "columns": [
        "Destination field",
        "Candidate source",
        "Decision to verify"
      ],
      "rows": [
        [
          "id",
          "SKU or another stable offer key",
          "Does each exported offer keep the same unique identifier between runs?"
        ],
        [
          "item_group_id",
          "Configurable parent relationship",
          "Do related variants share a group without sharing their individual IDs?"
        ],
        [
          "title",
          "Store-view product name and variant labels",
          "Can a shopper distinguish the exact offer?"
        ],
        [
          "link",
          "Storefront URL for the exported offer",
          "Does it open the intended product and variant?"
        ],
        [
          "image_link",
          "Public product image URL",
          "Does the image show the exported item?"
        ],
        [
          "price",
          "Customer-visible price and currency for the selected storefront",
          "Does it match the offer after the link opens?"
        ],
        [
          "availability",
          "Customer-facing purchase availability",
          "Can a customer actually buy the exported offer?"
        ]
      ]
    },
    {
      "type": "p",
      "text": "Record who owns each decision. For example, a developer can implement a price rule, but someone responsible for catalog operations should approve which store view and customer experience it represents."
    },
    {
      "type": "h2",
      "text": "Decide what a row means for configurable products"
    },
    {
      "type": "p",
      "text": "In Magento, a configurable product presents variations whose underlying simple products have their own SKUs. Adobe explains this relationship in its [configurable product documentation](https://experienceleague.adobe.com/en/docs/commerce-admin/catalog/products/types/product-create-configurable)."
    },
    {
      "type": "p",
      "text": "For Google's variant model, submit individual variants with distinct IDs and use a shared item_group_id for the family. Do not reuse the parent identifier as every variant's individual ID. Follow the applicable variant attributes for your product type; a group identifier alone does not describe a variation. See Google's [variant grouping requirements](https://support.google.com/merchants/answer/6324507?hl=en)."
    },
    {
      "type": "p",
      "text": "Choose two similar variants for the first test. Give one a different price or availability so that an accidental copy of the parent values is easier to spot. Check the generated rows against the exact offers a shopper sees."
    },
    {
      "type": "h2",
      "text": "Work through a small CSV example"
    },
    {
      "type": "p",
      "text": "The following is a **mapping exercise**, not a complete Merchant Center upload. It deliberately omits other potentially required attributes and uses fictional products, prices and reserved example URLs."
    },
    {
      "type": "code",
      "language": "csv",
      "caption": "CSV mapping exercise — fictional data, not a complete upload",
      "text": "id,item_group_id,title,color,size,price,availability,link,image_link\nTEE-BLUE-M,TEE,\"Cotton shirt - Blue - M\",Blue,M,29.90 EUR,in_stock,https://shop.example/shirt?color=blue&size=m,https://shop.example/media/shirt-blue.jpg\nTEE-BLUE-L,TEE,\"Cotton shirt - Blue - L\",Blue,L,31.90 EUR,out_of_stock,https://shop.example/shirt?color=blue&size=l,https://shop.example/media/shirt-blue.jpg"
    },
    {
      "type": "p",
      "text": "Both rows belong to the TEE family, but each has its own offer ID. The larger size has a different illustrative price and availability. A useful first review asks whether those differences survive the mapping rather than only checking that the file has two rows."
    },
    {
      "type": "p",
      "text": "The query parameters illustrate the desired outcome, not a built-in Magento URL convention. Your storefront must actually support the link and preselect the correct variant. Google's [link guidance](https://support.google.com/merchants/answer/6324416?hl=en) explains that the landing page should open with the advertised variant selected."
    },
    {
      "type": "p",
      "text": "For Merchant Center file delivery, Google's [file creation guide](https://support.google.com/merchants/answer/12631822?hl=en) specifies tab-delimited text or XML. Transform the exercise into the destination's supported format, complete the remaining attributes and validate it there. Renaming a comma-separated file does not change its delimiter."
    },
    {
      "type": "h2",
      "text": "Check prices, availability and images against the storefront"
    },
    {
      "type": "p",
      "text": "Open each sample link in a fresh browser session with the intended storefront settings. Compare the offer, currency and displayed price. Google's [price requirements](https://support.google.com/merchants/answer/6324371?hl=en) require consistency between the submitted data and the buying experience; avoid assuming that one raw Magento price column captures every store's requirements."
    },
    {
      "type": "p",
      "text": "Next, check the customer's ability to order. Google defines accepted availability values and requires them to agree with the website. Use its [availability reference](https://support.google.com/merchants/answer/6324448?hl=en) when designing the transformation. Do not decide availability from a warehouse number without checking what the storefront actually permits."
    },
    {
      "type": "p",
      "text": "Finally, open the image URL without an admin login. Check that it represents the correct item and remains accessible to the destination. Google maintains separate [image requirements](https://support.google.com/merchants/answer/6324350?hl=en); review the current specification instead of treating any non-empty URL as a passing check."
    },
    {
      "type": "h2",
      "text": "Validate the file and the receiving system separately"
    },
    {
      "type": "p",
      "text": "Use this sequence for the first limited export:"
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Count the expected offers before export and explain every excluded item.",
        "Check that individual IDs are non-empty and unique. Compare a second run to catch unexpected identifier changes.",
        "Inspect quoting, delimiters and encoding. A spreadsheet opening the file successfully does not prove that another parser reads it the same way.",
        "Review representative rows against the storefront: a simple product, related variants, an unavailable offer and any store-specific edge case.",
        "Submit the limited scope through the destination's intended workflow and read its processing results. Record rejected records and reasons separately from records your exporter excluded.",
        "Fix one class of problem, regenerate and compare the outcome before expanding the scope."
      ]
    },
    {
      "type": "p",
      "text": "Keep a small change log containing the template revision, generation time, selected storefront, expected count, exported count and destination results. If a later run breaks, these details are more useful than a note that the feed previously worked."
    },
    {
      "type": "h2",
      "text": "Choose a tool after the mapping is clear"
    },
    {
      "type": "p",
      "text": "[Wyomind Data Feed Manager](https://pubsetup.com/extension/data-feed-manager) is one option when you need configurable product-feed output. The [vendor documentation](https://www.syde.shop/collections/magento-2-extensions/products/data-feed-manager) describes XML, CSV, TXT and TSV generation, product patterns, store-view selection, filters, category mapping and scheduled generation."
    },
    {
      "type": "p",
      "text": "Evaluate it using your worksheet and the same sample offers. Ask for a demonstration of the particular variant, URL or pricing transformation that is difficult in your store. A long feature list does not establish whether that specific mapping will work."
    },
    {
      "type": "p",
      "text": "If your requirement also includes order import, stock updates from an external system or another interactive workflow, list those requirements separately. Compare a feed generator with a connector against the jobs it must perform, rather than expecting them to be interchangeable."
    },
    {
      "type": "p",
      "text": "Disclosure: Pubsetup may earn a commission from partner purchases. Product capabilities above follow vendor documentation, not hands-on testing. [Review the module and partner offer](https://pubsetup.com/extension/data-feed-manager) or [request extension installation](https://pubsetup.com/services/install-magento-2-extension)."
    },
    {
      "type": "extension-card",
      "extensionSlug": "data-feed-manager"
    },
    {
      "type": "h2",
      "text": "Make the update schedule observable"
    },
    {
      "type": "p",
      "text": "Run a manual sample successfully before enabling a schedule. Define how fresh the destination data needs to be and work backwards through export time, file delivery and destination processing. A generated timestamp and a successful destination update answer different questions."
    },
    {
      "type": "p",
      "text": "Assign an owner for failed or unusually small exports. Decide whether to retain the previous file, stop delivery or alert someone when generation fails; verify that your chosen tool can implement that policy. Keep credentials out of a publicly accessible feed and restrict the export to fields the destination needs."
    },
    {
      "type": "p",
      "text": "After launch, repeat a small set of storefront checks following changes to catalog attributes, currencies, product URLs or feed templates. The objective is a reliable description of the offers customers can buy, with enough evidence to explain what happened when a row is rejected."
    },
    {
      "type": "h2",
      "text": "Editorial sources and review"
    },
    {
      "type": "p",
      "text": "Reviewed November 26, 2026. The links above support platform behaviour, Google requirements and documented vendor capabilities. The worksheet, CSV example and operating checklist are Pubsetup editorial material. No improvement in traffic, sales or acceptance rate is claimed."
    }
  ],
  "published": true
}
$article$::json)
ON CONFLICT (slug) DO NOTHING;
