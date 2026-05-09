import { createFileRoute, Link } from "@tanstack/react-router";
import { ExtensionCard } from "@/components/ExtensionCard";
import { usePartner, useExtensions, useCatalog } from "@/data/catalog";

export const Route = createFileRoute("/partner/$slug")({
  loader: async ({ params }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("partners")
      .select("name, description")
      .eq("slug", params.slug)
      .maybeSingle();
    return { partner: data };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.partner as { name?: string; description?: string } | null;
    const title = p?.name ? `${p.name} Magento 2 extensions — pubsetup.com` : "Partner — pubsetup.com";
    const desc = p?.description?.slice(0, 158) || `Browse Magento 2 extensions from ${p?.name ?? "trusted partners"}.`;
    const url = `https://pubsetup.com/partner/${params.slug}`;
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
  component: PartnerPage,
});

function PartnerPage() {
  const { slug } = Route.useParams();
  const { isLoading } = useCatalog();
  const partner = usePartner(slug);
  const all = useExtensions();
  if (isLoading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  if (!partner) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Partner not found</h1>
        <Link to="/extensions" className="mt-4 inline-block text-primary">Back</Link>
      </div>
    );
  }
  const list = all.filter((e) => e.partnerId === partner.id);
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-5 py-12 md:flex-row md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-primary shadow-soft">
            {partner.logoLetter}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{partner.name}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{partner.description}</p>
            {partner.website && <a href={partner.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary">Visit website ↗</a>}
          </div>
        </div>
      </section>
      <section className="container-page py-10">
        <p className="mb-6 text-sm text-muted-foreground">{list.length} extensions by {partner.name}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <ExtensionCard key={e.id} ext={e} />)}
        </div>
      </section>
    </>
  );
}
