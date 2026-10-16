import View from "@/views/checkout";
import type { Metadata } from "next";
export const metadata: Metadata = {"title": "Checkout \u2014 pubsetup.com", "description": "Order a Magento 2 service.", "alternates": {"canonical": "/checkout"}, "robots": {"index": false, "follow": true}};
export default function Page() { return <View/>; }
