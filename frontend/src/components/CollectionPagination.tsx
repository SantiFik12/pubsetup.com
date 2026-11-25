import Link from "next/link";
import { paginationNumbers } from "@/lib/extension-list";

export function CollectionPagination({ basePath, page, pages }: { basePath: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (number: number) => `${basePath}${number > 1 ? `?page=${number}` : ""}#collection-results`;
  const button = "ring-focus inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent";
  return <nav aria-label="Collection pages" className="container-page my-6 flex flex-wrap items-center justify-center gap-2">
    {page > 1 && <Link prefetch={false} href={href(page - 1)} rel="prev" className={button}>← Previous</Link>}
    {paginationNumbers(page, pages).map((number, i) => number === "gap" ? <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">…</span> : <Link key={number} prefetch={false} href={href(number)} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} className={`${button}${page === number ? " border-primary bg-primary text-primary-foreground hover:bg-primary-hover" : ""}`}>{number}</Link>)}
    {page < pages && <Link prefetch={false} href={href(page + 1)} rel="next" className={button}>Next →</Link>}
    <span className="basis-full text-center text-xs text-muted-foreground">Page {page} of {pages}</span>
  </nav>;
}
