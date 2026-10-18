import type { Metadata } from "next";
import type { Catalog } from "@/data/mappers";
import type { Extension, SeoLanding } from "@/data/types";

export const siteUrl = (process.env.SITE_URL ?? "https://pubsetup.com").replace(/\/+$/, "");
export const defaultImage = "/social-image";
export const absoluteUrl = (path: string) => new URL(path, `${siteUrl}/`).href;

export function metaDescription(text: string, fallback: string): string {
  const clean = (text || fallback).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || fallback;
  if (clean.length <= 160) return clean;
  const end = clean.lastIndexOf(" ", 157);
  return `${clean.slice(0, end > 100 ? end : 157).replace(/[.,;:!?]+$/, "")}…`;
}

export function pageMetadata({ title, description, path, image, index = true, article = false }: {
  title: string; description: string; path: string; image?: string; index?: boolean; article?: boolean;
}): Metadata {
  const summary = metaDescription(description, "Explore Magento 2 extensions and expert installation, configuration and optimization services at pubsetup.com.");
  const images = [{ url: absoluteUrl(image || defaultImage), alt: title }];
  return {
    title, description: summary, alternates: { canonical: absoluteUrl(path) },
    robots: { index, follow: true },
    openGraph: { title, description: summary, url: absoluteUrl(path), siteName: "pubsetup.com", type: article ? "article" : "website", images },
    twitter: { card: "summary_large_image", title, description: summary, images: images.map(item => item.url) },
  };
}

export function extensionMetadata(item: Extension): Metadata {
  return pageMetadata({ title: item.seoTitle || item.name, description: item.seoDescription || item.shortDescription || item.description, path: `/extension/${item.slug}`, image: item.coverImage || item.gallery[0] });
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({
    "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}

export function collectionSchema(name: string, path: string, items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "CollectionPage", name, url: absoluteUrl(path), isPartOf: { "@id": absoluteUrl("/#website") },
    mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name, url: absoluteUrl(item.path),
    })) },
  };
}

export function landingExtensions(catalog: Catalog, landing: SeoLanding): Extension[] {
  const filter = landing.filter;
  return catalog.extensions.filter(extension =>
    (!filter.categorySlug || catalog.categories.some(category => category.slug === filter.categorySlug && category.id === extension.categoryId)) &&
    (!filter.partnerSlug || catalog.partners.some(partner => partner.slug === filter.partnerSlug && partner.id === extension.partnerId)) &&
    (!filter.tag || extension.tags.includes(filter.tag)) &&
    (!filter.hyvaCompatible || extension.hyvaCompatible) &&
    (typeof filter.priceMax !== "number" || extension.priceFrom <= filter.priceMax)
  );
}

export function validDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function latestDate(values: (string | undefined)[]): string | undefined {
  return values.map(validDate).filter((value): value is string => !!value).sort().at(-1);
}
