import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExtensionCard } from "@/components/ExtensionCard";
import { categories, extensions, findCategory } from "@/data/mock";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    const list = extensions.filter((e) => e.categoryId === cat.id);
    return { cat, list };
  },
  head: ({ loaderData }) => {
    const cat = loaderData?.cat;
    if (!cat) return { meta: [{ title: "Category not found" }] };
    return {
      meta: [
        { title: `${cat.name} Extensions for Magento 2 — implement.it` },
        { name: "description", content: `${cat.description} Browse the best ${cat.name} extensions for Magento 2 from trusted partners.` },
        { property: "og:title", content: `${cat.name} Magento 2 Extensions` },
        { property: "og:description", content: cat.description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Category not found</h1>
      <Link to="/extensions" className="mt-4 inline-block text-primary">Back to catalog</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-page py-20 text-center"><h1 className="text-2xl font-bold">Error</h1><p>{error.message}</p></div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, list } = Route.useLoaderData();
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12">
          <Link to="/extensions" className="text-sm text-muted-foreground hover:text-foreground">← All extensions</Link>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">{cat.name} extensions for Magento 2</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{cat.description}</p>
        </div>
      </section>
      <section className="container-page py-10">
        <p className="mb-6 text-sm text-muted-foreground">{list.length} extensions in this category</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <ExtensionCard key={e.id} ext={e} />)}
        </div>
      </section>
    </>
  );
}
