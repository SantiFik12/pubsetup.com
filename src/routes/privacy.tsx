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

function PrivacyPage() {
  return (
    <article className="container-page prose prose-slate max-w-3xl py-12 dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: May 9, 2026</p>

      <p>
        This Privacy Policy explains how <strong>pubsetup.com</strong> ("we", "us") collects,
        uses, stores and shares personal data when you visit the Site or order a Service.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Order data</strong>: name, email, website URL, notes and access details you provide at checkout.</li>
        <li><strong>Communication data</strong>: messages you send us by email or contact form.</li>
        <li><strong>Technical data</strong>: IP address, browser type, device, pages visited, referrer.</li>
        <li><strong>Analytics data</strong>: aggregated, privacy-friendly usage statistics collected via Jolt analytics.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To deliver the Service you ordered and communicate about it.</li>
        <li>To issue invoices, provide support and prevent fraud.</li>
        <li>To improve the Site, content and catalog quality.</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>
        We process your data on the basis of (a) performance of a contract when you order a
        Service, (b) our legitimate interest in operating and improving the Site, and (c) your
        consent where required (e.g. optional analytics).
      </p>

      <h2>4. Sharing</h2>
      <p>
        We do not sell your personal data. We share it only with processors that help us operate
        the Site and deliver Services:
      </p>
      <ul>
        <li>Hosting and database (Lovable Cloud / Supabase infrastructure).</li>
        <li>Email delivery providers for order confirmations and support.</li>
        <li>Privacy-friendly analytics (Jolt) — aggregated, no cross-site tracking.</li>
        <li>Authorities when required by law.</li>
      </ul>

      <h2>5. Access credentials</h2>
      <p>
        When you share SSH, FTP or admin credentials with us to perform a Service, we store them
        only for the duration of the work, restrict access to the engineer assigned to your
        order, and recommend you rotate them after delivery.
      </p>

      <h2>6. Retention</h2>
      <p>
        Order records are kept for the period required by accounting and tax law (typically up
        to 7 years). Support emails are kept up to 24 months. Analytics data is aggregated and
        does not identify you individually.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on your jurisdiction (e.g. GDPR, CCPA), you have the right to access, correct,
        delete, or export your personal data, restrict or object to processing, and lodge a
        complaint with a supervisory authority. To exercise these rights email
        <a href="mailto:hello@pubsetup.com"> hello@pubsetup.com</a>.
      </p>

      <h2>8. Cookies</h2>
      <p>
        The Site uses strictly necessary cookies to remember your preferences (such as the
        comparison list) and a privacy-friendly analytics cookie. We do not use third-party
        advertising cookies.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Your data may be processed in countries other than your own. Where applicable, we rely
        on standard contractual clauses or equivalent safeguards.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Privacy Policy. Material changes will be reflected in the "Last
        updated" date above.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or requests? Email <a href="mailto:hello@pubsetup.com">hello@pubsetup.com</a>.
      </p>
    </article>
  );
}
