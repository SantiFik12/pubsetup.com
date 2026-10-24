import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, metaDescription, pageMetadata } from "@/lib/seo";
import View from "@/views/category-slug";
import { notFound } from "next/navigation";
import { categoryCollection } from "@/lib/catalog-collections";

type Props = { params: Promise<{ slug: string }> };
async function details({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const collection = categoryCollection(catalog, slug);
  if (!collection) notFound();
  const { category: item, extensions } = collection;
  const description = metaDescription(item.description, `Explore ${item.name} Magento 2 extensions. Compare features, compatibility and partner prices, with professional installation from pubsetup.com.`);
  return { item, extensions, description };
}
export async function generateMetadata(props: Props) {
  const { item, extensions, description } = await details(props);
  return pageMetadata({ title: `${item.name}`, description, path: `/category/${item.slug}`, image: extensions[0]?.coverImage, index: extensions.length > 0 });
}
export default async function Page(props: Props) {
  const { item, extensions } = await details(props);
  const path = `/category/${item.slug}`;
  return <><JsonLd data={collectionSchema(item.name, path, extensions.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: item.name, path }])} /><View category={item} extensions={extensions} /></>;
}
