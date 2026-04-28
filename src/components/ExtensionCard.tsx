import { Link } from "@tanstack/react-router";
import { Star, Check, X, Zap, ExternalLink } from "lucide-react";
import type { Extension } from "@/data/types";
import { findPartner, findCategory } from "@/data/mock";
import { useCompare } from "@/state/compare";

function formatPrice(e: Extension) {
  if (e.priceType === "free") return "Free";
  return `from $${e.priceFrom}`;
}

export function ExtensionCard({ ext }: { ext: Extension }) {
  const partner = findPartner(ext.partnerId);
  const category = findCategory(ext.categoryId);
  const { items, toggle } = useCompare();
  const inCompare = items.includes(ext.slug);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start gap-3 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-primary">
          {partner.logoLetter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{partner.name}</span>
            <span className="text-muted-foreground">·</span>
            <Link
              to="/category/$slug"
              params={{ slug: category.slug }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
          </div>
          <Link
            to="/extension/$slug"
            params={{ slug: ext.slug }}
            className="mt-1 block truncate text-base font-semibold text-foreground hover:text-primary"
          >
            {ext.name}
          </Link>
        </div>
        {ext.recommended && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
            <Check className="h-3 w-3" /> Recommended
          </span>
        )}
      </div>

      <p className="px-5 text-sm leading-relaxed text-muted-foreground">{ext.shortDescription}</p>

      <div className="mt-4 flex flex-wrap gap-1.5 px-5">
        {ext.tags.slice(0, 4).map((t) => (
          <Link
            key={t}
            to="/tag/$slug"
            params={{ slug: t.toLowerCase().replace(/\s+/g, "-") }}
            className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border px-5 py-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-medium text-foreground">{ext.rating}</span>
          <span className="text-muted-foreground">({ext.reviews})</span>
        </div>
        <div className="text-sm font-semibold text-foreground">{formatPrice(ext)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 pb-5">
        <a
          href={ext.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ring-focus inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          View Partner Offer <ExternalLink className="h-3 w-3" />
        </a>
        <Link
          to="/checkout"
          search={{ service: "install-magento-2-extension", extension: ext.slug }}
          className="ring-focus inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface"
        >
          <Zap className="h-3 w-3" /> Order Installation
        </Link>
      </div>

      <button
        onClick={() => toggle(ext.slug)}
        className="ring-focus border-t border-border px-5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
      >
        {inCompare ? (
          <span className="inline-flex items-center gap-1 text-primary"><X className="h-3 w-3" /> Remove from compare</span>
        ) : (
          "+ Add to compare"
        )}
      </button>
    </article>
  );
}
