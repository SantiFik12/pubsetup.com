"use client";
import { ExtensionCard } from "@/components/ExtensionCard";
import { Link } from "@/components/Link";
import { useAllTags,useCatalog } from "@/data/catalog";
import { useCatalogSearch } from "@/lib/search";
import { featuredCategory, featuredExtensions } from "@/lib/featured";
import { useCompare } from "@/state/compare";
import * as Select from "@radix-ui/react-select";
import { Check,ChevronDown,ChevronUp,Search,SlidersHorizontal,Star } from "lucide-react";
import { useMemo,useState } from "react";

export default function ExtensionsPage() {
  const [search, navigate] = useCatalogSearch();
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(search.tag || search.hyva || search.pwa || search.price !== "all"));
  const { items: compareItems, clear } = useCompare();
  const { extensions, partners, categories } = useCatalog();
  const allTags = useAllTags();

  const update = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  const filtered = useMemo(() => {
    let list = search.cat === featuredCategory ? featuredExtensions(extensions) : extensions.slice();
    if (search.q) {
      const q = search.q.trim().toLowerCase();
      list = list.filter((e) => [e.name, e.shortDescription, e.description, partners.find((p) => p.id === e.partnerId)?.name, ...e.tags]
        .filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    if (search.cat && search.cat !== featuredCategory) list = list.filter((e) => e.categoryId === search.cat);
    if (search.partner) list = list.filter((e) => e.partnerId === search.partner);
    if (search.tag) list = list.filter((e) => e.tags.includes(search.tag));
    if (search.hyva) list = list.filter((e) => e.hyvaCompatible);
    if (search.pwa) list = list.filter((e) => e.pwaReady);
    if (search.price === "free") list = list.filter((e) => e.priceType === "free");
    if (search.price === "lt300") list = list.filter((e) => e.priceFrom < 300 && e.priceType !== "free");
    if (search.price === "gte300") list = list.filter((e) => e.priceFrom >= 300);

    switch (search.sort) {
      case "newest": list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case "cheapest": list.sort((a, b) => a.priceFrom - b.priceFrom); break;
      case "best-rated": list.sort((a, b) => b.rating - a.rating); break;
      default: list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    }
    return list;
  }, [search, extensions, partners]);

  const clearAll = () =>
    navigate({ search: { q: "", cat: "", partner: "", tag: "", price: "all", hyva: false, pwa: false, sort: "popular" } });

  const advancedCount = Number(search.price !== "all") + Number(search.hyva) + Number(search.pwa) + Number(Boolean(search.tag));
  const hasFilters = Boolean(search.q || search.cat || search.partner || advancedCount);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Magento 2 extensions</h1>
      <p className="mt-2 text-muted-foreground">
        {extensions.length} expert-curated modules from {partners.length} trusted partners. Filter, compare, and install with one click.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 basis-full sm:min-w-52 sm:flex-1 sm:basis-auto">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search extensions, partners, tags"
              placeholder="Search extensions, partners, tags…"
              value={search.q}
              onChange={(e) => update({ q: e.target.value })}
              className="ring-focus h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground"
            />
          </div>
          <FilterSelect label="Category" value={search.cat} onChange={(value) => update({ cat: value })}>
            <FilterOption value="">All categories</FilterOption>
            <FilterOption value={featuredCategory}>Featured extensions</FilterOption>
            {categories.map((c) => <FilterOption key={c.id} value={c.id}>{c.name}</FilterOption>)}
          </FilterSelect>
          <FilterSelect label="Partner" value={search.partner} onChange={(value) => update({ partner: value })}>
            <FilterOption value="">All partners</FilterOption>
            {partners.map((p) => <FilterOption key={p.id} value={p.id}>{p.name}</FilterOption>)}
          </FilterSelect>
          <FilterSelect label="Sort extensions" value={search.sort} onChange={(value) => update({ sort: value })} compact>
            <FilterOption value="popular">Most popular</FilterOption>
            <FilterOption value="newest">Newest</FilterOption>
            <FilterOption value="cheapest">Cheapest</FilterOption>
            <FilterOption value="best-rated">Best rated</FilterOption>
          </FilterSelect>
          {hasFilters && (
            <button onClick={clearAll} className="ring-focus rounded-md px-2 py-1.5 text-sm font-medium text-primary hover:bg-accent">
              Reset filters
            </button>
          )}
        </div>

        {advancedOpen && (
          <div id="additional-extension-filters" className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <FilterSelect label="Price" value={search.price} onChange={(value) => update({ price: value })}>
                <FilterOption value="all">Any price</FilterOption>
                <FilterOption value="free">Free</FilterOption>
                <FilterOption value="lt300">Under $300</FilterOption>
                <FilterOption value="gte300">$300+</FilterOption>
              </FilterSelect>
              <FilterCheck label="Hyvä compatible" checked={search.hyva} onChange={(v) => update({ hyva: v })} />
              <FilterCheck label="PWA ready" checked={search.pwa} onChange={(v) => update({ pwa: v })} />
            </div>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</legend>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    aria-pressed={search.tag === tag}
                    onClick={() => update({ tag: search.tag === tag ? "" : tag })}
                    className={`ring-focus rounded-md border px-2 py-1 text-xs font-medium transition ${search.tag === tag
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <p role="status" className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 && "s"}</p>
          <button
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
            aria-controls="additional-extension-filters"
            className="ring-focus inline-flex items-center gap-2 rounded-md py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            More filters{advancedCount > 0 && ` (${advancedCount})`}
            <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        {compareItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{compareItems.length} in compare</span>
            <Link to="/compare" className="ring-focus rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">Compare →</Link>
            <button onClick={clear} className="ring-focus rounded-md text-xs text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
          <Star aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No extensions match your filters.</p>
          <button onClick={clearAll} className="ring-focus mt-3 rounded-md text-sm font-semibold text-primary">Reset filters</button>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => <ExtensionCard key={e.id} ext={e} />)}
        </div>
      )}
    </section>
  );
}

function FilterSelect({ label, value, onChange, children, compact = false }: {
  label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; compact?: boolean;
}) {
  return (
    <div className={`relative min-w-0 flex-1 basis-full sm:basis-auto sm:flex-none ${compact ? "sm:w-40" : "sm:w-44"}`}>
      <Select.Root value={`option:${value}`} onValueChange={(next) => onChange(next.slice("option:".length))}>
        <Select.Trigger
          aria-label={label}
          className="ring-focus flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm hover:border-border-strong data-[state=open]:border-border-strong [&>span:first-child]:truncate"
        >
          <Select.Value />
          <Select.Icon asChild><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={5}
            align="start"
            collisionPadding={8}
            className="z-50 max-h-[min(30rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-pop"
          >
            <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-popover text-muted-foreground"><ChevronUp className="h-4 w-4" /></Select.ScrollUpButton>
            <Select.Viewport className="p-1">{children}</Select.Viewport>
            <Select.ScrollDownButton className="flex h-6 items-center justify-center bg-popover text-muted-foreground"><ChevronDown className="h-4 w-4" /></Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function FilterOption({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Select.Item
      value={`option:${value}`}
      className="relative flex min-h-8 cursor-pointer select-none items-center rounded-lg py-1.5 pl-2 pr-8 text-sm outline-none data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2 flex items-center"><Check className="h-4 w-4" /></Select.ItemIndicator>
    </Select.Item>
  );
}

function FilterCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md py-1 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="ring-focus h-4 w-4 accent-primary" />
      <span className="text-foreground">{label}</span>
    </label>
  );
}
