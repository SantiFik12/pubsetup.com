"use client";
import { ExtensionCard } from "@/components/ExtensionCard";
import { Link } from "@/components/Link";
import { useCatalog,useCategories,useExtensions,useSeoLanding } from "@/data/catalog";
import { useParams } from "next/navigation";



export default function LandingPage() {
  const { landing: slug } = useParams<{ slug: string; landing: string }>();
  const { isLoading } = useCatalog();
  const landing = useSeoLanding(slug);
  const exts = useExtensions();
  const categories = useCategories();
  if (isLoading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  if (!landing) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary">Home</Link>
      </div>
    );
  }
  let list = exts.slice();
  const f = landing.filter;
  if (f.categorySlug) {
    const cat = categories.find((c) => c.slug === f.categorySlug);
    if (cat) list = list.filter((e) => e.categoryId === cat.id);
  }
  if (f.tag) list = list.filter((e) => e.tags.includes(f.tag!));
  if (f.hyvaCompatible) list = list.filter((e) => e.hyvaCompatible);
  if (typeof f.priceMax === "number") list = list.filter((e) => e.priceFrom <= f.priceMax!);
  return (
    <>
      <section className="border-b border-border bg-hero">
        <div className="container-page max-w-3xl py-14">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">{landing.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{landing.intro}</p>
        </div>
      </section>
      <section className="container-page py-10">
        <p className="mb-6 text-sm text-muted-foreground">{list.length} extensions</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <ExtensionCard key={e.id} ext={e} />)}
        </div>
      </section>
    </>
  );
}
