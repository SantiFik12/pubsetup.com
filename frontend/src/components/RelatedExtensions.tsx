import type { Catalog } from "@/data/mappers";
import type { Extension } from "@/data/types";
import { relatedExtensions } from "@/lib/related-extensions";
import { ModuleLink } from "./ModuleLink";

export function RelatedExtensions({ catalog, item }: { catalog: Catalog; item: Extension }) {
  const related = relatedExtensions(catalog.extensions, item);
  if (!related.length) return null;
  return <section aria-labelledby="related-extensions-heading" className="container-page py-10">
    <h2 id="related-extensions-heading" className="text-2xl font-bold tracking-tight text-foreground">Related extensions to explore</h2>
    <p className="mt-3 text-sm text-muted-foreground">Explore products with a similar focus. Check each vendor’s features and compatibility before choosing.</p>
    <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {related.map(extension => <li key={extension.slug} className="rounded-xl border border-border bg-card p-5">
        <ModuleLink slug={extension.slug} className="font-semibold text-primary hover:underline">{extension.name}</ModuleLink>
        <p className="mt-2 text-xs text-muted-foreground">{catalog.partners.find(partner => partner.id === extension.partnerId)?.name}</p>
        <p className="mt-2 text-sm text-muted-foreground">{extension.shortDescription}</p>
      </li>)}
    </ul>
  </section>;
}
