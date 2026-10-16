import { getCatalog } from "@/lib/catalog.server";
import { canonicalServiceSlug } from "@/lib/service-routes";
import View from "@/views/services-slug";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type Props = {params: Promise<{slug: string}>};
async function details(props: Props) {
  const { slug } = await props.params;
  const canonical = canonicalServiceSlug(slug);
  if (slug !== canonical) permanentRedirect(`/services/${canonical}`);
  const catalog = await getCatalog();
  const service = catalog.services.find(item => item.slug === canonical);
  if (!service) notFound();
  return {title: `${service.name} — pubsetup.com`, description: service.description};
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const item = await details(props);
  const { slug } = await props.params;
  const url = `/services/${encodeURIComponent(slug)}`;
  return {...item, alternates: {canonical: url}, openGraph: {...item, url}};
}
export default async function Page(props: Props) { await details(props); return <View/>; }
