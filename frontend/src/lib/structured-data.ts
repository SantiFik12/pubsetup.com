import type { BlogPost, Category, Extension, Partner, Service } from "@/data/types";
import { absoluteUrl, metaDescription, validDate } from "./seo.ts";

export function extensionSchema(extension: Extension, partner?: Partner, category?: Category) {
  const vendorUrl = extension.originalUrl || extension.affiliateUrl;
  return {
    "@context": "https://schema.org", "@type": "Product", "@id": absoluteUrl(`/extension/${extension.slug}#product`),
    name: extension.name, url: absoluteUrl(`/extension/${extension.slug}`),
    description: metaDescription(extension.shortDescription, extension.description),
    image: [...new Set([extension.coverImage, ...extension.gallery].filter(Boolean))].map(absoluteUrl),
    ...(partner ? { brand: { "@type": "Brand", name: partner.name } } : {}),
    ...(category ? { category: category.name } : {}),
    // Prices belong to the vendor. A missing/unknown price must not become a free offer.
    ...(vendorUrl && (extension.priceFrom > 0 || extension.priceType === "free") ? { offers: {
      "@type": "Offer", price: extension.priceType === "free" ? 0 : extension.priceFrom, priceCurrency: "USD", url: vendorUrl,
      ...(partner ? { seller: { "@type": "Organization", name: partner.name, ...(partner.website ? { url: partner.website } : {}) } } : {}),
    } } : {}),
  };
}

export function serviceSchema(service: Service) {
  return {
    "@context": "https://schema.org", "@type": "Service", "@id": absoluteUrl(`/services/${service.slug}#service`),
    name: service.name, serviceType: "Magento 2 services", description: service.description,
    url: absoluteUrl(`/services/${service.slug}`), provider: { "@id": absoluteUrl("/#organization") },
    ...(service.price > 0 ? { offers: {
      "@type": "Offer", url: absoluteUrl(`/services/${service.slug}`), priceCurrency: "USD",
      ...(service.unit?.includes("/hr") ? { priceSpecification: { "@type": "PriceSpecification", minPrice: service.price, priceCurrency: "USD", description: "Minimum project budget" } } : { price: service.price }),
    } } : {}),
  };
}

export function articleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org", "@type": "BlogPosting", "@id": absoluteUrl(`/blog/${post.slug}#article`),
    headline: post.title, description: post.excerpt, url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`), datePublished: validDate(post.date), dateModified: validDate(post.updatedAt || post.date),
    ...(post.cover ? { image: absoluteUrl(post.cover) } : {}),
    ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}
