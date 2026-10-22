import View from "@/views/index";
import { pageMetadata } from "@/lib/seo";
import type { AdminDemoAccess } from "@/components/AdminDemo";
export const metadata = pageMetadata({"title": "Magento 2 extensions catalog & expert services", "description": "Find the best Magento 2 extensions from trusted partners and get them installed by experts.", "path": "/"});
// Credentials are intentionally public and read at runtime. An unset password shows a preview.
export const dynamic = "force-dynamic";
export default function Page() {
  const password = process.env.DEMO_ADMIN_PASSWORD;
  const enabled = process.env.DEMO_ADMIN_ENABLED !== "0";
  const demoAdmin: AdminDemoAccess | undefined = enabled && password
    ? { password }
    : process.env.NODE_ENV === "development" ? { preview: true }
    : enabled ? { preview: true, pending: true } : undefined;
  return <View demoAdmin={demoAdmin}/>;
}
