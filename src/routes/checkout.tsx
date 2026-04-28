import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { findService, findExtension, services } from "@/data/mock";
import { Check, ArrowRight, Lock } from "lucide-react";

const searchSchema = z.object({
  service: fallback(z.string(), services[0].slug).default(services[0].slug),
  extension: fallback(z.string().optional(), undefined).default(undefined),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Checkout — implement.it" },
      { name: "description", content: "Order a Magento 2 service in under a minute. Secure checkout via Paddle." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type FormState = { name: string; email: string; site: string; access: string };

function CheckoutPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const service = findService(search.service) ?? services[0];
  const extension = search.extension ? findExtension(search.extension) : undefined;

  const [form, setForm] = useState<FormState>({ name: "", email: "", site: "", access: "" });
  const [step, setStep] = useState<"form" | "summary" | "thanks">("form");
  const [orderId] = useState(() => "IMP-" + Math.random().toString(36).slice(2, 8).toUpperCase());

  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email);

  return (
    <section className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Order service</h1>
        <p className="mt-1 text-muted-foreground">A short form, then secure payment via Paddle. We get to work as soon as your order is confirmed.</p>

        {/* Stepper */}
        <ol className="mt-8 flex items-center gap-2 text-xs font-medium">
          {(["Details", "Summary", "Done"] as const).map((label, i) => {
            const idx = ["form", "summary", "thanks"].indexOf(step);
            const active = i === idx, done = i < idx;
            return (
              <li key={label} className={`flex items-center gap-2 rounded-full border px-3 py-1 ${active ? "border-primary bg-brand-soft text-primary" : done ? "border-success/30 bg-success/10 text-success" : "border-border text-muted-foreground"}`}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold">{done ? "✓" : i + 1}</span>
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
                    onChange={(e) => navigate({ search: (p) => ({ ...p, service: e.target.value }) })}
                    className="ring-focus h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.slug}>{s.name} — €{s.price}</option>
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
                  <Row k="Order #" v={orderId} />
                  <Row k="Service" v={service.name} />
                  {extension && <Row k="Extension" v={extension.name} />}
                  <Row k="Name" v={form.name} />
                  <Row k="Email" v={form.email} />
                  {form.site && <Row k="Website" v={form.site} />}
                  <div className="my-2 border-t border-border" />
                  <Row k="Total" v={`€${service.price}`} bold />
                </dl>
                <button
                  onClick={() => setStep("thanks")}
                  className="ring-focus mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  <Lock className="h-4 w-4" /> Pay €{service.price} with Paddle
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
                <p className="mt-2 text-muted-foreground">Your order <span className="font-semibold text-foreground">{orderId}</span> is now <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground">pending</span> and will move through:</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                  {(["pending", "paid", "in progress", "completed"] as const).map((s, i) => (
                    <span key={s} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-warning/15 text-warning-foreground" : "bg-surface text-muted-foreground"}`}>{s}</span>
                  ))}
                </div>
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
              <span className="text-3xl font-bold text-foreground">€{service.price}</span>
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
