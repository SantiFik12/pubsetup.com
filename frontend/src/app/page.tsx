import View from "@/views/index";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({"title": "Magento 2 extensions catalog & expert services", "description": "Find the best Magento 2 extensions from trusted partners and get them installed by experts.", "path": "/"});
export const dynamic = "force-dynamic";
export default function Page() {
  return <View showAdminDemo={process.env.DEMO_ADMIN_ENABLED !== "0"}/>;
}
