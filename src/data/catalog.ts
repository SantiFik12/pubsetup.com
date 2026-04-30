import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Partner, Category, Extension } from "./types";

type Row<T extends keyof any> = Record<T, any>;

function mapPartner(r: Row<string>): Partner {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    logoLetter: r.logo_letter,
    description: r.description ?? "",
    website: r.website ?? "",
  };
}

function mapCategory(r: Row<string>): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    icon: r.icon ?? "",
  };
}

function mapExtension(r: Row<string>): Extension {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    partnerId: r.partner_id,
    categoryId: r.category_id,
    shortDescription: r.short_description ?? "",
    description: r.description ?? "",
    priceFrom: Number(r.price_from ?? 0),
    priceType: r.price_type,
    rating: Number(r.rating ?? 0),
    reviews: r.reviews ?? 0,
    recommended: !!r.recommended,
    bestSeller: !!r.best_seller,
    affiliateUrl: r.affiliate_url ?? "",
    magentoVersions: r.magento_versions ?? [],
    hyvaCompatible: !!r.hyva_compatible,
    pwaReady: !!r.pwa_ready,
    edition: r.edition,
    installComplexity: r.install_complexity,
    hasTrial: !!r.has_trial,
    hasDemo: !!r.has_demo,
    supportMonths: r.support_months ?? 0,
    features: r.features ?? [],
    useCases: r.use_cases ?? [],
    tags: r.tags ?? [],
    installPrice: Number(r.install_price ?? 0),
    createdAt: r.created_at,
  };
}

async function fetchCatalog() {
  const [p, c, e] = await Promise.all([
    supabase.from("partners").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("extensions").select("*").order("created_at", { ascending: false }),
  ]);
  if (p.error) throw p.error;
  if (c.error) throw c.error;
  if (e.error) throw e.error;
  return {
    partners: (p.data ?? []).map(mapPartner),
    categories: (c.data ?? []).map(mapCategory),
    extensions: (e.data ?? []).map(mapExtension),
  };
}

export type Catalog = Awaited<ReturnType<typeof fetchCatalog>>;

const EMPTY: Catalog = { partners: [], categories: [], extensions: [] };

export function useCatalog() {
  const q = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 60_000,
  });
  return { ...(q.data ?? EMPTY), isLoading: q.isLoading, error: q.error };
}

export function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["catalog"] });
}

export function useExtensions() {
  return useCatalog().extensions;
}
export function usePartners() {
  return useCatalog().partners;
}
export function useCategories() {
  return useCatalog().categories;
}

export function useExtension(slug?: string) {
  const { extensions } = useCatalog();
  return extensions.find((e) => e.slug === slug);
}
export function usePartner(idOrSlug?: string) {
  const { partners } = useCatalog();
  return partners.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
export function useCategory(idOrSlug?: string) {
  const { categories } = useCatalog();
  return categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

export function useAllTags() {
  const { extensions } = useCatalog();
  return Array.from(new Set(extensions.flatMap((e) => e.tags))).sort();
}
