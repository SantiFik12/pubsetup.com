import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCatalog, useInvalidateCatalog, useAllTags } from "@/data/catalog";
import type { Extension } from "@/data/types";
import { Save, ArrowLeft, X } from "lucide-react";

type Form = {
  slug: string;
  name: string;
  partner_id: string;
  category_id: string;
  short_description: string;
  description: string;
  price_from: number;
  price_type: "one-time" | "subscription" | "free";
  rating: number;
  reviews: number;
  recommended: boolean;
  best_seller: boolean;
  affiliate_url: string;
  magento_versions: string[];
  hyva_compatible: boolean;
  pwa_ready: boolean;
  edition: "open-source" | "commerce" | "both";
  install_complexity: "simple" | "complex";
  has_trial: boolean;
  has_demo: boolean;
  support_months: number;
  features: string[];
  use_cases: string[];
  tags: string[];
  install_price: number;
  cover_image: string;
  gallery: string[];
  user_guide_url: string;
};

const empty: Form = {
  slug: "", name: "", partner_id: "", category_id: "",
  short_description: "", description: "",
  price_from: 0, price_type: "one-time",
  rating: 0, reviews: 0,
  recommended: false, best_seller: false,
  affiliate_url: "",
  magento_versions: ["2.4"],
  hyva_compatible: false, pwa_ready: false,
  edition: "both", install_complexity: "simple",
  has_trial: false, has_demo: false,
  support_months: 12,
  features: [], use_cases: [], tags: [],
  install_price: 60,
  cover_image: "", gallery: [], user_guide_url: "",
};

function fromExtension(e: Extension): Form {
  return {
    slug: e.slug, name: e.name, partner_id: e.partnerId, category_id: e.categoryId,
    short_description: e.shortDescription, description: e.description,
    price_from: e.priceFrom, price_type: e.priceType,
    rating: e.rating, reviews: e.reviews,
    recommended: !!e.recommended, best_seller: !!e.bestSeller,
    affiliate_url: e.affiliateUrl,
    magento_versions: e.magentoVersions,
    hyva_compatible: e.hyvaCompatible, pwa_ready: e.pwaReady,
    edition: e.edition, install_complexity: e.installComplexity,
    has_trial: e.hasTrial, has_demo: e.hasDemo,
    support_months: e.supportMonths,
    features: e.features, use_cases: e.useCases, tags: e.tags,
    install_price: e.installPrice,
  };
}

