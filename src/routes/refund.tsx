import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — pubsetup.com" },
      { name: "description", content: "When and how you can request a refund for pubsetup.com Magento 2 services." },
      { property: "og:title", content: "Refund Policy — pubsetup.com" },
      { property: "og:description", content: "When and how you can request a refund for pubsetup.com Magento 2 services." },
    ],
    links: [{ rel: "canonical", href: "https://pubsetup.com/refund" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <article className="container-page prose prose-slate max-w-3xl py-12 dark:prose-invert">
      <h1>Refund Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: May 9, 2026</p>

      <p>
        We want you to be satisfied with the work we deliver. This Refund Policy explains when
        and how you can request a refund for Services ordered on <strong>pubsetup.com</strong>.
      </p>

      <h2>1. Full refund — before work starts</h2>
      <p>
        You can cancel your order and receive a 100% refund at any time before we start the
        work. Just email <a href="mailto:hello@pubsetup.com">hello@pubsetup.com</a> with your
        order code.
      </p>

      <h2>2. Partial refund — work in progress</h2>
      <p>
        If we have already started the Service, you can still cancel. We will refund the unused
        portion of the price, deducting time already spent at the Service hourly rate (or, for
        fixed-price Services, a fair share corresponding to the work completed).
      </p>

      <h2>3. Quality guarantee</h2>
      <p>
        If the delivered work does not match the Service description, we will fix it free of
        charge within 14 days of delivery. If we are unable to fix it, you are entitled to a
        full refund of the affected Service.
      </p>

      <h2>4. What is not refundable</h2>
      <ul>
        <li>Third-party extension licenses purchased through partner links (refunds for those follow the vendor's policy).</li>
        <li>Hours already worked on hourly Services (Magento &amp; Server Updates, Migration from M1 to M2, etc.).</li>
        <li>Issues caused by changes you or another party made after delivery.</li>
        <li>Issues caused by incompatible third-party extensions, custom code or hosting limitations outside the agreed Service scope.</li>
      </ul>

      <h2>5. How to request a refund</h2>
      <ol>
        <li>Email <a href="mailto:hello@pubsetup.com">hello@pubsetup.com</a> with your order code and a short description of the issue.</li>
        <li>We will reply within 2 business days and, if needed, ask for additional details.</li>
        <li>Approved refunds are processed to the original payment method within 5–10 business days.</li>
      </ol>

      <h2>6. Chargebacks</h2>
      <p>
        Please contact us first — most issues can be resolved quickly. Initiating a chargeback
        without giving us a chance to fix the problem may result in suspension of future Services.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about a refund? Email <a href="mailto:hello@pubsetup.com">hello@pubsetup.com</a>.
      </p>
    </article>
  );
}
