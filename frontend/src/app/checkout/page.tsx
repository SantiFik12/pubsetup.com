import View from "@/views/checkout";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({"title": "Checkout", "description": "Order a Magento 2 service.", "path": "/checkout", "index": false});
export default function Page() { return <View/>; }
