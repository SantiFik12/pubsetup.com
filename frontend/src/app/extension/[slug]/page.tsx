import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, extensionMetadata } from "@/lib/seo";
import { extensionSchema } from "@/lib/structured-data";
import View from "@/views/extension-slug";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
async function details({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const item = catalog.extensions.find(extension => extension.slug === slug);
  if (!item) notFound();
  return { item, partner: catalog.partners.find(partner => partner.id === item.partnerId), category: catalog.categories.find(category => category.id === item.categoryId) };
}
export async function generateMetadata(props: Props) {
  const { item } = await details(props);
  return extensionMetadata(item);
}
export default async function Page(props: Props) {
  const { item, partner, category } = await details(props);
  return <><JsonLd data={extensionSchema(item, partner, category)} /><JsonLd data={breadcrumbs([
    { name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" },
    ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
    { name: item.name, path: `/extension/${item.slug}` },
  ])} /><View /></>;
}
