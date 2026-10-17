import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, pageMetadata } from "@/lib/seo";
import { tagSlug } from "@/lib/slug";
import View from "@/views/tag-slug";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
async function details({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const tag = catalog.extensions.flatMap(extension => extension.tags).find(tag => tagSlug(tag) === slug);
  if (!tag) notFound();
  return { slug, tag, extensions: catalog.extensions.filter(extension => extension.tags.includes(tag)) };
}
export async function generateMetadata(props: Props) {
  const { slug, tag, extensions } = await details(props);
  return pageMetadata({ title: `Magento 2 extensions tagged "${tag}" — pubsetup.com`, description: `Browse Magento 2 extensions tagged "${tag}". Compare features, partner prices and Magento compatibility, with expert installation available.`, path: `/tag/${slug}`, image: extensions[0]?.coverImage });
}
export default async function Page(props: Props) {
  const { slug, tag, extensions } = await details(props);
  const path = `/tag/${slug}`;
  return <><JsonLd data={collectionSchema(tag, path, extensions.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: tag, path }])} /><View /></>;
}
