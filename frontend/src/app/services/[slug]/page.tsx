import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { canonicalServiceSlug } from "@/lib/service-routes";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import { serviceSchema } from "@/lib/structured-data";
import View from "@/views/services-slug";
import { notFound, permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
async function details({ params }: Props) {
  const { slug } = await params;
  const canonical = canonicalServiceSlug(slug);
  if (slug !== canonical) permanentRedirect(`/services/${canonical}`);
  const catalog = await getCatalog();
  const item = catalog.services.find(service => service.slug === canonical);
  if (!item) notFound();
  return item;
}
export async function generateMetadata(props: Props) {
  const item = await details(props);
  return pageMetadata({ title: `${item.name} — pubsetup.com`, description: item.description, path: `/services/${item.slug}` });
}
export default async function Page(props: Props) {
  const item = await details(props);
  return <><JsonLd data={serviceSchema(item)} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: item.name, path: `/services/${item.slug}` }])} /><View /></>;
}
