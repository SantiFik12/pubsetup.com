import { CollectionPagination } from "@/components/CollectionPagination";
import { collectionPage, type CollectionSearchParams } from "@/lib/collection-page";
import { CatalogProvider } from "@/data/catalog";
import { collectionCatalog } from "@/lib/page-catalog";
import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, pageMetadata } from "@/lib/seo";
import { tagSlug } from "@/lib/slug";
import View from "@/views/tag-slug";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CollectionSearchParams> };
async function details({ params, searchParams }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const tag = catalog.extensions.flatMap(extension => extension.tags).find(tag => tagSlug(tag) === slug);
  if (!tag) notFound();
  const extensions = catalog.extensions.filter(extension => extension.tags.includes(tag));
  return { slug, tag, pagination: collectionPage(extensions, `/tag/${slug}`, await searchParams) };
}
export async function generateMetadata(props: Props) {
  const { tag, pagination } = await details(props);
  return pageMetadata({ title: `Magento 2 extensions tagged "${tag}"${pagination.page > 1 ? ` – Page ${pagination.page}` : ""}`, description: `Browse Magento 2 extensions tagged "${tag}". Compare features, partner prices and Magento compatibility, with expert installation available.`, path: pagination.path, image: pagination.items[0]?.coverImage, index: pagination.index });
}
export default async function Page(props: Props) {
  const { tag, pagination } = await details(props);
  const scoped = collectionCatalog(await getCatalog(), pagination.items);
  const path = pagination.path;
  return <><JsonLd data={collectionSchema(tag, path, pagination.items.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: tag, path }])} /><CatalogProvider catalog={scoped}><View total={pagination.total} /></CatalogProvider><CollectionPagination basePath={pagination.basePath} page={pagination.page} pages={pagination.pages} /></>;
}
