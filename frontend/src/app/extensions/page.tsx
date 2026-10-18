import { CollectionSeo } from "@/components/CollectionSeo";
import { getCatalog } from "@/lib/catalog.server";
import { pageMetadata } from "@/lib/seo";
import View from "@/views/extensions";

export async function generateMetadata() {
  const catalog = await getCatalog();
  return pageMetadata({ title: "Magento 2 Extensions Catalog", description: "Browse curated Magento 2 extensions. Compare features, partner prices, Hyv\u00e4 compatibility and professional installation options.", path: "/extensions", index: catalog.extensions.length > 0 });
}
export default async function Page() {
  const catalog = await getCatalog();
  return <><CollectionSeo name="Magento 2 Extensions Catalog" path="/extensions" items={catalog.extensions.map(item => ({ name: item.name, path: `/extension/${item.slug}` }))} /><View /></>;
}
