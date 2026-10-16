import { getCatalog } from "@/lib/catalog.server";
import View from "@/views/category-slug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
type Props = {params:Promise<{slug:string}>};
async function details(props:Props) {
 const { slug:slug } = await props.params;
 const catalog = await getCatalog();
 const item = catalog.categories.find(i => i.slug === slug);
 if (!item) notFound();
 return {title:`${item.name} — pubsetup.com`, description:item.description};
}
export async function generateMetadata(props:Props):Promise<Metadata> {
 const item = await details(props);
 const { slug:slug } = await props.params;
 const url = "/category/"+encodeURIComponent(slug);
 return {...item,alternates:{canonical:url},openGraph:{...item,url}};
}
export default async function Page(props:Props) { await details(props); return <View/>; }
