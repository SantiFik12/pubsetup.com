import { getCatalog } from "@/lib/catalog.server";
import { tagSlug } from "@/lib/slug";
import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const c=await getCatalog(); const base=process.env.SITE_URL ?? "https://pubsetup.com";
 const paths=["", "extensions","services","blog","privacy","terms","refund","affiliate-disclosure",
 ...c.extensions.map(i=>`extension/${i.slug}`),...c.categories.map(i=>`category/${i.slug}`),...c.partners.map(i=>`partner/${i.slug}`),...c.services.map(i=>`services/${i.slug}`),...c.blogPosts.map(i=>`blog/${i.slug}`),...c.seoLandings.map(i=>i.slug),...new Set(c.extensions.flatMap(i=>i.tags).map(t=>`tag/${tagSlug(t)}`))];
 return paths.map(path=>({url:`${base}/${path}`}));
}
