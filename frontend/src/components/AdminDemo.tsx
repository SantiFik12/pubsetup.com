import { ArrowUpRight, Eye, ShieldCheck } from "lucide-react";

export type AdminDemoAccess = { password: string; preview?: false; pending?: false } | { preview: true; pending?: boolean };

export function AdminDemo({ access }: { access?: AdminDemoAccess }) {
  if (!access) return null;
  const demoUrl = access.preview ? undefined : "https://magento.pubsetup.com/demo/admin";
  return (
    <section id="admin-demo" aria-labelledby="admin-demo-heading" className="container-page pb-10 md:pb-12">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-primary">
              <Eye aria-hidden="true" className="h-3 w-3" /> {access.pending ? "Admin demo · Coming soon" : access.preview ? "Admin demo · Preview" : "Admin demo"}
            </span>
            <h2 id="admin-demo-heading" className="mt-3 text-3xl font-bold tracking-tight text-foreground">Explore Magento 2 behind the scenes.</h2>
            <p className="mt-3 text-muted-foreground">{access.pending ? "A read-only tour of the Magento dashboard, products, categories and sample orders is coming soon." : "Browse the dashboard, products, categories and sample orders in our live admin demo. Access is read-only, so you can explore without changing the store."}</p>
            {!access.pending && <dl className="mt-5 grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Username</dt><dd className="mt-1 select-all break-all font-mono text-foreground">demo_viewer</dd></div>
              <div><dt className="text-muted-foreground">Password</dt><dd className="mt-1 select-all break-all font-mono text-foreground">{access.preview ? "Not configured" : access.password}</dd></div>
            </dl>}
            <div className="mt-6">
              {access.preview ? (
                <button type="button" disabled title={access.pending ? "Admin demo coming soon." : "Admin access is not configured for this preview."} className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground opacity-60">{access.pending ? "Admin demo coming soon" : "Open admin demo"} <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></button>
              ) : (
                <a href={demoUrl} target="_blank" rel="noreferrer" className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover">Open admin demo <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>
              )}
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{access.pending ? "Preview with sample data." : "Sample data only. Ordering and outgoing emails are disabled."}</p>
          </div>
          <a href={demoUrl} target="_blank" rel="noreferrer" aria-disabled={access.preview || undefined} aria-label={access.preview ? "Magento admin demo preview" : "Open the read-only Magento admin demo"} className="ring-focus group block overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:shadow-glow">
            <div className="flex items-center gap-1.5 border-b border-border bg-card px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" /><span className="h-2.5 w-2.5 rounded-full bg-warning/80" /><span className="h-2.5 w-2.5 rounded-full bg-success/80" />
              <span className="ml-3 text-xs text-muted-foreground">Magento Admin · Read-only demo</span>
            </div>
            <div aria-hidden="true" className="flex min-h-80 text-xs">
              <div className="flex w-16 shrink-0 flex-col items-center gap-6 bg-[#373330] py-6 text-white/80 sm:w-24"><span className="text-2xl font-bold text-[#f26322]">M</span>{["Dashboard", "Sales", "Catalog"].map(label => <span key={label}>{label}</span>)}</div>
              <div className="min-w-0 flex-1 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xl font-semibold text-foreground">Dashboard</span><span className="rounded-full bg-brand-soft px-2 py-1 text-primary">View only</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3">{[["Sample orders", "3"], ["Sample revenue", "$81.00"]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-card p-3"><div className="text-muted-foreground">{label}</div><div className="mt-2 text-xl font-semibold text-foreground">{value}</div></div>)}</div>
                <div className="mt-5 rounded-lg border border-border bg-card p-4"><div className="mb-3 font-semibold text-foreground">Sample orders</div>{[["Alex Demo", "$34.00"], ["Sam Sample", "$29.00"], ["Taylor Example", "$18.00"]].map(([name, amount]) => <div key={name} className="flex justify-between gap-2 border-t border-border py-3 text-muted-foreground"><span>{name}</span><span>{amount}</span></div>)}</div>
                <span className="mt-4 inline-flex items-center gap-1 font-semibold text-primary">{access.pending ? "Admin demo coming soon" : "Open admin demo"} <ArrowUpRight className="h-3 w-3" /></span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
