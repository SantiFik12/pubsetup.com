import { CollectionPagination } from "@/components/CollectionPagination";
import { collectionPage, type CollectionSearchParams } from "@/lib/collection-page";
import { CatalogProvider } from "@/data/catalog";
import { collectionCatalog } from "@/lib/page-catalog";
import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, collectionSchema, landingExtensions, pageMetadata } from "@/lib/seo";
import View from "@/views/landing";
import { notFound, permanentRedirect } from "next/navigation";
import { collectionAliases } from "@/lib/catalog-collections";

type Props = { params: Promise<{ landing: string }>; searchParams: Promise<CollectionSearchParams> };
async function details({ params, searchParams }: Props) {
  const { landing } = await params;
  const catalog = await getCatalog();
  const item = catalog.seoLandings.find(item => item.slug === landing);
  if (!item) {
    if (Object.hasOwn(collectionAliases, landing)) permanentRedirect(`/category/${collectionAliases[landing]}`);
    notFound();
  }
  const extensions = landingExtensions(catalog, item);
  return { item, pagination: collectionPage(extensions, `/${item.slug}`, await searchParams) };
}
export async function generateMetadata(props: Props) {
  const { item, pagination } = await details(props);
  return pageMetadata({ title: `${item.title}${pagination.page > 1 ? ` – Page ${pagination.page}` : ""}`, description: item.metaDescription || item.intro, path: pagination.path, image: pagination.items[0]?.coverImage, index: pagination.index });
}
export default async function Page(props: Props) {
  const { item, pagination } = await details(props);
  const scoped = collectionCatalog(await getCatalog(), pagination.items, { landing: item.slug });
  const path = pagination.path;
  return <><JsonLd data={collectionSchema(item.title, path, pagination.items.map(extension => ({ name: extension.name, path: `/extension/${extension.slug}` })))} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Magento 2 Extensions", path: "/extensions" }, { name: item.title, path }])} /><CatalogProvider catalog={scoped}><View total={pagination.total} /></CatalogProvider><CollectionPagination basePath={pagination.basePath} page={pagination.page} pages={pagination.pages} /></>;
}
