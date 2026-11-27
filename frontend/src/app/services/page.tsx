import { CatalogPage } from "@/components/CatalogPage";
import { CollectionSeo } from "@/components/CollectionSeo";
import { getCatalog } from "@/lib/catalog.server";
import { pageMetadata } from "@/lib/seo";
import View from "@/views/services";

export async function generateMetadata() {
  const catalog = await getCatalog();
  return pageMetadata({ title: "Magento 2 Services", description: "Magento 2 installation, third-party API and ERP / CRM integrations, security and performance services. Fixed-price options and hourly work by agreement.", path: "/services", index: catalog.services.length > 0 });
}
export default async function Page() {
  const catalog = await getCatalog();
  return <><CollectionSeo name="Magento 2 Services" path="/services" items={catalog.services.map(item => ({ name: item.name, path: `/services/${item.slug}` }))} /><CatalogPage kind="services"><View /></CatalogPage></>;
}
