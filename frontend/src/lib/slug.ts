export function tagSlug(tag: string) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function tagFromSlug(slug: string, allTags: string[]): string | undefined {
  return allTags.find((t) => tagSlug(t) === slug);
}
