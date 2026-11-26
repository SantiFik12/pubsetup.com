export const moduleHref = (slug: string) => `/extension/${encodeURIComponent(slug)}`;

// Counting must never delay or replace the actual navigation. Keep the legacy
// endpoint for old links, but do not follow its redirect for this background hit.
export async function recordModuleClick(slug: string, fetcher: typeof fetch = fetch): Promise<void> {
  try {
    await fetcher(`/go/module/${encodeURIComponent(slug)}`, { redirect: "manual", keepalive: true, cache: "no-store" });
  } catch { /* Best-effort analytics; navigation is independent. */ }
}

export function moduleDisplayName(name: string): string {
  return name.replace(/^Magento\s+2(?:\s*[-:–—]\s*|\s+)/i, "").replace(/\s+for Magento 2$/i, "");
}
