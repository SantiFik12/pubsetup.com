import { CollectionSeo } from "@/components/CollectionSeo";
import { ExtensionCard } from "@/components/ExtensionCard";
import { Link } from "@/components/Link";
import { getCatalog } from "@/lib/catalog.server";
import { featuredExtensions } from "@/lib/featured";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const catalog = await getCatalog();
  const featured = featuredExtensions(catalog.extensions);
  return pageMetadata({ title: "Featured Magento 2 Extensions — pubsetup.com", description: "Explore the six most-viewed Magento 2 extensions in our catalog. Compare features, partner prices and professional installation options.", path: "/category/featured", image: featured[0]?.coverImage, index: featured.length > 0 });
}

export default async function Page() {
  const catalog = await getCatalog();
  const featured = featuredExtensions(catalog.extensions);
  return <>
    <CollectionSeo name="Featured extensions" path="/category/featured" items={featured.map(item => ({ name: item.name, path: `/extension/${item.slug}` }))} />
    <section className="border-b border-border bg-surface"><div className="container-page py-12">
      <Link to="/extensions" className="text-sm text-muted-foreground hover:text-foreground">← All extensions</Link>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">Featured extensions</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Explore the most-viewed Magento 2 modules in our catalog.</p>
    </div></section>
    <section className="container-page py-10">
      {featured.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map(item => <ExtensionCard key={item.id} ext={item} />)}</div> : <p className="text-muted-foreground">Extensions will appear here as they are added to the catalog.</p>}
    </section>
  </>;
}
