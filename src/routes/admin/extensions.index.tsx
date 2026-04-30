import { createFileRoute, Link } from "@tanstack/react-router";
import { useCatalog, useInvalidateCatalog } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Plus, Trash2, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/extensions/")({
  component: AdminExtensionsList,
});

function AdminExtensionsList() {
  const { extensions, partners, categories, isLoading } = useCatalog();
  const invalidate = useInvalidateCatalog();
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const partnerName = (id: string) => partners.find((p) => p.id === id)?.name ?? "—";
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const list = extensions.filter((e) =>
    !filter ||
    e.name.toLowerCase().includes(filter.toLowerCase()) ||
    e.slug.toLowerCase().includes(filter.toLowerCase())
  );

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    const { error } = await supabase.from("extensions").delete().eq("id", id);
    setBusy(null);
    if (error) { alert(error.message); return; }
    invalidate();
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search" placeholder="Search by name or slug…"
          value={filter} onChange={(e) => setFilter(e.target.value)}
          className="ring-focus h-10 w-full rounded-lg border border-border bg-card px-3 text-sm sm:max-w-xs"
        />
        <Link
          to="/admin/extensions/new"
          className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> New extension
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Partner</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-left">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && list.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No extensions.</td></tr>}
            {list.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{partnerName(e.partnerId)}</td>
                <td className="px-4 py-3 text-muted-foreground">{categoryName(e.categoryId)}</td>
                <td className="px-4 py-3">{e.priceType === "free" ? "Free" : `$${e.priceFrom}`}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {e.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                    {e.tags.length > 4 && <span className="text-[11px] text-muted-foreground">+{e.tags.length - 4}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {e.recommended && <span className="rounded bg-success/10 px-1.5 py-0.5 text-success"><Star className="inline h-3 w-3" /> Rec</span>}
                    {e.bestSeller && <span className="rounded bg-warning/15 px-1.5 py-0.5 text-warning-foreground">Best</span>}
                    {e.hyvaCompatible && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-primary">Hyvä</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to="/admin/extensions/$id"
                      params={{ id: e.id }}
                      className="ring-focus inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-surface"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button
                      disabled={busy === e.id}
                      onClick={() => remove(e.id, e.name)}
                      className="ring-focus inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/15 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
