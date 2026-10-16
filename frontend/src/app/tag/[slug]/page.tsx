import { getCatalog } from "@/lib/catalog.server";
import { tagSlug } from "@/lib/slug";
import View from "@/views/tag-slug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
type Props = {params:Promise<{slug:string}>};
async function details(props:Props) {
 const { slug:slug } = await props.params;
 const catalog = await getCatalog();
 const item = catalog.extensions.flatMap(e => e.tags).find(t => tagSlug(t) === slug);
 if (!item) notFound();
 return {title:`Magento 2 extensions tagged "${item}" — pubsetup.com`, description:`Browse Magento 2 extensions tagged "${item}".`};
}
export async function generateMetadata(props:Props):Promise<Metadata> {
 const item = await details(props);
 const { slug:slug } = await props.params;
 const url = "/tag/"+encodeURIComponent(slug);
 return {...item,alternates:{canonical:url},openGraph:{...item,url}};
}
export default async function Page(props:Props) { await details(props); return <View/>; }
