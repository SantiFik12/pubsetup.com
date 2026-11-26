import { CatalogPage } from "@/components/CatalogPage";
import { GuideLinks } from "@/components/GuideLinks";
import { getCatalog } from "@/lib/catalog.server";
import { latestBlogPosts } from "@/lib/blog-feed";
import View from "@/views/index";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({"title": "Magento 2 extensions catalog & expert services", "description": "Find the best Magento 2 extensions from trusted partners and get them installed by experts.", "path": "/"});
export const dynamic = "force-dynamic";
export default async function Page() {
  const catalog = await getCatalog();
  const latest = latestBlogPosts(catalog.blogPosts);
  return <><CatalogPage kind="home"><View showAdminDemo={process.env.DEMO_ADMIN_ENABLED !== "0"}/></CatalogPage><GuideLinks posts={latest} title="Magento 2 guides and comparisons" showAllLink /></>;
}
