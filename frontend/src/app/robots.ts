import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  // Let crawlers read noindex on checkout/compare, admin, redirect and email pages.
  return { rules: { userAgent: "*", allow: "/" }, sitemap: absoluteUrl("/sitemap.xml") };
}
