"use client";

import { Link } from "@/components/Link";
import { useCategory, usePartner, useServices } from "@/data/catalog";
import type { Extension } from "@/data/types";
import { tagSlug } from "@/lib/slug";
import { useCompare } from "@/state/compare";
import { BookOpen, Check, ExternalLink, Plus, Star, X, Zap } from "lucide-react";

function formatPrice(extension: Extension) {
  return extension.priceType === "free" ? "Free" : `from $${extension.priceFrom}`;
}

export function ExtensionCard({ ext }: { ext: Extension }) {
  const partner = usePartner(ext.partnerId);
  const category = useCategory(ext.categoryId);
  const services = useServices();
  const installation = services.find(service => ["install-magento-2-extension", "extension-installation"].includes(service.slug));
  const { items, toggle } = useCompare();
  const inCompare = items.includes(ext.slug);
  const cover = ext.coverImage || ext.gallery[0];

  return (
    <article data-testid="extension-card" className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-card">
      {cover && (
        <a href={`/go/module/${encodeURIComponent(ext.slug)}`} className="block aspect-video w-full overflow-hidden bg-surface" aria-label={`View ${ext.name}`}>
          <img src={cover} alt={ext.name} loading="lazy" width={960} height={540} className="h-full w-full object-cover object-top transition duration-300 motion-safe:group-hover:scale-[1.02]" />
        </a>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-sm font-bold text-primary" aria-hidden="true">{partner?.logoLetter}</div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="shrink-0">{partner?.name ?? "Partner"}</span><span aria-hidden="true">·</span>
              {category && <Link to="/category/$slug" params={{ slug: category.slug }} className="truncate hover:text-foreground">{category.name}</Link>}
            </div>
            <h2 className="mt-2 truncate text-base font-semibold text-foreground"><a href={`/go/module/${encodeURIComponent(ext.slug)}`} className="hover:text-primary" title={ext.name}>{ext.name}</a></h2>
          </div>
        </div>
        <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{ext.shortDescription}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {ext.tags.slice(0, 4).map(tag => <Link key={tag} to="/tag/$slug" params={{ slug: tagSlug(tag) }} className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">{tag}</Link>)}
        </div>
        {ext.recommended && <div className="mt-3"><span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success ring-1 ring-success/20"><Check className="h-3 w-3"/> Recommended</span></div>}
        {ext.userGuideUrl && <a href={ext.userGuideUrl} target="_blank" rel="noopener noreferrer" className="ring-focus mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm text-xs font-medium text-primary hover:underline" aria-label={`Read README for ${ext.name}`}><BookOpen className="h-3.5 w-3.5"/> README <ExternalLink className="h-3 w-3"/></a>}
      </div>
      <div className="border-t border-border px-5 pb-5 pt-3">
        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            {ext.reviews > 0 ? <><Star className="h-4 w-4 fill-warning text-warning"/><span className="font-medium">{ext.rating}</span><span className="text-muted-foreground">({ext.reviews})</span></> : <span className="text-xs text-muted-foreground">No reviews yet</span>}
          </div>
          <span className="font-semibold text-foreground">{formatPrice(ext)}</span>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[370px]:grid-cols-2">
          <a href={`/go/affiliate/${encodeURIComponent(ext.slug)}`} target="_blank" rel="noopener noreferrer sponsored" className="ring-focus inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-primary px-2 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover">View Partner Offer <ExternalLink className="h-3 w-3"/></a>
          <Link to={installation ? "/checkout" : "/services"} search={installation ? {service: installation.slug, extension: ext.slug} : undefined} className="ring-focus inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-border bg-background px-2 py-2 text-xs font-semibold text-foreground transition hover:bg-surface"><Zap className="h-3 w-3"/> Order Installation</Link>
        </div>
      </div>
      <button type="button" onClick={() => toggle(ext.slug)} aria-pressed={inCompare} className="ring-focus inline-flex min-h-11 items-center justify-center gap-1 border-t border-border px-5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground">{inCompare ? <X className="h-3 w-3"/> : <Plus className="h-3 w-3"/>}{inCompare ? "Remove from compare" : "Add to compare"}</button>
    </article>
  );
}
