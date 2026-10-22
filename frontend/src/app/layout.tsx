import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl, pageMetadata, siteUrl } from "@/lib/seo";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CatalogProvider } from "@/data/catalog";
import { getCatalog } from "@/lib/catalog.server";
import type { Metadata } from "next";
import "../styles.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
 ...pageMetadata({title:"Magento 2 extensions catalog & expert services", description:"Find the best Magento 2 extensions from trusted partners and get them installed by experts.", path:"/"}),
 metadataBase: new URL(siteUrl),
 verification: {google:"VKqI55icHAyQs79euvUvHMP78ZXEKYtxqqcU7G7veQw"},
 icons: {icon:"/favicon.ico",apple:"/apple-touch-icon.png"}, manifest:"/site.webmanifest",

};
export default async function Layout({children}: {children:React.ReactNode}) {
 const catalog = await getCatalog();
 return <html lang="en"><head><script src="https://analytics.ahrefs.com/analytics.js" data-key="+57NM94/ggY+Gia5wYJa9A" async/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap"/></head><body><JsonLd data={{"@context":"https://schema.org","@graph":[
 {"@type":"Organization","@id":absoluteUrl("/#organization"),name:"pubsetup.com",url:absoluteUrl("/"),logo:absoluteUrl("/assets/logo.png")},
 {"@type":"WebSite","@id":absoluteUrl("/#website"),name:"pubsetup.com",url:absoluteUrl("/"),publisher:{"@id":absoluteUrl("/#organization")},inLanguage:"en"}
 ]}}/><CatalogProvider catalog={catalog}><div className="flex min-h-screen flex-col bg-background"><Header/><main className="flex-1">{children}</main><Footer/></div></CatalogProvider></body></html>;
}