export function ExtensionForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const { extensions, partners, categories, isLoading } = useCatalog();
  const invalidate = useInvalidateCatalog();
  const existing = id ? extensions.find((e) => e.id === id) : undefined;
  const allTags = useAllTags();

  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setForm(fromExtension(existing));
  }, [existing]);

  // For new extensions, default partner/category to first available once loaded
  useEffect(() => {
    if (id) return;
    if (form.partner_id || partners.length === 0) return;
    setForm((f) => ({ ...f, partner_id: partners[0].id, category_id: categories[0]?.id ?? "" }));
  }, [id, partners, categories, form.partner_id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setError(null);
    const payload = { ...form };
    let res;
    if (id) {
      res = await supabase.from("extensions").update(payload).eq("id", id);
    } else {
      res = await supabase.from("extensions").insert(payload);
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    await invalidate();
    navigate({ to: "/admin/extensions" });
  };

  if (id && isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  if (id && !existing && !isLoading) return <div className="py-12 text-center text-muted-foreground">Extension not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/admin/extensions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to extensions
      </Link>

      <h2 className="text-xl font-bold">{id ? "Edit extension" : "New extension"}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Name *">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inp} />
        </Field>
        <Field label="Slug *" hint="URL: /extension/{slug}">
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inp} />
        </Field>

        <Field label="Partner *">
          <select value={form.partner_id} onChange={(e) => set("partner_id", e.target.value)} className={inp}>
            <option value="">— Select —</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Category *">
          <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inp}>
            <option value="">— Select —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Short description" className="md:col-span-2">
          <input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={inp} />
        </Field>

        <Field label="Full description" className="md:col-span-2">
          <textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inp} h-auto py-2`} />
        </Field>

        <Field label="Affiliate URL" className="md:col-span-2">
          <input value={form.affiliate_url} onChange={(e) => set("affiliate_url", e.target.value)} className={inp} placeholder="https://amasty.com/..." />
        </Field>

        <Field label="Price from ($)">
          <input type="number" min={0} step="0.01" value={form.price_from} onChange={(e) => set("price_from", Number(e.target.value))} className={inp} />
        </Field>
        <Field label="Price type">
          <select value={form.price_type} onChange={(e) => set("price_type", e.target.value as Form["price_type"])} className={inp}>
            <option value="one-time">One-time</option>
            <option value="subscription">Subscription</option>
            <option value="free">Free</option>
          </select>
        </Field>

        <Field label="Install price (€)">
          <input type="number" min={0} value={form.install_price} onChange={(e) => set("install_price", Number(e.target.value))} className={inp} />
        </Field>
        <Field label="Support months">
          <input type="number" min={0} value={form.support_months} onChange={(e) => set("support_months", Number(e.target.value))} className={inp} />
        </Field>

        <Field label="Rating (0–5)">
          <input type="number" min={0} max={5} step="0.1" value={form.rating} onChange={(e) => set("rating", Number(e.target.value))} className={inp} />
        </Field>
        <Field label="Reviews count">
          <input type="number" min={0} value={form.reviews} onChange={(e) => set("reviews", Number(e.target.value))} className={inp} />
        </Field>

        <Field label="Magento edition">
          <select value={form.edition} onChange={(e) => set("edition", e.target.value as Form["edition"])} className={inp}>
            <option value="both">Both</option>
            <option value="open-source">Open Source</option>
            <option value="commerce">Commerce</option>
          </select>
        </Field>
        <Field label="Install complexity">
          <select value={form.install_complexity} onChange={(e) => set("install_complexity", e.target.value as Form["install_complexity"])} className={inp}>
            <option value="simple">Simple</option>
            <option value="complex">Complex</option>
          </select>
        </Field>

        <Field label="Magento versions" className="md:col-span-2" hint="Comma-separated, e.g. 2.4.6, 2.4.7">
          <ArrayInput value={form.magento_versions} onChange={(v) => set("magento_versions", v)} />
        </Field>

        <Field label="Features" className="md:col-span-2">
          <ArrayInput value={form.features} onChange={(v) => set("features", v)} />
        </Field>

        <Field label="Use cases" className="md:col-span-2">
          <ArrayInput value={form.use_cases} onChange={(v) => set("use_cases", v)} />
        </Field>

        <Field label="Tags" className="md:col-span-2" hint="Used in catalog filters. Pick existing or add new.">
          <TagsInput value={form.tags} onChange={(v) => set("tags", v)} suggestions={allTags} />
        </Field>

        <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Toggle label="Recommended" checked={form.recommended} onChange={(v) => set("recommended", v)} />
          <Toggle label="Best seller" checked={form.best_seller} onChange={(v) => set("best_seller", v)} />
          <Toggle label="Hyvä compatible" checked={form.hyva_compatible} onChange={(v) => set("hyva_compatible", v)} />
          <Toggle label="PWA ready" checked={form.pwa_ready} onChange={(v) => set("pwa_ready", v)} />
          <Toggle label="Has trial" checked={form.has_trial} onChange={(v) => set("has_trial", v)} />
          <Toggle label="Has live demo" checked={form.has_demo} onChange={(v) => set("has_demo", v)} />
        </div>
      </div>

      {error && <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save} disabled={saving || !form.name || !form.slug || !form.partner_id || !form.category_id}
          className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : id ? "Save changes" : "Create extension"}
        </button>
        <Link to="/admin/extensions" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
      </div>
    </div>
  );
}

const inp = "ring-focus h-10 w-full rounded-lg border border-border bg-background px-3 text-sm";

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

function ArrayInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(value.join(", ")); }, [value]);
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text.split(",").map((s) => s.trim()).filter(Boolean))}
      className={inp}
    />
  );
}

function TagsInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setText("");
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));
  const filtered = useMemo(
    () => suggestions.filter((s) => !value.includes(s) && (!text || s.toLowerCase().includes(text.toLowerCase()))).slice(0, 8),
    [suggestions, value, text]
  );
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-primary">
            {t}
            <button type="button" onClick={() => remove(t)} className="rounded hover:bg-primary/10"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); } }}
        placeholder="Type a tag and press Enter…"
        className={inp}
      />
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filtered.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] hover:bg-surface">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
