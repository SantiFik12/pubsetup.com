"use client";
import { createContext,useContext } from "react";
import type { Catalog } from "./mappers";
export type { Catalog } from "./mappers";
const Context = createContext<Catalog | null>(null);
export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
 return <Context.Provider value={catalog}>{children}</Context.Provider>;
}
export function useCatalog() {
 const catalog = useContext(Context);
 if (!catalog) throw new Error("Missing CatalogProvider");
 return { ...catalog, isLoading: false, error: null };
}
export function useExtensions() { return useCatalog().extensions; }
export function usePartners() { return useCatalog().partners; }
export function useCategories() { return useCatalog().categories; }
export function useServices() { return useCatalog().services; }
export function useBlogPosts() { return useCatalog().blogPosts; }
export function useSeoLandings() { return useCatalog().seoLandings; }

export function useExtension(slug?: string) {
  return useCatalog().extensions.find((e) => e.slug === slug);
}
export function usePartner(idOrSlug?: string) {
  const { partners } = useCatalog();
  return partners.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
export function useCategory(idOrSlug?: string) {
  const { categories } = useCatalog();
  return categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
export function useService(slug?: string) {
  return useCatalog().services.find((s) => s.slug === slug);
}
export function useBlogPost(slug?: string) {
  return useCatalog().blogPosts.find((p) => p.slug === slug);
}
export function useSeoLanding(slug?: string) {
  return useCatalog().seoLandings.find((l) => l.slug === slug);
}

export function useAllTags() {
  const { extensions } = useCatalog();
  return Array.from(new Set(extensions.flatMap((e) => e.tags))).sort();
}
