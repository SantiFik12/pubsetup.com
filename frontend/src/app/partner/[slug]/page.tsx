import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, metaDescription, pageMetadata } from "@/lib/seo";
import View from "@/views/partner-slug";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
async function details({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const item = catalog.partners.find(item => item.slug === slug);
  if (!item) notFound();
  const extensions = catalog.extensions.filter(extension => extension.partnerId === item.id);
  const description = metaDescription(item.description, `Browse Magento 2 extensions by ${item.name}. Compare features and partner prices, and get expert installation from pubsetup.com.`);
  return { item, extensions, description };
}
export async function generateMetadata(props: Props) {
  const { item, extensions, description } = await details(props);
  return pageMetadata({ title: `${item.name}`, description, path: `/partner/${item.slug}`, image: extensions[0]?.coverImage, index: extensions.length > 0 });
}
export default async function Page(props: Props) {
  const { item, extensions } = await details(props);
  const path = `/partner/${item.slug}`;
  return <><JsonLd data={collectionSchema(item.name, path, extensions.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: item.name, path }])} /><View /></>;
}
