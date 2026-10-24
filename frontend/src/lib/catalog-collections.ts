import type { Catalog } from "@/data/mappers";
import type { Category, Extension } from "@/data/types";

export const curatedCategories: Category[] = [
  { id: "collection:seo", slug: "seo", name: "SEO", icon: "Search", description: "Explore Magento 2 extensions for search engine optimization, metadata, sitemaps, structured data and redirects." },
  { id: "collection:checkout", slug: "checkout", name: "Checkout", icon: "ShoppingCart", description: "Explore Magento 2 checkout, shopping cart and checkout payment extensions." },
  { id: "collection:performance", slug: "performance", name: "Performance", icon: "Gauge", description: "Explore Magento 2 extensions for caching, page speed, image optimization and storefront performance." },
  { id: "collection:hyva-compatible", slug: "hyva-compatible", name: "Hyvä compatible", icon: "Check", description: "Browse extensions marked as Hyvä compatible in our catalog. Check each extension for supported versions and installation requirements." },
];

const categoryAliases: Record<string, string[]> = {
  seo: ["seo", "search-engine-optimization"],
  checkout: ["checkout", "checkout-cart", "cart-checkout"],
  performance: ["performance", "speed-optimization", "performance-optimization", "caching"],
};
const topics: Record<string, RegExp> = {
  seo: /\b(?:seo|search engine optimi[sz]ation|sitemaps?|rich snippets?|structured data|schema markup|canonical urls?|hreflang|meta tags?|meta titles?|meta descriptions?|robots txt|redirects?)\b/i,
  checkout: /\b(?:checkout|check out|shopping cart|abandoned cart|cart abandonment|payment restrictions?|payment methods?|payment fees?|payment surcharges?|shipping restrictions?)\b/i,
  performance: /\b(?:performance|page speed|site speed|speed optimi[sz]ation|cache|caching|lazy load(?:ing)?|image optimi[sz](?:er|ation)|webp|critical css|javascript optimi[sz]ation|css optimi[sz]ation|minification|core web vitals)\b/i,
};
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function categoryExtensions(catalog: Pick<Catalog, "categories" | "extensions">, slug: string): Extension[] {
  if (slug === "hyva-compatible") return catalog.extensions.filter(item => item.hyvaCompatible === true);
  const topic = Object.hasOwn(topics, slug) ? topics[slug] : undefined;
  if (!topic) {
    const category = catalog.categories.find(item => item.slug === slug);
    return category ? catalog.extensions.filter(item => item.categoryId === category.id) : [];
  }
  const categoryIds = new Set(catalog.categories.filter(item => categoryAliases[slug].includes(item.slug)).map(item => item.id));
  return catalog.extensions.filter(item => categoryIds.has(item.categoryId)
    // Use product identity and explicit tags, not incidental marketing claims in descriptions.
    || [item.name, item.slug, ...(item.tags ?? [])].some(value => topic.test(normalize(value))));
}

export function categoryCollection(catalog: Pick<Catalog, "categories" | "extensions">, slug: string) {
  const definition = curatedCategories.find(item => item.slug === slug);
  const stored = catalog.categories.find(item => item.slug === slug);
  const category = definition ? { ...definition, updatedAt: stored?.updatedAt } : stored;
  return category ? { category, extensions: categoryExtensions(catalog, slug) } : undefined;
}

// Preserve earlier footer URLs when no editorial landing page exists in the catalog.
export const collectionAliases: Record<string, string> = {
  "best-magento-2-seo-extensions": "seo",
  "magento-2-hyva-compatible-extensions": "hyva-compatible",
};
