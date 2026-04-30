import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateCatalog, useService } from "@/data/catalog";
import { tagSlug as slugify } from "@/lib/slug";
import { Save, X } from "lucide-react";

interface Props {
  serviceId?: string;
}

interface FormState {
  slug: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  unit: string;
  featured: boolean;
  includes: string;
}

const EMPTY: FormState = {
  slug: "",
  name: "",
  description: "",
  duration: "",
  price: "0",
  unit: "fixed",
  featured: false,
  includes: "",
};

export function ServiceForm({ serviceId }: Props) {
  const navigate = useNavigate();
  const existing = useService(serviceId);
  const invalidate = useInvalidateCatalog();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(serviceId);

  useEffect(() => {
    if (existing) {
      setForm({
        slug: existing.slug,
        name: existing.name,
        description: existing.description,
        duration: existing.duration,
        price: String(existing.price),
        unit: existing.unit ?? "fixed",
        featured: existing.featured ?? false,
        includes: existing.includes.join("\n"),
      });
    }
  }, [existing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.name);
    const payload = {
      slug,
      name: form.name.trim(),
      description: form.description.trim(),
      duration: form.duration.trim(),
      price: Number(form.price) || 0,
      unit: form.unit.trim() || null,
      featured: form.featured,
      includes: form.includes
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res = isEdit
      ? await supabase.from("services").update(payload).eq("id", serviceId!)
      : await supabase.from("services").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    invalidate();
    navigate({ to: "/admin/services" });
  };

  if (isEdit && !existing) {
    return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{isEdit ? "Edit service" : "New service"}</h2>

      <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} />
      <Field label="Slug *" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto from name" />

      <div>
        <Label>Description</Label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="ring-focus w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <Label>What's included (one per line)</Label>
        <textarea
          rows={5}
          value={form.includes}
          onChange={(e) => setForm({ ...form, includes: e.target.value })}
          placeholder="Server requirements check&#10;Magento 2 installation&#10;Admin panel setup"
          className="ring-focus w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Duration" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} placeholder="e.g. 2-3 business days" />
        <Field label="Price (€) *" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
        <Field label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="fixed / per item" />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        Featured
      </label>

      {error && <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/services" })}
          className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-surface"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="ring-focus h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />
    </div>
  );
}
