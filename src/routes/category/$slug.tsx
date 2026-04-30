import { createFileRoute, Link } from "@tanstack/react-router";
import { ExtensionCard } from "@/components/ExtensionCard";
import { useCategory, useExtensions, useCatalog } from "@/data/catalog";

export const Route = createFileRoute("/category/$slug")({
  head: () => ({
    meta: [
      { title: "Magento 2 Extensions Category — pubsetup.com" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { isLoading } = useCatalog();
  const cat = useCategory(slug);
  const all = useExtensions();
  if (isLoading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  if (!cat) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <Link to="/extensions" className="mt-4 inline-block text-primary">Back to catalog</Link>
      </div>
    );
  }
  const list = all.filter((e) => e.categoryId === cat.id);
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
