import { CollectionSeo } from "@/components/CollectionSeo";
import { getCatalog } from "@/lib/catalog.server";
import { pageMetadata } from "@/lib/seo";
import View from "@/views/blog-index";

export async function generateMetadata() {
  const catalog = await getCatalog();
  return pageMetadata({ title: "Magento 2 Blog \u2014 pubsetup.com", description: "Guides and practical advice for Magento store owners.", path: "/blog", index: catalog.blogPosts.length > 0 });
}
export default async function Page() {
  const catalog = await getCatalog();
  return <><CollectionSeo name="Magento 2 Blog" path="/blog" items={catalog.blogPosts.map(item => ({ name: item.title, path: `/blog/${item.slug}` }))} /><View /></>;
}
