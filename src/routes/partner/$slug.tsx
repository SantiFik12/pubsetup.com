import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExtensionCard } from "@/components/ExtensionCard";
import { extensions, partners } from "@/data/mock";

export const Route = createFileRoute("/partner/$slug")({
  loader: ({ params }) => {
    const partner = partners.find((p) => p.slug === params.slug);
    if (!partner) throw notFound();
    const list = extensions.filter((e) => e.partnerId === partner.id);
    return { partner, list };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.partner;
    if (!p) return { meta: [{ title: "Partner not found" }] };
    return {
      meta: [
        { title: `${p.name} Magento 2 Extensions — implement.it` },
        { name: "description", content: p.description },
        { property: "og:title", content: `${p.name} Magento 2 Extensions` },
      ],
    };
  },
  notFoundComponent: () => <div className="container-page py-20 text-center"><h1 className="text-2xl font-bold">Partner not found</h1><Link to="/extensions" className="mt-4 inline-block text-primary">Back</Link></div>,
  errorComponent: ({ error }) => <div className="container-page py-20 text-center">{error.message}</div>,
  component: PartnerPage,
});

function PartnerPage() {
  const { partner, list } = Route.useLoaderData();
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
            <a href={partner.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary">Visit website ↗</a>
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
