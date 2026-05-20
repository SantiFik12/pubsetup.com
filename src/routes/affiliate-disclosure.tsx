import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/affiliate-disclosure")({
  head: () => ({
    meta: [
      { title: "Affiliate Disclosure — pubsetup.com" },
      { name: "description", content: "How pubsetup.com uses affiliate links and how we earn commissions from partner sites." },
      { property: "og:title", content: "Affiliate Disclosure — pubsetup.com" },
      { property: "og:description", content: "How pubsetup.com uses affiliate links and earns commissions from partner sites." },
    ],
    links: [{ rel: "canonical", href: "https://pubsetup.com/affiliate-disclosure" }],
  }),
  component: AffiliateDisclosurePage,
});

function AffiliateDisclosurePage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Affiliate Disclosure</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">What this means</h2>
          <p>
            pubsetup.com is an independent catalog of third-party Magento 2 extensions.
            Some of the links to partner vendors on this site are affiliate links. If you
            click such a link and make a purchase on the partner site, we may receive a
            commission at no additional cost to you.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">How it affects our content</h2>
          <p>
            Affiliate commissions help us maintain the catalog, write guides and keep the
            installation services priced fairly. They do not influence our ratings,
            recommendations or which extensions we list. We only feature products from
            partners we consider reputable in the Magento 2 ecosystem.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Identifying affiliate links</h2>
          <p>
            Outbound links to partner vendors (for example, "View Partner Offer" buttons)
            are marked with <code className="rounded bg-surface px-1 py-0.5 text-xs">rel="sponsored"</code>
            in line with search engine and advertising guidelines. The disclosure in the
            site footer applies to every page that contains such links.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Questions</h2>
          <p>
            If you have any questions about our affiliate relationships, contact us at{" "}
            <a href="mailto:contact@pubsetup.com" className="font-medium text-foreground hover:underline">
              contact@pubsetup.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
