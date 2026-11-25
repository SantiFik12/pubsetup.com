import type { Catalog } from "../data/mappers";
import type { Extension } from "../data/types";
import { featuredExtensions } from "./featured.ts";

// Only fields used by cards travel to the client. Full text stays on the server
// for searching, metadata and detail pages.
export function cardExtension(item: Extension): Extension {
  return { ...item, coverImage: item.coverImage || item.gallery?.[0] || "", description: "", gallery: [],
    features: [], useCases: [], magentoVersions: [], affiliateUrl: "", seoTitle: undefined, seoDescription: undefined, originalUrl: undefined };
}

export function collectionCatalog(catalog: Catalog, extensions: Extension[], options: { filters?: boolean; landing?: string; partner?: string } = {}): Catalog {
  const partnerIds = new Set(extensions.map(item => item.partnerId));
  const categoryIds = new Set(extensions.map(item => item.categoryId));
  return {
    extensions: extensions.map(cardExtension),
    partners: catalog.partners.filter(item => options.filters || partnerIds.has(item.id) || (options.partner && item.slug === options.partner)),
    categories: catalog.categories.filter(item => options.filters || categoryIds.has(item.id)),
    services: catalog.services,
    blogPosts: [],
    seoLandings: options.landing ? catalog.seoLandings.filter(item => item.slug === options.landing) : [],
  };
}

export type CatalogPageKind = "all" | "blog" | "extension" | "home" | "services";

export function pageCatalog(catalog: Catalog, kind: CatalogPageKind, slug?: string): Catalog {
  if (kind === "all") return catalog;
  if (kind === "home") return collectionCatalog(catalog, featuredExtensions(catalog.extensions));
  if (kind === "services") return collectionCatalog(catalog, []);
  const post = kind === "blog" ? catalog.blogPosts.find(item => item.slug === slug) : undefined;
  const references = new Set(post?.content.flatMap(block => block.extensionSlug ? [block.extensionSlug] : []) ?? []);
  const extensions = catalog.extensions.filter(item => kind === "extension" ? item.slug === slug : references.has(item.slug));
  const partnerIds = new Set(extensions.map(item => item.partnerId));
  const categoryIds = new Set(extensions.map(item => item.categoryId));
  return {
    extensions,
    partners: catalog.partners.filter(item => partnerIds.has(item.id)),
    categories: catalog.categories.filter(item => categoryIds.has(item.id)),
    services: kind === "extension" ? catalog.services : [],
    blogPosts: kind === "blog" ? catalog.blogPosts.map(item => item.slug === slug ? item : { ...item, content: [], toc: [] }) : [],
    seoLandings: [],
  };
}

export function relatedPosts(catalog: Catalog, slug: string) {
  const post = catalog.blogPosts.find(item => item.slug === slug);
  if (!post) return [];
  const tags = new Set(post.tags);
  return catalog.blogPosts.filter(item => item.slug !== slug)
    .map(item => ({ item, score: item.tags.filter(tag => tags.has(tag)).length }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.slug.localeCompare(b.item.slug))
    .slice(0, 3).map(entry => entry.item);
}
