import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — pubsetup.com" },
      { name: "description", content: "How pubsetup.com collects, uses and protects your personal data." },
      { property: "og:title", content: "Privacy Policy — pubsetup.com" },
      { property: "og:description", content: "How pubsetup.com collects, uses and protects your personal data." },
    ],
    links: [{ rel: "canonical", href: "https://pubsetup.com/privacy" }],
  }),
  component: PrivacyPage,
});

const mail = (
  <a className="font-medium text-primary hover:underline" href="mailto:contact@pubsetup.com">
    contact@pubsetup.com
  </a>
);

const sections = [
  {
    title: "1. Data we collect",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li><strong className="text-foreground">Order data</strong>: name, email, website URL, notes and access details you provide at checkout.</li>
        <li><strong className="text-foreground">Communication data</strong>: messages you send us by email or contact form.</li>
        <li><strong className="text-foreground">Technical data</strong>: IP address, browser type, device, pages visited, referrer.</li>
        <li><strong className="text-foreground">Analytics data</strong>: aggregated, privacy-friendly usage statistics collected via Jolt analytics.</li>
      </ul>
    ),
  },
  {
    title: "2. How we use it",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>To deliver the Service you ordered and communicate about it.</li>
        <li>To issue invoices, provide support and prevent fraud.</li>
        <li>To improve the Site, content and catalog quality.</li>
        <li>To comply with legal obligations.</li>
      </ul>
    ),
  },
  {
    title: "3. Legal basis",
    body: (
      <p>
        We process your data on the basis of (a) performance of a contract when you order a
        Service, (b) our legitimate interest in operating and improving the Site, and (c) your
        consent where required (e.g. optional analytics).
      </p>
    ),
  },
  {
    title: "4. Sharing",
    body: (
      <>
        <p>We do not sell your personal data. We share it only with processors that help us operate the Site and deliver Services:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Hosting and database (Lovable Cloud / Supabase infrastructure).</li>
          <li>Email delivery providers for order confirmations and support.</li>
          <li>Privacy-friendly analytics (Jolt) — aggregated, no cross-site tracking.</li>
          <li>Authorities when required by law.</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Access credentials",
    body: (
      <p>
        When you share SSH, FTP or admin credentials with us to perform a Service, we store them
        only for the duration of the work, restrict access to the engineer assigned to your
        order, and recommend you rotate them after delivery.
      </p>
    ),
  },
  {
    title: "6. Retention",
    body: (
      <p>
        Order records are kept for the period required by accounting and tax law (typically up
        to 7 years). Support emails are kept up to 24 months. Analytics data is aggregated and
        does not identify you individually.
      </p>
    ),
  },
  {
    title: "7. Your rights",
    body: (
      <p>
        Depending on your jurisdiction (e.g. GDPR, CCPA), you have the right to access, correct,
        delete, or export your personal data, restrict or object to processing, and lodge a
        complaint with a supervisory authority. To exercise these rights email {mail}.
      </p>
    ),
  },
  {
    title: "8. Cookies",
    body: (
      <p>
        The Site uses strictly necessary cookies to remember your preferences (such as the
        comparison list) and a privacy-friendly analytics cookie. We do not use third-party
        advertising cookies.
      </p>
    ),
  },
  {
    title: "9. International transfers",
    body: (
      <p>
        Your data may be processed in countries other than your own. Where applicable, we rely
        on standard contractual clauses or equivalent safeguards.
      </p>
    ),
  },
  {
    title: "10. Changes",
    body: (
      <p>
        We may update this Privacy Policy. Material changes will be reflected in the "Last
        updated" date above.
      </p>
    ),
  },
  {
    title: "11. Contact",
    body: <p>Questions or requests? Email {mail}.</p>,
  },
];

function PrivacyPage() {
  return (
    <article className="container-page max-w-3xl py-14">
      <header className="border-b border-border pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 9, 2026</p>
      </header>

      <p className="mt-8 leading-relaxed text-muted-foreground">
        This Privacy Policy explains how <strong className="text-foreground">pubsetup.com</strong>{" "}
        ("we", "us") collects, uses, stores and shares personal data when you visit the Site or
        order a Service.
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold text-foreground">{s.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
