import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ShoppingCart, Zap, FileText, Shield, RefreshCw, Palette, Boxes, Sparkles } from "lucide-react";
import { ExtensionCard } from "@/components/ExtensionCard";
import { useExtensions } from "@/data/catalog";
import magentoDemoPreview from "@/assets/magento-demo-preview.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "pubsetup.com — Magento 2 extensions catalog & expert services" },
      { name: "description", content: "Find the best Magento 2 extensions from trusted partners and get them installed by experts. Curated catalog, transparent pricing, professional services." },
      { property: "og:title", content: "pubsetup.com — Magento 2 extensions catalog" },
      { property: "og:description", content: "Find the best Magento 2 extensions and get them installed by experts." },
    ],
  }),
  component: HomePage,
});

const featureServices = [
  { icon: Boxes, title: "Magento 2 installation from scratch", body: "A clean, fully tuned production install on your server." },
  { icon: Zap, title: "Extension installation", body: "Composer install, deploy, smoke-test and rollback plan." },
  { icon: RefreshCw, title: "Performance optimization", body: "Sub-second pages with Varnish, Redis, OpenSearch." },
  { icon: Palette, title: "Theme setup", body: "Luma, Hyvä or custom theme — installed and configured." },
  { icon: Shield, title: "Security patches", body: "Magento and infrastructure patches with zero downtime." },
  { icon: RefreshCw, title: "Magento & server updates", body: "Stay on supported versions of Magento and your stack." },
];

const stack = [
  "Hestia Control Panel — easy server management",
  "phpMyAdmin — database management interface",
  "PHP-FPM — optimized PHP processing",
  "OpenSearch — lightning-fast product search",
  "Nginx + Apache — optimized dual web server",
  "Redis — high-speed session & cache",
  "Varnish — full page cache for instant loads",
];

function HomePage() {
  const extensions = useExtensions();
  const featured = extensions.filter((e) => e.recommended).slice(0, 6);
  return (
    <>
      {/* HERO */}
      <section className="bg-hero relative overflow-hidden">
        <div className="container-page relative py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Trusted by Magento 2 merchants worldwide
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Find the best Magento 2 extensions and get them <span className="text-primary">installed by experts</span>
            </h1>
            <p className="mt-5 text-balance text-lg text-muted-foreground">
              A curated catalog of proven Magento 2 modules from trusted partners — paired with on-demand installation, optimization and migration services.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/extensions"
                className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-hover"
              >
                Browse Extensions <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services/$slug"
                params={{ slug: "magento-2-setup-from-scratch" }}
                className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-soft transition hover:bg-surface"
              >
                Get Magento 2 Setup
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Independent reviews</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Transparent pricing</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Magento-certified team</span>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO BLOCK */}
      <section className="container-page py-10 md:py-12">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Live demo
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">See an optimized Magento 2 store, live.</h2>
              <p className="mt-3 text-muted-foreground">
                We deploy a fresh Magento 2 install with Hyvä-ready Luma theme on a tuned stack — Varnish, Redis, OpenSearch, PHP-FPM. Open the live demo and run your own Lighthouse.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://magento.pubsetup.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Open magento.pubsetup.com ↗
                </a>
                <Link
                  to="/services/$slug"
                  params={{ slug: "magento-2-setup-from-scratch" }}
                  className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
                >
                  Get the same setup
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-center gap-1.5 border-b border-border bg-card px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
                <span className="ml-3 text-xs text-muted-foreground">magento.pubsetup.com</span>
              </div>
              <div className="space-y-3 p-5">
                <div className="h-8 w-2/3 rounded-md bg-card shadow-soft" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[4/5] rounded-lg bg-card shadow-soft" />
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-card p-3 shadow-soft">
                  <div className="space-y-1.5">
                    <div className="h-2 w-24 rounded bg-muted" />
                    <div className="h-2 w-16 rounded bg-muted" />
                  </div>
                  <div className="h-7 w-20 rounded-md bg-primary/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED EXTENSIONS */}
      {featured.length > 0 && (
        <section className="container-page py-10 md:py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Recommended extensions</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked by our team — proven on real client stores.</p>
            </div>
            <Link to="/extensions" className="hidden text-sm font-semibold text-primary hover:text-primary-hover sm:inline-flex">
              View all extensions →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <ExtensionCard key={e.id} ext={e} />
            ))}
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="bg-surface">
        <div className="container-page py-10 md:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Magento 2 services, fixed pricing</h2>
            <p className="mt-2 text-muted-foreground">No retainers, no hidden fees. Pick a service and we'll get to work.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureServices.map((s) => (
              <div key={s.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/services" className="text-sm font-semibold text-primary hover:text-primary-hover">
              See all services & pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* SPECIAL OFFER */}
      <section className="container-page py-10 md:py-14">
        <div className="overflow-hidden rounded-3xl border border-border bg-brand-gradient text-primary-foreground shadow-glow">
          <div className="grid gap-10 p-8 md:grid-cols-5 md:p-14">
            <div className="md:col-span-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3 w-3" /> Special offer
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">A ready-made Magento 2 online store</h2>
              <p className="mt-3 text-base text-white/80">
                Production-grade Magento 2 deployed on a tuned server stack — everything you need to start selling.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
                {stack.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start justify-center rounded-2xl bg-white/10 p-6 backdrop-blur md:col-span-2">
              <div className="text-xs font-medium uppercase tracking-wider text-white/70">Fixed price</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-bold">$300</span>
                <span className="text-sm text-white/70">one-time</span>
              </div>
              <p className="mt-3 text-sm text-white/80">Delivered in 3–5 business days. Includes documentation and a handover call.</p>
              <Link
                to="/checkout"
                search={{ service: "magento-2-setup-from-scratch" }}
                className="ring-focus mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-white/90"
              >
                Order a ready-made online store <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
