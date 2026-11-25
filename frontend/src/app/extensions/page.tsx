import { CatalogProvider } from "@/data/catalog";
import { collectionCatalog } from "@/lib/page-catalog";
import { CollectionSeo } from "@/components/CollectionSeo";
import { getCatalog } from "@/lib/catalog.server";
import { catalogDefaults, extensionListHref, extensionPage, filteredExtensions, readCatalogSearch } from "@/lib/extension-list";
import { pageMetadata } from "@/lib/seo";
import View from "@/views/extensions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
async function listing(searchParams: Props["searchParams"]) {
  const catalog = await getCatalog();
  const search = readCatalogSearch(await searchParams);
  const pagination = extensionPage(filteredExtensions(catalog.extensions, catalog.partners, search), search.page);
  return { catalog, search, pagination, path: extensionListHref(search, pagination.page) };
}

export async function generateMetadata({ searchParams }: Props) {
  const { search, pagination, path } = await listing(searchParams);
  const filtered = (Object.keys(catalogDefaults) as (keyof typeof catalogDefaults)[]).some(key => key !== "page" && search[key] !== catalogDefaults[key]);
  return pageMetadata({ title: `Magento 2 Extensions Catalog${pagination.page > 1 ? ` – Page ${pagination.page}` : ""}`, description: "Browse curated Magento 2 extensions. Compare features, partner prices, Hyvä compatibility and professional installation options.", path, index: pagination.total > 0 && !filtered && search.page === String(pagination.page) });
}
export default async function Page({ searchParams }: Props) {
  const { catalog, pagination, path } = await listing(searchParams);
  const scoped = collectionCatalog(catalog, pagination.items, { filters: true });
  const allTags = Array.from(new Set(catalog.extensions.flatMap(item => item.tags))).sort();
  return <><CollectionSeo name="Magento 2 Extensions Catalog" path={path} items={pagination.items.map(item => ({ name: item.name, path: `/extension/${item.slug}` }))} /><CatalogProvider catalog={scoped}><View pagination={{ ...pagination, items: scoped.extensions }} totalExtensions={catalog.extensions.length} allTags={allTags} /></CatalogProvider></>;
}
