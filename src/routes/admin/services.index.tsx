import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCatalog, useInvalidateCatalog } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Plus, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/admin/services/")({
  component: AdminServicesList,
});

function AdminServicesList() {
  const { services, isLoading } = useCatalog();
  const invalidate = useInvalidateCatalog();
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const list = services.filter(
    (s) =>
      !filter ||
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.slug.toLowerCase().includes(filter.toLowerCase())
  );

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    const { error } = await supabase.from("services").delete().eq("id", id);
    setBusy(null);
    if (error) {
      alert(error.message);
      return;
    }
    invalidate();
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search by name or slug…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="ring-focus h-10 w-full rounded-lg border border-border bg-card px-3 text-sm sm:max-w-xs"
        />
        <Link
          to="/admin/services/new"
          className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> New service
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && list.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No services.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.slug}</div>
                </td>
                <td className="px-4 py-3">€{s.price} <span className="text-xs text-muted-foreground">{s.unit ?? "fixed"}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{s.duration || "—"}</td>
                <td className="px-4 py-3">
                  {s.featured && (
                    <span className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[11px] text-success">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to="/admin/services/$id"
                      params={{ id: s.id }}
                      className="ring-focus inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-surface"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button
                      disabled={busy === s.id}
                      onClick={() => remove(s.id, s.name)}
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
