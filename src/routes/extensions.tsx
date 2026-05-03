import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal, Star } from "lucide-react";
import { ExtensionCard } from "@/components/ExtensionCard";
import { useCatalog, useAllTags } from "@/data/catalog";
import { useCompare } from "@/state/compare";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "").default(""),
  partner: fallback(z.string(), "").default(""),
  tag: fallback(z.string(), "").default(""),
  price: fallback(z.enum(["all", "free", "lt300", "gte300"]), "all").default("all"),
  hyva: fallback(z.boolean(), false).default(false),
  pwa: fallback(z.boolean(), false).default(false),
  sort: fallback(z.enum(["popular", "newest", "cheapest", "best-rated"]), "popular").default("popular"),
});

export const Route = createFileRoute("/extensions")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Magento 2 Extensions Catalog — pubsetup.com" },
      { name: "description", content: "Browse a curated catalog of Magento 2 extensions. Filter by category, partner, Hyvä compatibility, price and more." },
      { property: "og:title", content: "Magento 2 Extensions Catalog" },
      { property: "og:description", content: "Curated, expert-reviewed Magento 2 extensions from trusted partners." },
    ],
  }),
  component: ExtensionsPage,
});

function ExtensionsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [mobileFilters, setMobileFilters] = useState(false);
  const { items: compareItems, clear } = useCompare();
  const { extensions, partners, categories } = useCatalog();
  const allTags = useAllTags();

  const update = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  const filtered = useMemo(() => {
    let list = extensions.slice();
    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.shortDescription.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    if (search.cat) list = list.filter((e) => e.categoryId === search.cat);
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
      default: list.sort((a, b) => b.reviews - a.reviews);
    }
    return list;
  }, [search]);

  const clearAll = () =>
    navigate({ search: { q: "", cat: "", partner: "", tag: "", price: "all", hyva: false, pwa: false, sort: "popular" } });

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-10 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Magento 2 extensions</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {extensions.length} expert-curated modules from {partners.length} trusted partners. Filter, compare, and install with one click.
          </p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search extensions by name or description…"
                value={search.q}
                onChange={(e) => update({ q: e.target.value })}
                className="ring-focus h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={search.sort}
              onChange={(e) => update({ sort: e.target.value as typeof search.sort })}
              className="ring-focus h-11 rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="popular">Most popular</option>
              <option value="newest">Newest</option>
              <option value="cheapest">Cheapest</option>
              <option value="best-rated">Best rated</option>
            </select>
            <button
              onClick={() => setMobileFilters(true)}
              className="ring-focus inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          {/* Filters sidebar */}
          <aside className={`${mobileFilters ? "fixed inset-0 z-50 overflow-y-auto bg-background p-4" : "hidden"} md:static md:block md:p-0 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-2`}>
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileFilters(false)} className="rounded-md p-1.5"><X className="h-5 w-5" /></button>
            </div>
            <FilterGroup label="Category">
              <FilterRadio name="cat" value="" current={search.cat} onChange={(v) => update({ cat: v })} label="All categories" />
              {categories.map((c) => (
                <FilterRadio key={c.id} name="cat" value={c.id} current={search.cat} onChange={(v) => update({ cat: v })} label={c.name} />
              ))}
            </FilterGroup>
            <FilterGroup label="Partner">
              <FilterRadio name="partner" value="" current={search.partner} onChange={(v) => update({ partner: v })} label="All partners" />
              {partners.map((p) => (
                <FilterRadio key={p.id} name="partner" value={p.id} current={search.partner} onChange={(v) => update({ partner: v })} label={p.name} />
              ))}
            </FilterGroup>
            <FilterGroup label="Price">
              {([["all","Any price"],["free","Free"],["lt300","Under $300"],["gte300","$300+"]] as const).map(([v, l]) => (
                <FilterRadio key={v} name="price" value={v} current={search.price} onChange={(val) => update({ price: val as typeof search.price })} label={l} />
              ))}
            </FilterGroup>
            <FilterGroup label="Compatibility">
              <FilterCheck label="Hyvä compatible" checked={search.hyva} onChange={(v) => update({ hyva: v })} />
              <FilterCheck label="PWA ready" checked={search.pwa} onChange={(v) => update({ pwa: v })} />
            </FilterGroup>
            <FilterGroup label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => update({ tag: search.tag === t ? "" : t })}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                      search.tag === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-surface"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <button onClick={clearAll} className="mt-2 text-sm font-medium text-primary hover:text-primary-hover">
              Reset all filters
            </button>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 && "s"}</p>
              {compareItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{compareItems.length} in compare</span>
                  <Link to="/compare" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                    Compare →
                  </Link>
                  <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              )}
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <Star className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No extensions match your filters.</p>
                <button onClick={clearAll} className="mt-3 text-sm font-semibold text-primary">Reset filters</button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((e) => <ExtensionCard key={e.id} ext={e} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function FilterRadio({ name, value, current, onChange, label }: { name: string; value: string; current: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-surface">
      <input type="radio" name={name} checked={current === value} onChange={() => onChange(value)} className="h-3.5 w-3.5 accent-primary" />
      <span className="text-foreground">{label}</span>
    </label>
  );
}
function FilterCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-surface">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-primary" />
      <span className="text-foreground">{label}</span>
    </label>
  );
}
