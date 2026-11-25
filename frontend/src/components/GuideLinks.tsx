import Link from "next/link";
import type { BlogPost } from "@/data/types";

export function GuideLinks({ posts, title }: { posts: BlogPost[]; title: string }) {
  if (!posts.length) return null;
  return <section aria-label={title} className="container-page py-10">
    <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
    <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map(post => <li key={post.slug} className="rounded-xl border border-border bg-card p-5">
        <Link prefetch={false} href={`/blog/${post.slug}`} className="font-semibold text-primary hover:underline">{post.title}</Link>
        <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
      </li>)}
    </ul>
  </section>;
}
