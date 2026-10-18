import type { Extension } from "@/data/types";

export const featuredCategory = "featured";

export function featuredExtensions(extensions: Extension[]): Extension[] {
  return extensions.slice().sort((a, b) => {
    const byViews = (b.views ?? 0) - (a.views ?? 0);
    if (byViews) return byViews;
    const byDate = (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    if (byDate) return byDate;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  }).slice(0, 6);
}
