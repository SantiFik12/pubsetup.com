import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog.server";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import { articleSchema } from "@/lib/structured-data";
import View from "@/views/blog-slug";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
async function details({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const item = catalog.blogPosts.find(post => post.slug === slug);
  if (!item) notFound();
  return item;
}
export async function generateMetadata(props: Props) {
  const item = await details(props);
  return pageMetadata({ title: `${item.title}`, description: item.excerpt, path: `/blog/${item.slug}`, image: item.cover, article: true });
}
export default async function Page(props: Props) {
  const item = await details(props);
  return <><JsonLd data={articleSchema(item)} /><JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: item.title, path: `/blog/${item.slug}` }])} /><View /></>;
}
