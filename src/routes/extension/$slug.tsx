import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, ExternalLink, Check, ArrowLeft, Zap, BookOpen } from "lucide-react";
import { useExtension, usePartner, useCategory, useCatalog } from "@/data/catalog";
import { tagSlug } from "@/lib/slug";

export const Route = createFileRoute("/extension/$slug")({
  head: () => ({
    meta: [
      { title: "Magento 2 extension — pubsetup.com" },
      { name: "description", content: "Magento 2 extension details, pricing, features and Hyvä compatibility." },
    ],
  }),
  component: ExtensionPage,
});

function ExtensionPage() {
  const { slug } = Route.useParams();
  const { isLoading } = useCatalog();
  const ext = useExtension(slug);
  const partner = usePartner(ext?.partnerId);
  const category = useCategory(ext?.categoryId);

  if (isLoading) {
    return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!ext || !partner || !category) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Extension not found</h1>
        <Link to="/extensions" className="mt-4 inline-block text-primary">Back to catalog</Link>
      </div>
    );
  }

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-10">
          <Link to="/extensions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-primary shadow-soft">
              {partner.logoLetter}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">{partner.name}</span>
                <span className="text-muted-foreground">·</span>
                <Link to="/category/$slug" params={{ slug: category.slug }} className="text-muted-foreground hover:text-foreground">
                  {category.name}
                </Link>
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{ext.name}</h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">{ext.shortDescription}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-warning text-warning" />{ext.rating} ({ext.reviews} reviews)</span>
                {ext.recommended && <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Recommended</span>}
                {ext.bestSeller && <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">Best seller</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {ext.tags.map((t: string) => (
                  <Link key={t} to="/tag/$slug" params={{ slug: tagSlug(t) }} className="rounded-md bg-card px-2 py-1 text-xs font-medium text-muted-foreground shadow-soft hover:bg-accent hover:text-accent-foreground">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr,360px]">
          <div className="space-y-10">
            {ext.coverImage && (
              <img src={ext.coverImage} alt={ext.name} className="w-full rounded-2xl border border-border object-cover" loading="lazy" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">About this extension</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{ext.description}</p>
            </div>

            {ext.gallery.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground">Screenshots</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ext.gallery.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border bg-card">
                      <img src={url} alt="" className="aspect-video w-full object-cover transition hover:scale-105" loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-foreground">Key features</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {ext.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Specifications</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Spec label="Magento versions" value={ext.magentoVersions.join(", ")} />
                <Spec label="Edition" value={ext.edition === "both" ? "Open Source & Commerce" : ext.edition} />
                <Spec label="Hyvä compatible" value={ext.hyvaCompatible ? "Yes" : "No"} />
                <Spec label="PWA ready" value={ext.pwaReady ? "Yes" : "No"} />
                <Spec label="License" value={ext.priceType === "free" ? "Free" : ext.priceType} />
                <Spec label="Support" value={ext.supportMonths ? `${ext.supportMonths} months` : "—"} />
                <Spec label="Install complexity" value={ext.installComplexity} />
                <Spec label="Trial / demo" value={`${ext.hasTrial ? "Trial" : ""}${ext.hasTrial && ext.hasDemo ? " · " : ""}${ext.hasDemo ? "Live demo" : ""}` || "—"} />
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">About {partner.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{partner.description}</p>
              <Link to="/partner/$slug" params={{ slug: partner.slug }} className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
                View all {partner.name} extensions →
              </Link>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partner price</div>
              <div className="mt-1 flex items-baseline gap-1">
                {ext.priceType === "free" ? (
                  <span className="text-3xl font-bold text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">from</span>
                    <span className="text-3xl font-bold text-foreground">${ext.priceFrom}</span>
                  </>
                )}
              </div>
              <a
                href={ext.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="ring-focus mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Buy on Partner Website <ExternalLink className="h-4 w-4" />
              </a>
              {ext.userGuideUrl && (
                <a
                  href={ext.userGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ring-focus mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
                >
                  <BookOpen className="h-4 w-4" /> User Guide
                </a>
              )}
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Affiliate link · we may earn a commission</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-brand-soft p-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <Zap className="h-3 w-3" /> Installation service
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">We can install and configure this extension for you</h3>
              <p className="mt-2 text-sm text-muted-foreground">Composer install, deploy, smoke-test and rollback plan included.</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">€{ext.installPrice}</span>
                <span className="text-sm text-muted-foreground">fixed</span>
              </div>
              <Link
                to="/checkout"
                search={{ service: "install-magento-2-extension", extension: ext.slug }}
                className="ring-focus mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
              >
                Order Installation
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-foreground">{value}</dd>
    </div>
  );
}
