// Preserve URLs used by the earlier SQL seed and the original static catalog.
export const serviceAliases: Record<string, string> = {
  "extension-installation": "install-magento-2-extension",
  "install-security-patches": "security-patches-installation",
};
export function canonicalServiceSlug(slug: string) { return serviceAliases[slug] ?? slug; }
