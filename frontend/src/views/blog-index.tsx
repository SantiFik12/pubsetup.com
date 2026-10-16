"use client";
import { Link } from "@/components/Link";
import { useBlogPosts } from "@/data/catalog";



export default function BlogPage() {
  const blogPosts = useBlogPosts();
  const categories = Array.from(new Set(blogPosts.map((p) => p.category)));
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">Magento 2 blog & guides</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Independent reviews, side-by-side comparisons and battle-tested guides.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">{c}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="container-page py-12">
        {blogPosts.length === 0 ? (
          <p className="text-center text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                <div className="aspect-[16/9] bg-brand-gradient relative">
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">{p.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-base font-semibold text-foreground group-hover:text-primary">{p.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>{p.readMinutes} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
