import { CatalogProvider } from "@/data/catalog";
import { getCatalog } from "@/lib/catalog.server";
import { pageCatalog, type CatalogPageKind } from "@/lib/page-catalog";

export async function CatalogPage({ children, kind = "all", slug }: {
  children: React.ReactNode; kind?: CatalogPageKind; slug?: string;
}) {
  const catalog = pageCatalog(await getCatalog(), kind, slug);
  return <CatalogProvider catalog={catalog}>{children}</CatalogProvider>;
}
