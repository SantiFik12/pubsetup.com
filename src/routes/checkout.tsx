import { createFileRoute, Link, useNavigate, getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/checkout");
import { useState } from "react";
import { useService, useExtension, useServices, useCatalog } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight, Lock } from "lucide-react";

type CheckoutSearch = {
  service: string;
  extension?: string;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    service: typeof search.service === "string" ? search.service : "",
    extension: typeof search.extension === "string" ? search.extension : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — pubsetup.com" },
      { name: "description", content: "Order a Magento 2 service in under a minute." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type FormState = { name: string; email: string; site: string; access: string };

function CheckoutPage() {
  const search = routeApi.useSearch();
  const navigate = useNavigate({ from: "/checkout" });
  const { isLoading } = useCatalog();
  const services = useServices();
  const fallbackService = services[0];
  const service = useService(search.service) ?? fallbackService;
  const extension = useExtension(search.extension);

  const [form, setForm] = useState<FormState>({ name: "", email: "", site: "", access: "" });
  const [step, setStep] = useState<"form" | "summary" | "thanks">("form");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !service) {
    return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email);

  const placeOrder = async () => {
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: form.name,
        email: form.email,
        website: form.site || null,
        notes: form.access || null,
        amount: service.price,
        status: "pending",
        service_id: service.id,
        extension_id: extension?.id ?? null,
      })
      .select("order_code")
      .single();
    setSubmitting(false);
    if (error || !data) {
      setError(error?.message ?? "Failed to place order");
      return;
    }
    setOrderCode(data.order_code);
    setStep("thanks");
  };

  return (
    <section className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Order service</h1>
        <p className="mt-1 text-muted-foreground">A short form, then we'll confirm your order and get to work.</p>

        <ol className="mt-8 flex items-center gap-2 text-xs font-medium">
          {(["Details", "Summary", "Done"] as const).map((label, i) => {
            const idx = ["form", "summary", "thanks"].indexOf(step);
            const active = i === idx, done = i < idx;
            return (
              <li key={label} className={`flex items-center gap-2 rounded-full border px-3 py-1 ${active ? "border-primary bg-brand-soft text-primary" : done ? "border-success/30 bg-success/10 text-success" : "border-border text-muted-foreground"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-primary text-primary-foreground" : done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground border border-border"}`}>{done ? "✓" : i + 1}</span>
                {label}
              </li>
            );
          })}
        </ol>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            {step === "form" && (
              <>
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Service</label>
                  <select
                    value={service.slug}
                    onChange={(e) => navigate({ search: (p: typeof search) => ({ ...p, service: e.target.value }) })}
                    className="ring-focus h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.slug}>{s.name} — ${s.price}</option>
                    ))}
                  </select>
                </div>
                <Field label="Your name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Your website" placeholder="https://yourstore.com" value={form.site} onChange={(v) => setForm({ ...form, site: v })} />
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Access / requirements / notes</label>
                  <textarea
                    rows={4}
                    value={form.access}
                    onChange={(e) => setForm({ ...form, access: e.target.value })}
                    placeholder="SSH access, admin URL, scope, deadlines…"
                    className="ring-focus w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <button
                  disabled={!valid}
                  onClick={() => setStep("summary")}
                  className="ring-focus inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
                >
                  Continue to summary <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {step === "summary" && (
              <>
                <h2 className="text-lg font-semibold">Order summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row k="Service" v={service.name} />
                  {extension && <Row k="Extension" v={extension.name} />}
                  <Row k="Name" v={form.name} />
                  <Row k="Email" v={form.email} />
                  {form.site && <Row k="Website" v={form.site} />}
                  <div className="my-2 border-t border-border" />
                  <Row k="Total" v={`$${service.price}`} bold />
                </dl>
                {error && <p className="mt-3 rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
                <button
                  disabled={submitting}
                  onClick={placeOrder}
                  className="ring-focus mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" /> {submitting ? "Placing order…" : `Confirm order — $${service.price}`}
                </button>
                <button onClick={() => setStep("form")} className="mt-2 text-center w-full text-xs text-muted-foreground hover:text-foreground">← Back to edit</button>
              </>
            )}

            {step === "thanks" && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-bold">Thank you, {form.name.split(" ")[0]}!</h2>
                <p className="mt-2 text-muted-foreground">Your order <span className="font-semibold text-foreground">{orderCode}</span> is now <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground">pending</span>.</p>
                <p className="mt-4 text-sm text-muted-foreground">A confirmation email is on its way to <span className="font-medium text-foreground">{form.email}</span>.</p>
                <Link to="/" className="mt-6 inline-block text-sm font-semibold text-primary">← Back to home</Link>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:self-start">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected service</div>
            <div className="mt-1 text-base font-semibold text-foreground">{service.name}</div>
            {extension && <div className="mt-2 rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground">For: <span className="font-medium text-foreground">{extension.name}</span></div>}
            <p className="mt-3 text-sm text-muted-foreground">{service.description}</p>
            <div className="mt-4 flex items-baseline gap-2 border-t border-border pt-4">
              <span className="text-3xl font-bold text-foreground">${service.price}</span>
              <span className="text-sm text-muted-foreground">{service.unit ?? "fixed"}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Delivery: {service.duration}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="ring-focus h-11 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground" />
    </div>
  );
}
function Row({ k, v, bold }: { k: string; v: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`text-right ${bold ? "text-lg font-bold text-foreground" : "text-foreground"}`}>{v}</dd>
    </div>
  );
}
