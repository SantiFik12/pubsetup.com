import type { Catalog } from "../data/mappers";
import { articleTextParts } from "./article-text.ts";
import { moduleHref } from "./module-links.ts";

export function moduleGuides(catalog: Catalog, slug: string) {
  const href = moduleHref(slug);
  return catalog.blogPosts.filter(post => post.content.some(block => {
    if (block.extensionSlug === slug) return true;
    return [block.text ?? "", ...(block.items ?? []), ...(block.rows ?? []).flat()].some(text =>
      articleTextParts(text).some(part => part.type === "link" && part.href.split(/[?#]/)[0] === href));
  }));
}
