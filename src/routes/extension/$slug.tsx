import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, ExternalLink, Check, Zap, BookOpen } from "lucide-react";
import { useExtension, usePartner, useCategory, useCatalog } from "@/data/catalog";
import { tagSlug } from "@/lib/slug";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";

export const Route = createFileRoute("/extension/$slug")({
  loader: async ({ params }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("extensions")
      .select("name, short_description, gallery, cover_image")
      .eq("slug", params.slug)
      .maybeSingle();
    return { ext: data };
  },
  head: ({ loaderData, params }) => {
    const ext = loaderData?.ext as { name?: string; short_description?: string; gallery?: string[]; cover_image?: string } | null;
    const title = ext?.name
      ? `${ext.name} for Magento 2 — pubsetup.com`
      : "Magento 2 extension — pubsetup.com";
    const desc = ext?.short_description
      ? ext.short_description.slice(0, 158)
      : "Magento 2 extension details, pricing, features and Hyvä compatibility.";
    const img = ext?.cover_image || (ext?.gallery && ext.gallery[0]) || "https://pubsetup.com/favicon-512x512.png";
    const url = `https://pubsetup.com/extension/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: img },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ExtensionPage,
});

function ExtensionPage() {
  const { slug } = Route.useParams();
  const { isLoading } = useCatalog();
  const ext = useExtension(slug);
  const partner = usePartner(ext?.partnerId);
  const category = useCategory(ext?.categoryId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (carouselApi && lightboxIndex !== null) {
      carouselApi.scrollTo(lightboxIndex, true);
    }
  }, [carouselApi, lightboxIndex]);

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
        <div className="container-page py-6">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link to="/extensions" className="hover:text-foreground">Magento 2 Extensions</Link>
            <span>/</span>
            <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.name}</Link>
            <span>/</span>
            <span className="truncate text-foreground">{ext.name}</span>
          </nav>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left: gallery */}
          <div>
            {ext.gallery.length > 0 ? (
              <div className="lg:sticky lg:top-24">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-4"
                >
                  <img src={ext.gallery[0]} alt={ext.name} className="max-h-[480px] w-full object-contain" />
                </button>
                {ext.gallery.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {ext.gallery.slice(0, 4).map((url, idx) => (
                      <button
                        type="button"
                        key={url}
                        onClick={() => setLightboxIndex(idx)}
                        className="flex items-center justify-center overflow-hidden rounded-lg border border-border bg-surface p-1"
                      >
                        <img src={url} alt="" className="aspect-video w-full object-contain transition hover:scale-105" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground">
                No screenshots
              </div>
            )}
          </div>

          {/* Right: title, meta, CTAs */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-base font-bold text-primary">
                {partner.logoLetter}
              </div>
              <span className="text-sm font-medium text-muted-foreground">{partner.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {ext.name} <span className="text-xl font-medium text-muted-foreground">for Magento 2</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-warning text-warning" />{ext.rating} ({ext.reviews} reviews)</span>
              {ext.recommended && <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Recommended</span>}
              {ext.bestSeller && <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">Best seller</span>}
            </div>
            <p className="text-base text-muted-foreground">{ext.shortDescription}</p>

            <div className="flex flex-wrap gap-1.5">
              {ext.tags.map((t: string) => (
                <Link key={t} to="/tag/$slug" params={{ slug: tagSlug(t) }} className="rounded-md bg-card px-2 py-1 text-xs font-medium text-muted-foreground shadow-soft hover:bg-accent hover:text-accent-foreground">
                  {t}
                </Link>
              ))}
            </div>

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
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a
                  href={ext.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="ring-focus inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Buy on Partner Website <ExternalLink className="h-4 w-4" />
                </a>
                {ext.userGuideUrl && (
                  <a
                    href={ext.userGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ring-focus inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface"
                  >
                    <BookOpen className="h-4 w-4" /> User Guide
                  </a>
                )}
              </div>
              
            </div>

            <div className="rounded-2xl border border-primary/20 bg-brand-soft p-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <Zap className="h-3 w-3" /> Installation service
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">We can install and configure this extension for you</h3>
              <p className="mt-2 text-sm text-muted-foreground">Composer install, deploy, smoke-test and rollback plan included.</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">${ext.installPrice}</span>
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
          </div>
        </div>

        {/* Details below */}
        <div className="mt-14 grid gap-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">About this extension</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{ext.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">Key features</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
          <Carousel setApi={setCarouselApi} opts={{ loop: true, startIndex: lightboxIndex ?? 0 }} className="w-full">
            <CarouselContent>
              {ext.gallery.map((url) => (
                <CarouselItem key={url} className="flex items-center justify-center">
                  <img src={url} alt="" className="max-h-[80vh] w-auto rounded-lg object-contain" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 bg-background/80" />
            <CarouselNext className="right-2 bg-background/80" />
          </Carousel>
        </DialogContent>
      </Dialog>
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
