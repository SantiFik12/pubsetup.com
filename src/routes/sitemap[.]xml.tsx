import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE = "https://pubsetup.com";

type Url = { loc: string; lastmod?: string; changefreq?: string; priority?: number };

function xmlUrl(u: Url): string {
  return `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ""}${u.priority !== undefined ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : ""}
  </url>`;
}

async function buildSitemap(): Promise<string> {
  const [exts, cats, parts, svcs, blog, landings] = await Promise.all([
    supabase.from("extensions").select("slug, created_at"),
    supabase.from("categories").select("slug"),
    supabase.from("partners").select("slug"),
    supabase.from("services").select("slug"),
    supabase.from("blog_posts").select("slug, date").eq("published", true),
    supabase.from("seo_landings").select("slug").eq("published", true),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const urls: Url[] = [
    { loc: `${BASE}/`, lastmod: today, changefreq: "daily", priority: 1.0 },
    { loc: `${BASE}/extensions`, lastmod: today, changefreq: "daily", priority: 0.9 },
    { loc: `${BASE}/services`, lastmod: today, changefreq: "weekly", priority: 0.9 },
    { loc: `${BASE}/blog`, lastmod: today, changefreq: "weekly", priority: 0.7 },
    { loc: `${BASE}/terms`, lastmod: today, changefreq: "yearly", priority: 0.3 },
    { loc: `${BASE}/privacy`, lastmod: today, changefreq: "yearly", priority: 0.3 },
    { loc: `${BASE}/refund`, lastmod: today, changefreq: "yearly", priority: 0.3 },
  ];

  const tagSet = new Set<string>();
  for (const e of exts.data ?? []) {
    urls.push({
      loc: `${BASE}/extension/${e.slug}`,
      lastmod: e.created_at ? String(e.created_at).slice(0, 10) : today,
      changefreq: "weekly",
      priority: 0.8,
    });
  }
  for (const c of cats.data ?? []) {
    urls.push({ loc: `${BASE}/category/${c.slug}`, lastmod: today, changefreq: "weekly", priority: 0.7 });
  }
  for (const p of parts.data ?? []) {
    urls.push({ loc: `${BASE}/partner/${p.slug}`, lastmod: today, changefreq: "weekly", priority: 0.6 });
  }
  for (const s of svcs.data ?? []) {
    urls.push({ loc: `${BASE}/services/${s.slug}`, lastmod: today, changefreq: "monthly", priority: 0.7 });
  }
  for (const b of blog.data ?? []) {
    urls.push({
      loc: `${BASE}/blog/${b.slug}`,
      lastmod: b.date ? String(b.date).slice(0, 10) : today,
      changefreq: "monthly",
      priority: 0.6,
    });
  }
  for (const l of landings.data ?? []) {
    urls.push({ loc: `${BASE}/${l.slug}`, lastmod: today, changefreq: "monthly", priority: 0.6 });
  }

  // Tags from extension data
  const { data: extTags } = await supabase.from("extensions").select("tags");
  for (const r of extTags ?? []) {
    const tags: string[] = (r as { tags?: string[] }).tags ?? [];
    for (const t of tags) tagSet.add(t);
  }
  for (const t of tagSet) {
    const slug = t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (slug) urls.push({ loc: `${BASE}/tag/${slug}`, lastmod: today, changefreq: "monthly", priority: 0.4 });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(xmlUrl).join("\n")}
</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildSitemap();
          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch (e) {
          return new Response(`Error: ${(e as Error).message}`, { status: 500 });
        }
      },
    },
  },
});
