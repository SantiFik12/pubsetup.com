import { CollectionPagination } from "@/components/CollectionPagination";
import { collectionPage, type CollectionSearchParams } from "@/lib/collection-page";
import { CatalogProvider } from "@/data/catalog";
import { collectionCatalog } from "@/lib/page-catalog";
import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, metaDescription, pageMetadata } from "@/lib/seo";
import View from "@/views/category-slug";
import { notFound } from "next/navigation";
import { categoryCollection } from "@/lib/catalog-collections";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CollectionSearchParams> };
async function details({ params, searchParams }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const collection = categoryCollection(catalog, slug);
  if (!collection) notFound();
  const { category: item, extensions } = collection;
  const description = metaDescription(item.description, `Explore ${item.name} Magento 2 extensions. Compare features, compatibility and partner prices, with professional installation from pubsetup.com.`);
  return { item, description, pagination: collectionPage(extensions, `/category/${item.slug}`, await searchParams) };
}
export async function generateMetadata(props: Props) {
  const { item, pagination, description } = await details(props);
  return pageMetadata({ title: `${item.name}${pagination.page > 1 ? ` – Page ${pagination.page}` : ""}`, description, path: pagination.path, image: pagination.items[0]?.coverImage, index: pagination.index });
}
export default async function Page(props: Props) {
  const { item, pagination } = await details(props);
  const scoped = collectionCatalog(await getCatalog(), pagination.items);
  const path = pagination.path;
  return <><JsonLd data={collectionSchema(item.name, path, pagination.items.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: item.name, path }])} /><CatalogProvider catalog={scoped}><View category={item} extensions={scoped.extensions} total={pagination.total} /></CatalogProvider><CollectionPagination basePath={pagination.basePath} page={pagination.page} pages={pagination.pages} /></>;
}
