export type Partner = {
  updatedAt?: string;
  id: string;
  slug: string;
  name: string;
  logoLetter: string;
  description: string;
  website: string;
};

export type Category = {
  updatedAt?: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export type Extension = {
  views: number;
  updatedAt?: string;
  originalUrl?: string;
  id: string;
  slug: string;
  name: string;
  partnerId: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  priceFrom: number;
  priceType: "one-time" | "subscription" | "free";
  rating: number;
  reviews: number;
  recommended?: boolean;
  bestSeller?: boolean;
  affiliateUrl: string;
  magentoVersions: string[];
  hyvaCompatible: boolean;
  pwaReady: boolean;
  edition: "open-source" | "commerce" | "both";
  installComplexity: "simple" | "complex";
  hasTrial: boolean;
  hasDemo: boolean;
  supportMonths: number;
  features: string[];
  useCases: string[];
  tags: string[];
  installPrice: number;
  createdAt: string;
  coverImage: string;
  gallery: string[];
  userGuideUrl: string;
};

export type Service = {
  updatedAt?: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  includes: string[];
  duration: string;
  price: number;
  unit?: string;
  featured?: boolean;
};

export type BlogPost = {
  updatedAt?: string;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  readMinutes: number;
  toc: { id: string; label: string }[];
  content: { type: "p" | "h2" | "list" | "extension-card"; text?: string; items?: string[]; extensionSlug?: string }[];
};

export type SeoLanding = {
  updatedAt?: string;
  slug: string;
  title: string;
  metaDescription: string;
  intro: string;
  filter: { tag?: string; categorySlug?: string; partnerSlug?: string; hyvaCompatible?: boolean; priceMax?: number };
};
