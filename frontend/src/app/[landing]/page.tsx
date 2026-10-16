import { getCatalog } from "@/lib/catalog.server";
import View from "@/views/landing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
type Props = {params:Promise<{landing:string}>};
async function details(props:Props) {
 const { landing:slug } = await props.params;
 const catalog = await getCatalog();
 const item = catalog.seoLandings.find(i => i.slug === slug);
 if (!item) notFound();
 return {title:`${item.title} — pubsetup.com`, description:item.metaDescription};
}
export async function generateMetadata(props:Props):Promise<Metadata> {
 const item = await details(props);
 const { landing:slug } = await props.params;
 const url = "/"+encodeURIComponent(slug);
 return {...item,alternates:{canonical:url},openGraph:{...item,url}};
}
export default async function Page(props:Props) { await details(props); return <View/>; }
