import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExtensionCard } from "@/components/ExtensionCard";
import { extensions, allTags } from "@/data/mock";
import { tagFromSlug } from "@/lib/slug";

export const Route = createFileRoute("/tag/$slug")({
  loader: ({ params }) => {
    const tag = tagFromSlug(params.slug, allTags);
    if (!tag) throw notFound();
    const list = extensions.filter((e) => e.tags.includes(tag));
    return { tag, list };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.tag;
    if (!t) return { meta: [{ title: "Tag not found" }] };
    return {
      meta: [
        { title: `${t} Magento 2 Extensions — implement.it` },
        { name: "description", content: `Browse Magento 2 extensions tagged "${t}". Curated and reviewed by experts.` },
        { property: "og:title", content: `${t} Magento 2 Extensions` },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center"><h1 className="text-2xl font-bold">Tag not found</h1><Link to="/extensions" className="mt-4 inline-block text-primary">Back to catalog</Link></div>
  ),
  errorComponent: ({ error }) => <div className="container-page py-20 text-center">{error.message}</div>,
  component: TagPage,
});

function TagPage() {
  const { tag, list } = Route.useLoaderData();
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tag</span>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-foreground md:text-5xl">{tag}</h1>
          <p className="mt-2 text-muted-foreground">{list.length} extensions match this tag.</p>
        </div>
      </section>
      <section className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <ExtensionCard key={e.id} ext={e} />)}
        </div>
      </section>
    </>
  );
}
