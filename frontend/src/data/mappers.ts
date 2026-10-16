/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BlogPost,Category,Extension,Partner,SeoLanding,Service } from "./types";
type Row = Record<string, any>; // Database rows are normalized below.


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
    coverImage: r.cover_image ?? "",
    gallery: Array.isArray(r.gallery) ? r.gallery : [],
    userGuideUrl: r.user_guide_url ?? "",
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


export function mapCatalog(rows: Record<string, Row[]>) { return { partners: rows.partners.map(mapPartner), categories: rows.categories.map(mapCategory), extensions: rows.extensions.map(mapExtension), services: rows.services.map(mapService), blogPosts: rows.blogPosts.map(mapBlog), seoLandings: rows.seoLandings.map(mapLanding) }; }
export type Catalog = ReturnType<typeof mapCatalog>;
