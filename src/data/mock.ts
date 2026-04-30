import type { Service, BlogPost, SeoLanding } from "./types";

export const services: Service[] = [
  {
    id: "magento-setup", slug: "magento-2-setup-from-scratch", name: "Install Magento 2 from scratch",
    description: "Fresh Magento 2 installation on your server with all modern best-practice components configured for performance and security.",
    includes: ["Latest Magento 2 release", "Hestia Control Panel", "phpMyAdmin", "PHP-FPM tuned", "OpenSearch", "Nginx + Apache", "Redis sessions & cache", "Varnish full page cache"],
    duration: "3–5 business days", price: 300, featured: true,
  },
  {
    id: "extension-install", slug: "install-magento-2-extension", name: "Install a Magento 2 extension",
    description: "We install and configure any Magento 2 extension on your store, run health checks and validate the deploy.",
    includes: ["Composer installation", "Compile & deploy", "Cache warming", "Smoke test", "Rollback plan"],
    duration: "1–2 business days", price: 60,
  },
  {
    id: "security-patches", slug: "install-security-patches", name: "Install security patches",
    description: "Apply the latest Magento 2 and infrastructure security patches with zero-downtime deployment.",
    includes: ["Magento patches", "PHP & OS patches", "Backup before deploy", "Verification report"],
    duration: "1 business day", price: 60,
  },
  {
    id: "speed-optimization", slug: "magento-2-speed-optimization", name: "Optimize Magento 2 speed",
    description: "Full performance audit and optimization to hit Core Web Vitals and Lighthouse green scores.",
    includes: ["Performance audit", "Server tuning", "Cache & Varnish tuning", "Image optimization", "Critical CSS", "Lighthouse report"],
    duration: "5–7 business days", price: 200,
  },
  {
    id: "migration-consult", slug: "migration-consultation", name: "Migration consultation",
    description: "30-minute expert call to plan your Magento 1 → 2, replatform, or upgrade strategy.",
    includes: ["Architecture review", "Roadmap", "Risk assessment", "Cost estimate"],
    duration: "30 minutes", price: 50, unit: "/30 min",
  },
];

export const blogPosts: BlogPost[] = [
  {
    id: "amasty-ai-overview", slug: "amasty-ai-extensions-overview",
    title: "Amasty AI Extensions for Magento 2 — Complete Overview",
    excerpt: "We tested all 10 AI-powered extensions from Amasty. Here's how they help you generate content, automate SEO and grow Google Shopping sales.",
    cover: "review",
    category: "Reviews", tags: ["AI", "Amasty", "Recommended"],
    author: "pubsetup.com Team", date: "2026-04-12", readMinutes: 11,
    toc: [
      { id: "overview", label: "Overview" },
      { id: "content", label: "Content generation" },
      { id: "verdict", label: "Verdict" },
    ],
    content: [
      { type: "p", text: "Amasty's AI line covers everything from automatic product descriptions to Google Automated Discounts. We benchmarked all ten extensions on a real Magento 2.4.7 store." },
      { type: "h2", text: "Overview" },
      { type: "p", text: "Three modules generate content (ChatGPT, Gemini, Blog Pro). Three boost SEO and merchandising (SEO Toolkit, Landing Pages, Product Labels). Four cover navigation, feeds, tabs and Google Shopping." },
      { type: "h2", text: "Content generation" },
      { type: "extension-card", extensionSlug: "chatgpt-ai-content-generator" },
      { type: "extension-card", extensionSlug: "gemini-ai-content-generator" },
      { type: "h2", text: "Verdict" },
      { type: "p", text: "If you run a multi-language catalog of 1000+ SKUs, the AI Content Generator pays for itself within the first bulk run. Pair it with SEO Toolkit Pro for compound effect." },
    ],
  },
  {
    id: "best-magento-seo", slug: "best-magento-2-seo-extensions",
    title: "Best Magento 2 SEO Extensions for 2026",
    excerpt: "We benchmarked the most popular SEO extensions for Magento 2 against organic-traffic, automation and price.",
    cover: "compare",
    category: "Comparisons", tags: ["SEO", "Comparison"],
    author: "pubsetup.com Team", date: "2026-03-20", readMinutes: 12,
    toc: [{ id: "criteria", label: "Criteria" }, { id: "winners", label: "Winners" }],
    content: [
      { type: "p", text: "Picking the right SEO extension can change the trajectory of your store. We evaluated the top contenders." },
      { type: "h2", text: "Criteria" },
      { type: "list", items: ["Feature breadth", "Hyvä compatibility", "Support quality", "Price"] },
      { type: "extension-card", extensionSlug: "seo-toolkit" },
      { type: "h2", text: "Winners" },
      { type: "p", text: "Amasty SEO Toolkit Pro wins on breadth and the included AI Content Generator." },
    ],
  },
];

export const seoLandings: SeoLanding[] = [
  {
    slug: "best-magento-2-ai-extensions",
    title: "Best Magento 2 AI Extensions",
    metaDescription: "Hand-picked AI-powered extensions for Magento 2. Generate content, automate SEO, boost Google Shopping with AI.",
    intro: "AI-powered extensions are the fastest-growing segment of the Magento 2 ecosystem. Here are the modules we recommend most often.",
    filter: { categorySlug: "ai" },
  },
  {
    slug: "best-magento-2-seo-extensions",
    title: "Best Magento 2 SEO Extensions",
    metaDescription: "Hand-picked, expert-reviewed SEO extensions for Magento 2. Compare features, pricing and Hyvä support.",
    intro: "If organic traffic matters to your store, the right SEO extension can deliver compounding returns.",
    filter: { categorySlug: "seo" },
  },
  {
    slug: "magento-2-hyva-compatible-extensions",
    title: "Hyvä-Compatible Magento 2 Extensions",
    metaDescription: "Browse Magento 2 extensions that work natively with the Hyvä theme — no compatibility patches required.",
    intro: "Hyvä themes deliver the fastest Magento 2 frontends available. These extensions ship with native Hyvä support out of the box.",
    filter: { hyvaCompatible: true },
  },
  {
    slug: "cheap-magento-extensions",
    title: "Affordable Magento 2 Extensions Under €300",
    metaDescription: "Budget-friendly Magento 2 extensions under €300 — perfect for small and growing stores.",
    intro: "You don't need to spend a fortune to get a great Magento 2 extension. Here are the best options under €300.",
    filter: { priceMax: 300 },
  },
];

export const findService = (slug: string) => services.find((s) => s.slug === slug);
export const findPost = (slug: string) => blogPosts.find((p) => p.slug === slug);
export const findLanding = (slug: string) => seoLandings.find((l) => l.slug === slug);
