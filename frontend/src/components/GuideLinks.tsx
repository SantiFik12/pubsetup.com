import Link from "next/link";
import type { BlogPost } from "@/data/types";

export function GuideLinks({ posts, title, showAllLink = false }: { posts: BlogPost[]; title: string; showAllLink?: boolean }) {
  if (!posts.length) return null;
  return <section aria-label={title} className="container-page py-10">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {showAllLink && <Link prefetch={false} href="/blog" className="text-sm font-semibold text-primary hover:underline">All guides →</Link>}
    </div>
    <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map(post => <li key={post.slug} className="rounded-xl border border-border bg-card p-5">
        <Link prefetch={false} href={`/blog/${post.slug}`} className="font-semibold text-primary hover:underline">{post.title}</Link>
        <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
      </li>)}
    </ul>
  </section>;
}
