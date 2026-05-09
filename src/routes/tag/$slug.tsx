import { createFileRoute, Link } from "@tanstack/react-router";
import { ExtensionCard } from "@/components/ExtensionCard";
import { useExtensions, useAllTags, useCatalog } from "@/data/catalog";
import { tagFromSlug } from "@/lib/slug";

export const Route = createFileRoute("/tag/$slug")({
  head: ({ params }) => {
    const tag = decodeURIComponent(params.slug).replace(/-/g, " ");
    const title = `Magento 2 extensions tagged "${tag}" — pubsetup.com`;
    const desc = `Browse Magento 2 extensions tagged "${tag}" from trusted partners.`;
    const url = `https://pubsetup.com/tag/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: TagPage,
});

function TagPage() {
  const { slug } = Route.useParams();
  const { isLoading } = useCatalog();
  const tags = useAllTags();
  const exts = useExtensions();
  if (isLoading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  const tag = tagFromSlug(slug, tags);
  if (!tag) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Tag not found</h1>
        <Link to="/extensions" className="mt-4 inline-block text-primary">Back to catalog</Link>
      </div>
    );
  }
  const list = exts.filter((e) => e.tags.includes(tag));
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
