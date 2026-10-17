import type { MetadataRoute } from "next";
import type { Catalog } from "@/data/mappers";
import { absoluteUrl, landingExtensions, latestDate, validDate } from "./seo.ts";
import { tagSlug } from "./slug.ts";

export function catalogSitemap(catalog: Catalog): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, lastModified?: string) => entries.push({ url: absoluteUrl(path), ...(lastModified ? { lastModified } : {}) });
  const extensionDate = latestDate(catalog.extensions.map(item => item.updatedAt || item.createdAt));
  const serviceDate = latestDate(catalog.services.map(item => item.updatedAt));
  const blogDate = latestDate(catalog.blogPosts.map(item => item.updatedAt || item.date));
  add("/", latestDate([extensionDate, serviceDate, blogDate]));
  for (const path of ["/privacy", "/terms", "/refund", "/affiliate-disclosure"]) add(path);
  if (catalog.extensions.length) add("/extensions", extensionDate);
  if (catalog.services.length) add("/services", serviceDate);
  if (catalog.blogPosts.length) add("/blog", blogDate);
  for (const item of catalog.extensions) add(`/extension/${item.slug}`, validDate(item.updatedAt || item.createdAt));
  for (const item of catalog.services) add(`/services/${item.slug}`, validDate(item.updatedAt));
  for (const item of catalog.blogPosts) add(`/blog/${item.slug}`, validDate(item.updatedAt || item.date));
  for (const category of catalog.categories) {
    const extensions = catalog.extensions.filter(item => item.categoryId === category.id);
    if (extensions.length) add(`/category/${category.slug}`, latestDate([category.updatedAt, ...extensions.map(item => item.updatedAt || item.createdAt)]));
  }
  for (const partner of catalog.partners) {
    const extensions = catalog.extensions.filter(item => item.partnerId === partner.id);
    if (extensions.length) add(`/partner/${partner.slug}`, latestDate([partner.updatedAt, ...extensions.map(item => item.updatedAt || item.createdAt)]));
  }
  for (const landing of catalog.seoLandings) {
    const extensions = landingExtensions(catalog, landing);
    if (extensions.length) add(`/${landing.slug}`, latestDate([landing.updatedAt, ...extensions.map(item => item.updatedAt || item.createdAt)]));
  }
  for (const tag of new Set(catalog.extensions.flatMap(item => item.tags))) {
    const extensions = catalog.extensions.filter(item => item.tags.includes(tag));
    add(`/tag/${tagSlug(tag)}`, latestDate(extensions.map(item => item.updatedAt || item.createdAt)));
  }
  return [...new Map(entries.map(entry => [entry.url, entry])).values()];
}
