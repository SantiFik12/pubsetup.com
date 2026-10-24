"use client";
import { ExtensionCard } from "@/components/ExtensionCard";
import { Link } from "@/components/Link";
import type { Category, Extension } from "@/data/types";



export default function CategoryPage({ category: cat, extensions: list }: { category: Category; extensions: Extension[] }) {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12">
          <Link to="/extensions" className="text-sm text-muted-foreground hover:text-foreground">← All extensions</Link>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">{cat.name} extensions for Magento 2</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{cat.description}</p>
        </div>
      </section>
      <section className="container-page py-10">
        <p className="mb-6 text-sm text-muted-foreground">{list.length} extensions in this category</p>
        {list.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <ExtensionCard key={e.id} ext={e} />)}
        </div> : <p className="text-muted-foreground">No extensions are listed in this collection yet. <Link to="/extensions" className="text-primary hover:underline">Browse all extensions</Link>.</p>}
      </section>
    </>
  );
}
