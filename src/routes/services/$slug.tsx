import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Clock, ArrowRight } from "lucide-react";
import { findService, services } from "@/data/mock";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = findService(params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.service;
    if (!s) return { meta: [{ title: "Service not found" }] };
    return {
      meta: [
        { title: `${s.name} — €${s.price} | implement.it` },
        { name: "description", content: s.description },
        { property: "og:title", content: s.name },
        { property: "og:description", content: s.description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-2xl font-bold">Service not found</h1>
      <Link to="/services" className="mt-4 inline-block text-primary">Back to services</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-page py-20 text-center"><h1 className="text-2xl font-bold">Error</h1><p className="text-muted-foreground">{error.message}</p></div>
  ),
  component: ServicePage,
});

function ServicePage() {
  const { service } = Route.useLoaderData();
  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <section className="bg-hero border-b border-border">
        <div className="container-page py-14">
          <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground">← All services</Link>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">{service.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{service.description}</p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr,360px]">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold">What's included</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {service.includes.map((it: string) => (
                  <li key={it} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{it}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Process</h2>
              <ol className="mt-4 space-y-3">
                {["You submit the order with project details", "We confirm scope and request access", "Work is delivered on the agreed timeline", "Handover with documentation"].map((step, i) => (
                  <li key={step} className="flex gap-3 rounded-lg border border-border bg-card p-4 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-primary">{i + 1}</span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fixed price</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">€{service.price}</span>
                <span className="text-sm text-muted-foreground">{service.unit ?? "one-time"}</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {service.duration}
              </div>
              <Link
                to="/checkout"
                search={{ service: service.slug }}
                className="ring-focus mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Order Service <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">Other services</h3>
              <ul className="mt-3 space-y-2">
                {others.map((s) => (
                  <li key={s.id}>
                    <Link to="/services/$slug" params={{ slug: s.slug }} className="flex items-center justify-between text-sm hover:text-primary">
                      <span>{s.name}</span><span className="text-muted-foreground">€{s.price}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
