import { JsonLd } from "@/components/JsonLd";
import { breadcrumbs, collectionSchema } from "@/lib/seo";

export function CollectionSeo({ name, path, items }: { name: string; path: string; items: { name: string; path: string }[] }) {
  return <><JsonLd data={collectionSchema(name, path, items)} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name, path }])} /></>;
}
