import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, landingExtensions, pageMetadata } from "@/lib/seo";
import View from "@/views/landing";
import { notFound, permanentRedirect } from "next/navigation";
import { collectionAliases } from "@/lib/catalog-collections";

type Props = { params: Promise<{ landing: string }> };
async function details({ params }: Props) {
  const { landing } = await params;
  const catalog = await getCatalog();
  const item = catalog.seoLandings.find(item => item.slug === landing);
  if (!item) {
    if (Object.hasOwn(collectionAliases, landing)) permanentRedirect(`/category/${collectionAliases[landing]}`);
    notFound();
  }
  return { item, extensions: landingExtensions(catalog, item) };
}
export async function generateMetadata(props: Props) {
  const { item, extensions } = await details(props);
  return pageMetadata({ title: `${item.title}`, description: item.metaDescription || item.intro, path: `/${item.slug}`, image: extensions[0]?.coverImage, index: extensions.length > 0 });
}
export default async function Page(props: Props) {
  const { item, extensions } = await details(props);
  const path = `/${item.slug}`;
  return <><JsonLd data={collectionSchema(item.title, path, extensions.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: item.title, path }])} /><View /></>;
}
