import { getCatalog } from "@/lib/catalog.server";
import View from "@/views/blog-slug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
type Props = {params:Promise<{slug:string}>};
async function details(props:Props) {
 const { slug:slug } = await props.params;
 const catalog = await getCatalog();
 const item = catalog.blogPosts.find(i => i.slug === slug);
 if (!item) notFound();
 return {title:`${item.title} — pubsetup.com`, description:item.excerpt};
}
export async function generateMetadata(props:Props):Promise<Metadata> {
 const item = await details(props);
 const { slug:slug } = await props.params;
 const url = "/blog/"+encodeURIComponent(slug);
 return {...item,alternates:{canonical:url},openGraph:{...item,url}};
}
export default async function Page(props:Props) { await details(props); return <View/>; }
