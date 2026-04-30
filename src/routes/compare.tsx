import { createFileRoute, Link } from "@tanstack/react-router";
import { useCompare } from "@/state/compare";
import { useCatalog } from "@/data/catalog";
import { Star, Check, X, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Magento 2 Extensions — pubsetup.com" },
      { name: "description", content: "Compare Magento 2 extensions side by side: price, features, Hyvä support, license type and ratings." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { items, toggle, clear } = useCompare();
  const { extensions, partners } = useCatalog();
  const findPartner = (id: string) => partners.find((p) => p.id === id);
  const exts = items
    .map((s) => extensions.find((e) => e.slug === s))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  if (exts.length === 0) {
    return (
      <section className="container-page py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Compare extensions</h1>
        <p className="mt-2 text-muted-foreground">Add up to 4 extensions from the catalog to compare side by side.</p>
        <Link to="/extensions" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Browse extensions →
        </Link>
      </section>
    );
  }

  const rows: { label: string; render: (e: typeof exts[number]) => React.ReactNode; highlight?: boolean }[] = [
    { label: "Partner", render: (e) => findPartner(e.partnerId)?.name ?? "—" },
    { label: "Price", render: (e) => e.priceType === "free" ? "Free" : `from $${e.priceFrom}`, highlight: true },
    { label: "License", render: (e) => e.priceType },
    { label: "Rating", render: (e) => <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{e.rating} ({e.reviews})</span>, highlight: true },
    { label: "Magento versions", render: (e) => e.magentoVersions.join(", ") },
    { label: "Hyvä compatible", render: (e) => e.hyvaCompatible ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />, highlight: true },
    { label: "PWA ready", render: (e) => e.pwaReady ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" /> },
    { label: "Live demo", render: (e) => e.hasDemo ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" /> },
    { label: "Trial", render: (e) => e.hasTrial ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" /> },
    { label: "Support", render: (e) => e.supportMonths ? `${e.supportMonths} months` : "—" },
    { label: "Install complexity", render: (e) => e.installComplexity },
    { label: "Key features", render: (e) => <ul className="space-y-1 text-xs text-muted-foreground">{e.features.slice(0, 5).map((f) => <li key={f}>• {f}</li>)}</ul> },
  ];

  return (
    <section className="container-page py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Compare extensions</h1>
        <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground">Clear all</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-44 bg-surface px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature</th>
              {exts.map((e) => (
                <th key={e.id} className="px-4 py-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">{findPartner(e.partnerId)?.name ?? ""}</div>
                      <Link to="/extension/$slug" params={{ slug: e.slug }} className="text-base font-semibold text-foreground hover:text-primary">{e.name}</Link>
                    </div>
                    <button onClick={() => toggle(e.slug)} className="rounded-md p-1 text-muted-foreground hover:bg-surface"><X className="h-4 w-4" /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border last:border-0">
                <td className={`bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${r.highlight ? "text-primary" : ""}`}>{r.label}</td>
                {exts.map((e) => (
                  <td key={e.id} className="px-4 py-3 align-top text-foreground">{r.render(e)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="bg-surface px-4 py-3"></td>
              {exts.map((e) => (
                <td key={e.id} className="space-y-2 px-4 py-3">
                  <a href={e.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="ring-focus inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                    Buy <ExternalLink className="h-3 w-3" />
                  </a>
                  <Link to="/checkout" search={{ service: "install-magento-2-extension", extension: e.slug }} className="ring-focus inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface">
                    Order Installation
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
