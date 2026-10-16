"use client";

import { Link } from "@/components/Link";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCategory, useExtension, usePartner, useServices } from "@/data/catalog";
import { tagSlug } from "@/lib/slug";
import { BookOpen, Check, ExternalLink, Star, ZoomIn, Zap } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExtensionPage() {
  const { slug } = useParams<{ slug: string }>();
  const ext = useExtension(slug);
  const partner = usePartner(ext?.partnerId);
  const category = useCategory(ext?.categoryId);
  const services = useServices();
  const installation = services.find(service => ["install-magento-2-extension", "extension-installation"].includes(service.slug));
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => { setSelectedImage(0); setLightboxIndex(null); }, [slug]);
  useEffect(() => { if (carouselApi && lightboxIndex !== null) carouselApi.scrollTo(lightboxIndex, true); }, [carouselApi, lightboxIndex]);

  if (!ext || !partner || !category) return null;
  const photos = Array.from(new Set([ext.coverImage, ...ext.gallery].filter(Boolean)));
  const currentImage = Math.min(selectedImage, Math.max(0, photos.length - 1));
  const displayName = ext.name.replace(/\s+for Magento 2$/i, "");

  return (
    <>
      <section className="border-b border-border bg-surface">
        <nav aria-label="Breadcrumb" className="container-page flex flex-wrap items-center gap-2 py-5 text-sm text-muted-foreground">
          <Link to="/extensions" className="hover:text-foreground">Magento 2 Extensions</Link><span aria-hidden="true">/</span>
          <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.name}</Link><span aria-hidden="true">/</span>
          <span className="text-foreground" aria-current="page">{ext.name}</span>
        </nav>
      </section>
      <section className="container-page py-10">
        <div data-testid="extension-detail" className="grid min-w-0 gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            {photos.length > 0 && <div className="lg:sticky lg:top-24">
              <button type="button" onClick={() => setLightboxIndex(currentImage)} aria-label={`Enlarge image ${currentImage + 1} of ${ext.name}`} className="ring-focus group relative block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface">
                <img src={photos[currentImage]} alt={currentImage === 0 ? ext.name : `${ext.name} — screenshot ${currentImage}`} width={960} height={540} className="h-full w-full object-cover object-top"/>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 text-foreground opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><ZoomIn className="h-4 w-4"/></span>
              </button>
              {photos.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3" aria-label="Product screenshots">
                {photos.map((photo, index) => <button type="button" key={photo} onClick={() => setSelectedImage(index)} aria-label={`Show image ${index + 1}`} aria-pressed={index === currentImage} className={`ring-focus overflow-hidden rounded-xl border bg-surface transition ${index === currentImage ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/50"}`}><img src={photo} alt="" width={240} height={135} loading="lazy" className="aspect-video h-full w-full object-cover object-top"/></button>)}
              </div>}
            </div>}
          </div>
          <div className="min-w-0 space-y-5">
            <div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-base font-bold text-primary" aria-hidden="true">{partner.logoLetter}</div><Link to="/partner/$slug" params={{slug:partner.slug}} className="text-sm font-medium text-muted-foreground hover:text-primary">{partner.name}</Link></div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{displayName} <span className="text-xl font-medium text-muted-foreground">for Magento 2</span></h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {ext.reviews > 0 && <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-warning text-warning"/>{ext.rating} ({ext.reviews} reviews)</span>}
              {ext.recommended && <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Recommended</span>}
              {ext.bestSeller && <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">Best seller</span>}
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">{ext.shortDescription}</p>
            <div className="flex flex-wrap gap-1.5">{ext.tags.map(tag => <Link key={tag} to="/tag/$slug" params={{slug:tagSlug(tag)}} className="rounded-full border border-border/50 bg-card px-2 py-1 text-xs font-medium text-muted-foreground shadow-soft hover:bg-accent hover:text-accent-foreground">{tag}</Link>)}</div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partner price</div>
              <div className="mt-1 flex items-baseline gap-1">{ext.priceType === "free" ? <span className="text-3xl font-bold">Free</span> : <><span className="text-sm text-muted-foreground">from</span><span className="text-3xl font-bold">${ext.priceFrom}</span></>}</div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a href={ext.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="ring-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover">Buy on Partner Website <ExternalLink className="h-4 w-4 shrink-0"/></a>
                {ext.userGuideUrl && <a href={ext.userGuideUrl} target="_blank" rel="noopener noreferrer" className="ring-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-surface"><BookOpen className="h-4 w-4"/> User Guide / README</a>}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Partner pricing and license terms apply</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-brand-soft p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"><Zap className="h-3 w-3"/> Installation service</span>
              <h2 className="mt-4 text-lg font-semibold">We can install and configure this extension for you</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Composer install, deploy, smoke-test and rollback plan included.</p>
              <div className="mt-4 flex items-baseline gap-2"><span className="text-3xl font-bold">${ext.installPrice}</span><span className="text-sm text-muted-foreground">fixed</span></div>
              <Link to={installation ? "/checkout" : "/services"} search={installation ? {service:installation.slug,extension:ext.slug} : undefined} className="ring-focus mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"><Zap className="h-4 w-4"/> Order Installation</Link>
            </div>
          </div>
        </div>
        <div className="mt-14 grid gap-10">
          <div><h2 className="text-xl font-semibold">About this extension</h2><p className="mt-3 max-w-5xl whitespace-pre-line leading-relaxed text-muted-foreground">{ext.description}</p></div>
          {ext.features.length > 0 && <div><h2 className="text-xl font-semibold">Key features</h2><ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{ext.features.map(feature => <li key={feature} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success"/><span>{feature}</span></li>)}</ul></div>}
          <div><h2 className="text-xl font-semibold">Specifications</h2><dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Spec label="Magento versions" value={ext.magentoVersions.join(", ")}/><Spec label="Edition" value={ext.edition === "both" ? "Open Source & Commerce" : ext.edition}/><Spec label="Hyvä compatible" value={ext.hyvaCompatible ? "Yes" : "No"}/><Spec label="License" value={ext.priceType === "free" ? "Free" : ext.priceType}/></dl></div>
          <div className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">About {partner.name}</h2><p className="mt-2 text-sm text-muted-foreground">{partner.description}</p><Link to="/partner/$slug" params={{slug:partner.slug}} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">View all {partner.name} extensions →</Link></div>
        </div>
      </section>
      <Dialog open={lightboxIndex !== null} onOpenChange={open => !open && setLightboxIndex(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-5xl border-none bg-background p-3 shadow-pop">
          <DialogTitle className="sr-only">{ext.name} screenshots</DialogTitle><DialogDescription className="sr-only">Browse the product images with the previous and next buttons.</DialogDescription>
          <Carousel setApi={setCarouselApi} opts={{loop:true,startIndex:lightboxIndex ?? 0}} className="w-full"><CarouselContent>{photos.map(photo => <CarouselItem key={photo} className="flex items-center justify-center"><img src={photo} alt={`${ext.name} screenshot`} className="max-h-[80vh] w-auto rounded-lg object-contain"/></CarouselItem>)}</CarouselContent><CarouselPrevious className="left-2 bg-background/90"/><CarouselNext className="right-2 bg-background/90"/></Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Spec({label,value}:{label:string;value:string}) {
  return <div className="rounded-lg border border-border bg-card p-3"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>;
}
