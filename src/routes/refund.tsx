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

const mail = (
  <a className="font-medium text-primary hover:underline" href="mailto:contact@pubsetup.com">
    contact@pubsetup.com
  </a>
);

const sections = [
  {
    title: "1. Full refund — before work starts",
    body: (
      <p>
        You can cancel your order and receive a 100% refund at any time before we start the
        work. Just email {mail} with your order code.
      </p>
    ),
  },
  {
    title: "2. Partial refund — work in progress",
    body: (
      <p>
        If we have already started the Service, you can still cancel. We will refund the unused
        portion of the price, deducting time already spent at the Service hourly rate (or, for
        fixed-price Services, a fair share corresponding to the work completed).
      </p>
    ),
  },
  {
    title: "3. Quality guarantee",
    body: (
      <p>
        If the delivered work does not match the Service description, we will fix it free of
        charge within 14 days of delivery. If we are unable to fix it, you are entitled to a
        full refund of the affected Service.
      </p>
    ),
  },
  {
    title: "4. What is not refundable",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Third-party extension licenses purchased through partner links (refunds for those follow the vendor's policy).</li>
        <li>Hours already worked on hourly Services (Magento &amp; Server Updates, Migration from M1 to M2, etc.).</li>
        <li>Issues caused by changes you or another party made after delivery.</li>
        <li>Issues caused by incompatible third-party extensions, custom code or hosting limitations outside the agreed Service scope.</li>
      </ul>
    ),
  },
  {
    title: "5. How to request a refund",
    body: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>Email {mail} with your order code and a short description of the issue.</li>
        <li>We will reply within 2 business days and, if needed, ask for additional details.</li>
        <li>Approved refunds are processed to the original payment method within 5–10 business days.</li>
      </ol>
    ),
  },
  {
    title: "6. Chargebacks",
    body: (
      <p>
        Please contact us first — most issues can be resolved quickly. Initiating a chargeback
        without giving us a chance to fix the problem may result in suspension of future Services.
      </p>
    ),
  },
  {
    title: "7. Contact",
    body: <p>Questions about a refund? Email {mail}.</p>,
  },
];

function RefundPage() {
  return (
    <article className="container-page max-w-3xl py-14">
      <header className="border-b border-border pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 9, 2026</p>
      </header>

      <p className="mt-8 leading-relaxed text-muted-foreground">
        We want you to be satisfied with the work we deliver. This Refund Policy explains when
        and how you can request a refund for Services ordered on{" "}
        <strong className="text-foreground">pubsetup.com</strong>.
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
