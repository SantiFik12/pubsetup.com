import type { Extension } from "../data/types";

// Match product subjects rather than generic catalog vocabulary or vendor copy.
const generic = new Set("magento adobe commerce extension extensions module modules plugin plugins integration integrations connector for and the with by to of in a an per pro free m2 add on addon product products marketplace vendor multi 2".split(" "));
function subject(name: string): Set<string> {
  return new Set((name.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter(word => word.length > 1 && !generic.has(word)));
}

export function relatedExtensions(extensions: Extension[], item: Extension): Extension[] {
  const words = subject(item.name);
  if (words.size < 2) return [];
  const seen = new Set([item.slug]);
  return extensions.filter(candidate => candidate.id !== item.id && candidate.slug !== item.slug)
    .map(candidate => {
      const other = subject(candidate.name);
      const shared = [...words].filter(word => other.has(word)).length;
      return { candidate, shared, similarity: shared / new Set([...words, ...other]).size };
    })
    .filter(match => match.shared >= 2 && match.similarity >= 0.4)
    .sort((a, b) => b.similarity - a.similarity || b.shared - a.shared ||
      Number(b.candidate.categoryId === item.categoryId) - Number(a.candidate.categoryId === item.categoryId) ||
      a.candidate.slug.localeCompare(b.candidate.slug))
    .filter(({ candidate }) => {
      if (seen.has(candidate.slug)) return false;
      seen.add(candidate.slug);
      return true;
    }).slice(0, 3).map(({ candidate }) => candidate);
}
