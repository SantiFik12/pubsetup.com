import type { Catalog } from "../data/mappers";

export function pageCatalog(catalog: Catalog, kind: "all" | "blog" | "extension", slug?: string): Catalog {
  if (kind === "all") return catalog;
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
