import path from "node:path";
import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {root: path.resolve(import.meta.dirname)},
  images: {
    formats: ["image/webp"],
    qualities: [75, 85],
    minimumCacheTTL: 86400,
    maximumDiskCacheSize: 512 * 1024 * 1024,
    maximumResponseBody: 8 * 1024 * 1024,
    maximumRedirects: 0,
    // Catalog images may come from any vendor; private network access remains disabled.
    remotePatterns: [{ protocol: "https", hostname: "**", port: "" }],
    localPatterns: [{ pathname: "/media/modules/**", search: "" }, { pathname: "/assets/**", search: "" }, { pathname: "/images/**", search: "" }],
  },
};
export default config;
