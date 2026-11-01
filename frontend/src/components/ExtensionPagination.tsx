"use client";

import Link from "next/link";
import { extensionListHref, paginationNumbers, type CatalogSearch } from "@/lib/extension-list";
import { cn } from "@/lib/utils";

export function ExtensionPagination({ search, page, pages }: { search: CatalogSearch; page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (number: number) => `${extensionListHref(search, number)}#extension-results`;
  const button = "ring-focus inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent";
  return (
    <nav aria-label="Extension pages" className="my-6 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} prefetch={false} className={button} rel="prev">← Previous</Link>}
      {paginationNumbers(page, pages).map((number, index) => number === "gap" ? <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">…</span> : <Link key={number} href={href(number)} prefetch={false} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} className={cn(button, number === page && "border-primary bg-primary text-primary-foreground hover:bg-primary-hover")}>{number}</Link>)}
      {page < pages && <Link href={href(page + 1)} prefetch={false} className={button} rel="next">Next →</Link>}
      <span className="basis-full text-center text-xs text-muted-foreground">Page {page} of {pages}</span>
    </nav>
  );
}
