import { getCatalog } from "@/lib/catalog.server";
import { catalogSitemap } from "@/lib/sitemap";
export const dynamic = "force-dynamic";
export default async function sitemap() { return catalogSitemap(await getCatalog()); }
