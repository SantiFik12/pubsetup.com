import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — pubsetup.com" },
      { name: "description", content: "Terms governing the use of pubsetup.com catalog and Magento 2 installation services." },
      { property: "og:title", content: "Terms of Service — pubsetup.com" },
      { property: "og:description", content: "Terms governing the use of pubsetup.com catalog and Magento 2 services." },
    ],
    links: [{ rel: "canonical", href: "https://pubsetup.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="container-page prose prose-slate max-w-3xl py-12 dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: May 9, 2026</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of the website
        <strong> pubsetup.com</strong> (the "Site") and the related Magento 2 installation,
        configuration, optimization and migration services (the "Services") provided by
        pubsetup.com ("we", "us", "our"). By using the Site or ordering a Service you agree
        to these Terms.
      </p>

      <h2>1. About the Site</h2>
      <p>
        pubsetup.com is an independent catalog of third-party Magento 2 extensions. Extensions
        listed on the Site are developed and licensed by their respective vendors. We may earn
        an affiliate commission when you purchase an extension through links on the Site.
        We are not the author of those extensions and do not provide warranties on their behalf.
      </p>

      <h2>2. Services</h2>
      <p>
        We offer paid technical Services such as extension installation, Magento 2 setup,
        server transfer, performance audit, security patches installation, Magento and server
        updates, and migration from Magento 1 to Magento 2. Service scope, deliverables and
        price are described on the corresponding Service page and confirmed at checkout.
      </p>
      <p>
        Hourly Services (e.g. updates, M1→M2 migration) are billed in prepaid blocks of
        hours. If the work requires more time than the prepaid block, we will notify you and
        request approval before continuing.
      </p>

      <h2>3. Orders and payment</h2>
      <ul>
        <li>Prices are listed in US dollars and are exclusive of any applicable taxes.</li>
        <li>Payment is required upfront. We start the work after payment is confirmed.</li>
        <li>You must provide accurate contact information and the access (SSH, admin, hosting) needed to perform the Service.</li>
        <li>Extension licenses are not included in the Service price unless explicitly stated.</li>
      </ul>

      <h2>4. Your responsibilities</h2>
      <ul>
        <li>Maintain a recent, working backup of your store before we start any work.</li>
        <li>Ensure you have the right to grant us access to your servers and Magento admin.</li>
        <li>Keep credentials confidential and rotate them after the work is completed.</li>
      </ul>

      <h2>5. Warranty and liability</h2>
      <p>
        We perform Services with reasonable skill and care. The Site and Services are provided
        "as is" without any other warranty, express or implied. To the maximum extent permitted
        by law, our total liability for any claim related to the Site or a Service is limited
        to the amount you actually paid for the Service in question. We are not liable for
        indirect, incidental, lost-profit or consequential damages, or for issues caused by
        third-party extensions, hosting, or pre-existing problems in your store.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        All content on the Site (text, layout, branding) is owned by pubsetup.com or used with
        permission. Extension names, logos and screenshots belong to their respective owners
        and are used for catalog purposes only.
      </p>

      <h2>7. Acceptable use</h2>
      <p>
        You agree not to misuse the Site, attempt to gain unauthorized access, scrape it at
        unreasonable rates, or use the Services for unlawful content or activity.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms from time to time. The "Last updated" date above reflects the
        latest version. Continued use of the Site after changes means you accept the updated Terms.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These Terms are governed by the laws applicable to international online services, and
        any dispute shall be resolved through good-faith negotiation first, and otherwise in the
        competent courts at our place of business.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms? Email <a href="mailto:hello@pubsetup.com">hello@pubsetup.com</a>.
      </p>
    </article>
  );
}
