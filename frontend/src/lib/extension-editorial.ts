import type { Extension } from "../data/types";

type BuyingNote = {
  vendorHosts: string[];
  reviewedAt: string;
  title: string;
  description: string;
  summary: string;
  sections: { heading: string; text?: string; items?: string[] }[];
  sources: { title: string; url: string }[];
  relatedGuides?: string[];
};

// Original buying guidance stays separate from vendor imports. Capability claims
// are supported by the linked sources; evaluation checklists are our advice.
const notes: Record<string, BuyingNote> = {
  "magento-2-zoho-inventory-integration": {
    vendorHosts: ["meetanshi.com"],
    reviewedAt: "2026-11-25",
    title: "Magento 2 Zoho Inventory Integration by Meetanshi",
    description: "Connect Magento 2 to Zoho Inventory with Meetanshi. Review sync direction, API setup, order status rules and a staging checklist before installation.",
    summary: "Connect Magento 2 with Zoho Inventory using Meetanshi's integration. Configure the connection and choose how accounts, products, orders and invoices are synchronized.",
    sections: [
      { heading: "What the connector synchronizes", text: "Meetanshi documents immediate and scheduled synchronization from Magento 2 to Zoho Inventory, with controls for the website and order statuses included. It also provides a queue, history logs and tax mapping. If you need changes made in Zoho to update Magento stock, ask the vendor to demonstrate that exact direction before purchase." },
      { heading: "Prepare the connection", items: [
        "The setup guide requires a Zoho client ID, client secret and organization ID. Match the account region and redirect URL to the installation you are configuring.",
        "Check the order-number preference described in the guide before importing existing orders. Agree which system owns each identifier and how existing records will be matched.",
        "For scheduled synchronization, include Magento cron and failed-queue monitoring in the maintenance plan.",
      ] },
      { heading: "A staging test before going live", items: [
        "Start with a small set of identifiable records. Compare product identifiers, customer details, tax and order totals in both systems.",
        "Change an order status and repeat the sync. Check whether the expected record is updated without an unwanted duplicate.",
        "Test an interrupted connection and recovery. Decide who will review failed records and when a manual retry is appropriate.",
      ] },
    ],
    sources: [
      { title: "Meetanshi product capabilities", url: "https://meetanshi.com/magento-2-zoho-inventory-integration.html" },
      { title: "Meetanshi connection and synchronization guide", url: "https://meetanshi.com/docs/magento-2/zoho-inventory-integration/" },
    ],
  },
  "data-feed-manager": {
    relatedGuides: ["magento-2-product-feeds-mapping-variants-and-validation"],
    vendorHosts: ["wyomind.com", "syde.shop"],
    reviewedAt: "2026-11-25",
    title: "Wyomind Data Feed Manager for Magento 2",
    description: "Evaluate Wyomind Data Feed Manager for Magento 2: product feed formats, store views, category mapping and checks before sending a feed to a sales channel.",
    summary: "Build Magento 2 product feeds with Wyomind Data Feed Manager. Review export formats, store-view settings and the mapping work required by your target sales channel.",
    sections: [
      { heading: "When a configurable product feed is useful", text: "The vendor documents XML, CSV, TXT and TSV output, configurable product patterns, store-view selection and category mapping. This is worth evaluating when you need control over the destination's field structure. Start with that destination's specification and map the required fields to actual Magento attributes." },
      { heading: "A feed file is one part of the integration", text: "Define whether the project needs a generated file, a delivery schedule or an interactive marketplace connection. A correct export does not by itself establish how orders, refunds or inventory changes will travel back to the store. Ask for a demonstration of any workflow beyond feed generation." },
      { heading: "Validate a small export first", items: [
        "Use representative products, including a configurable product and its variants. Agree which records the destination expects and check that identifiers remain stable.",
        "Compare exported prices, currency, tax treatment, availability, product URLs and images with the selected storefront.",
        "Check the file's delimiter, escaping and required fields against the receiving system. Review its actual import errors before increasing the export scope.",
        "Schedule generation only after a successful sample. The vendor's guide requires a working server cron; decide who monitors stale or failed exports.",
      ] },
    ],
    sources: [
      { title: "Data Feed Manager product and configuration documentation", url: "https://www.syde.shop/collections/magento-2-extensions/products/data-feed-manager" },
    ],
  },
  "extra-fee": {
    vendorHosts: ["magedelight.com"],
    reviewedAt: "2026-11-25",
    title: "Magento 2 Extra Fee Extension by MageDelight",
    description: "Evaluate MageDelight Extra Fee for Magento 2: service charges, checkout conditions and the tax, payment and refund checks to complete before launch.",
    summary: "Add charges for additional services with MageDelight Extra Fee for Magento 2. Evaluate fee conditions alongside your checkout, tax and refund workflows.",
    sections: [
      { heading: "Match the fee to a customer decision", text: "MageDelight describes custom charges for services such as gift wrapping and express delivery, with rules based on cart totals, product attributes or customer groups. Write down which service a fee pays for, when it applies and what the customer should see before payment." },
      { heading: "Questions to settle before choosing the module", items: [
        "Is the service optional, required for a particular order or already covered by another charge? Check that the proposed rule does not duplicate shipping or an existing checkout module.",
        "Ask the vendor to demonstrate the calculation you need, including any percentage, minimum, maximum or currency requirements. Do not infer these controls from the extension name.",
        "Confirm compatibility with your exact checkout implementation and payment methods. Include a change of shipping method and a failed payment in the demonstration.",
      ] },
      { heading: "Trace the charge through a complete order", items: [
        "On staging, test carts on both sides of each condition and confirm that the displayed total changes as intended.",
        "Follow the charge into the placed order, payment capture, invoice and exported order data. Agree the expected tax treatment with the person responsible for your store's taxes.",
        "Check full and partial refunds against your service policy. Record the expected treatment before release so support staff can explain it consistently.",
      ] },
    ],
    sources: [
      { title: "MageDelight Extra Fee product capabilities", url: "https://www.magedelight.com/extra-fee-magento-2.html" },
    ],
  },
};

export function extensionBuyingNote(item: Extension): BuyingNote | undefined {
  const note = notes[item.slug];
  if (!note) return undefined;
  try {
    const host = new URL(item.originalUrl || item.affiliateUrl).hostname.replace(/^www\./, "");
    return note.vendorHosts.includes(host) ? note : undefined;
  } catch { return undefined; }
}

export function withExtensionEditorial(item: Extension): Extension {
  const note = extensionBuyingNote(item);
  if (!note) return item;
  const reviewed = `${note.reviewedAt}T00:00:00Z`;
  const updatedAt = item.updatedAt && Date.parse(item.updatedAt) > Date.parse(reviewed) ? item.updatedAt : reviewed;
  return { ...item, shortDescription: note.summary, seoTitle: note.title, seoDescription: note.description, updatedAt };
}
