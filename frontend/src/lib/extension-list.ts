import type { Extension, Partner } from "../data/types.ts";
import { isFreeExtension } from "./extension-price.ts";
import { featuredCategory, featuredExtensions } from "./featured.ts";

export const catalogDefaults = { q: "", cat: "", partner: "", tag: "", price: "all", hyva: false, pwa: false, sort: "popular", page: "1" };
export type CatalogSearch = typeof catalogDefaults;
export const extensionPageSize = 24;

const searchIndexes = new WeakMap<Extension[], { partners: Partner[]; text: Map<Extension, string> }>();

function extensionSearchIndex(extensions: Extension[], partners: Partner[]): Map<Extension, string> {
  const cached = searchIndexes.get(extensions);
  if (cached?.partners === partners) return cached.text;
  const partnerNames = new Map(partners.map(partner => [partner.id, partner.name]));
  const text = new Map(extensions.map(extension => [extension, [extension.name, extension.shortDescription, extension.description, partnerNames.get(extension.partnerId), ...extension.tags].filter(Boolean).join(" ").toLowerCase()]));
  searchIndexes.set(extensions, { partners, text });
  return text;
}

export function readCatalogSearch(params: Record<string, string | string[] | undefined>): CatalogSearch {
  const get = (key: string, fallback: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
  };
  return {
    q: get("q", ""), cat: get("cat", ""), partner: get("partner", ""), tag: get("tag", ""), price: get("price", "all"),
    hyva: get("hyva", "false") === "true", pwa: get("pwa", "false") === "true", sort: get("sort", "popular"), page: get("page", "1"),
  };
}

export function filteredExtensions(extensions: Extension[], partners: Partner[], search: CatalogSearch): Extension[] {
  let list = search.cat === featuredCategory ? featuredExtensions(extensions) : extensions.slice();
  if (search.q.trim()) {
    const q = search.q.trim().toLowerCase();
    const index = extensionSearchIndex(extensions, partners);
    list = list.filter(extension => index.get(extension)!.includes(q));
  }
  if (search.cat && search.cat !== featuredCategory) list = list.filter(extension => extension.categoryId === search.cat);
  if (search.partner) list = list.filter(extension => extension.partnerId === search.partner);
  if (search.tag) list = list.filter(extension => extension.tags.includes(search.tag));
  if (search.hyva) list = list.filter(extension => extension.hyvaCompatible);
  if (search.pwa) list = list.filter(extension => extension.pwaReady);
  if (search.price === "free") list = list.filter(isFreeExtension);
  if (search.price === "lt300") list = list.filter(extension => extension.priceFrom < 300 && !isFreeExtension(extension));
  if (search.price === "gte300") list = list.filter(extension => extension.priceFrom >= 300 && !isFreeExtension(extension));
  return list.sort((a, b) => {
    let difference = 0;
    switch (search.sort) {
      case "newest": difference = b.createdAt.localeCompare(a.createdAt); break;
      case "cheapest": difference = a.priceFrom - b.priceFrom; break;
      case "best-rated": difference = b.rating - a.rating; break;
      default: difference = (b.views ?? 0) - (a.views ?? 0);
    }
    return difference || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  });
}

export function extensionPage(extensions: Extension[], requested: string) {
  const pages = Math.max(1, Math.ceil(extensions.length / extensionPageSize));
  const numeric = /^\d+$/.test(requested) ? Number(requested) : 1;
  const page = Math.max(1, Math.min(Number.isFinite(numeric) ? numeric : pages, pages));
  const start = (page - 1) * extensionPageSize;
  return { items: extensions.slice(start, start + extensionPageSize), total: extensions.length, page, pages, from: extensions.length ? start + 1 : 0, to: Math.min(start + extensionPageSize, extensions.length) };
}

export function extensionListHref(search: CatalogSearch, page: number): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(catalogDefaults) as (keyof CatalogSearch)[]) {
    if (key === "page") continue;
    const value = search[key];
    if (value !== catalogDefaults[key] && value !== "" && value !== false) params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  return `/extensions${params.size ? `?${params}` : ""}`;
}

export function paginationNumbers(page: number, pages: number): (number | "gap")[] {
  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const number of [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages])].filter(number => number >= 1 && number <= pages).sort((a, b) => a - b)) {
    if (previous && number - previous > 1) result.push("gap");
    result.push(number);
    previous = number;
  }
  return result;
}
