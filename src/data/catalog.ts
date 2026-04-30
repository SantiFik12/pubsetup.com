import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Partner, Category, Extension, Service, BlogPost, SeoLanding } from "./types";

type Row = Record<string, any>;

function mapPartner(r: Row): Partner {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    logoLetter: r.logo_letter,
    description: r.description ?? "",
    website: r.website ?? "",
  };
}

function mapCategory(r: Row): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    icon: r.icon ?? "",
  };
}

function mapExtension(r: Row): Extension {
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

function mapService(r: Row): Service {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    includes: r.includes ?? [],
    duration: r.duration ?? "",
    price: Number(r.price ?? 0),
    unit: r.unit ?? undefined,
    featured: !!r.featured,
  };
}

function mapBlog(r: Row): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    cover: r.cover ?? "",
    category: r.category ?? "",
    tags: r.tags ?? [],
    author: r.author ?? "",
    date: r.date,
    readMinutes: r.read_minutes ?? 5,
    toc: r.toc ?? [],
    content: r.content ?? [],
  };
}

function mapLanding(r: Row): SeoLanding {
  return {
    slug: r.slug,
    title: r.title,
    metaDescription: r.meta_description ?? "",
    intro: r.intro ?? "",
    filter: r.filter ?? {},
  };
}

async function fetchCatalog() {
  const [p, c, e, s, b, l] = await Promise.all([
    supabase.from("partners").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("extensions").select("*").order("created_at", { ascending: false }),
    supabase.from("services").select("*").order("price"),
    supabase.from("blog_posts").select("*").eq("published", true).order("date", { ascending: false }),
    supabase.from("seo_landings").select("*").eq("published", true),
  ]);
  if (p.error) throw p.error;
  if (c.error) throw c.error;
  if (e.error) throw e.error;
  if (s.error) throw s.error;
  if (b.error) throw b.error;
  if (l.error) throw l.error;
  return {
    partners: (p.data ?? []).map(mapPartner),
    categories: (c.data ?? []).map(mapCategory),
    extensions: (e.data ?? []).map(mapExtension),
    services: (s.data ?? []).map(mapService),
    blogPosts: (b.data ?? []).map(mapBlog),
    seoLandings: (l.data ?? []).map(mapLanding),
  };
}

export type Catalog = Awaited<ReturnType<typeof fetchCatalog>>;

const EMPTY: Catalog = {
  partners: [], categories: [], extensions: [],
  services: [], blogPosts: [], seoLandings: [],
};

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
