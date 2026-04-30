import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Check, ArrowRight } from "lucide-react";
import { useServices } from "@/data/catalog";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Magento 2 Services — Installation, Optimization, Migration | pubsetup.com" },
      { name: "description", content: "Fixed-price Magento 2 services: installation from scratch, extension installation, security patches, speed optimization, migration consulting." },
      { property: "og:title", content: "Magento 2 Services" },
      { property: "og:description", content: "Fixed-price Magento 2 installation, optimization and migration services." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const services = useServices();
  return (
    <>
      <section className="bg-hero">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">Magento 2 services with fixed pricing</h1>
            <p className="mt-4 text-balance text-lg text-muted-foreground">
              No retainers, no surprises. Pick a service and we'll deliver on time, every time.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article key={s.id} className={`flex flex-col rounded-2xl border bg-card p-6 shadow-soft transition hover:shadow-card ${s.featured ? "border-primary/40 ring-1 ring-primary/30" : "border-border"}`}>
              {s.featured && (
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold text-foreground">{s.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>

              <ul className="mt-5 space-y-1.5 text-sm">
                {s.includes.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> <span className="text-muted-foreground">{it}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {s.duration}
              </div>

              <div className="mt-5 flex items-baseline gap-1.5 border-t border-border pt-5">
                <span className="text-3xl font-bold text-foreground">€{s.price}</span>
                <span className="text-sm text-muted-foreground">{s.unit ?? "fixed"}</span>
              </div>

              <Link
                to="/checkout"
                search={{ service: s.slug }}
                className="ring-focus mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Order Service <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/services/$slug" params={{ slug: s.slug }} className="mt-2 text-center text-xs text-muted-foreground hover:text-foreground">
                Learn more →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
