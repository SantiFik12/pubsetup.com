import { createFileRoute, Link } from "@tanstack/react-router";
import { useBlogPost, useExtension, usePartner, useCatalog } from "@/data/catalog";
import { tagSlug } from "@/lib/slug";
import { ExternalLink, Zap } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("blog_posts")
      .select("title, excerpt, cover")
      .eq("slug", params.slug)
      .maybeSingle();
    return { post: data };
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post as { title?: string; excerpt?: string; cover?: string } | null;
    const title = post?.title ? `${post.title} — pubsetup.com` : "Article — pubsetup.com";
    const desc = post?.excerpt?.slice(0, 158) || "Magento 2 guides, reviews and comparisons.";
    const url = `https://pubsetup.com/blog/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(post?.cover ? [{ property: "og:image", content: post.cover }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: BlogPostPage,
});

function ExtensionCardBlock({ extensionSlug }: { extensionSlug: string }) {
  const ext = useExtension(extensionSlug);
  const partner = usePartner(ext?.partnerId);
  if (!ext || !partner) return null;
  return (
    <div className="my-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-primary">{partner.logoLetter}</div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">{partner.name}</div>
          <Link to="/extension/$slug" params={{ slug: ext.slug }} className="text-base font-semibold text-foreground hover:text-primary">{ext.name}</Link>
          <p className="mt-1 text-sm text-muted-foreground">{ext.shortDescription}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={ext.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
              Buy via partner <ExternalLink className="h-3 w-3" />
            </a>
            <Link to="/checkout" search={{ service: "install-magento-2-extension", extension: ext.slug }} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface">
              <Zap className="h-3 w-3" /> Order installation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { isLoading } = useCatalog();
  const post = useBlogPost(slug);
  if (isLoading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  if (!post) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-block text-primary">Back to blog</Link>
      </div>
    );
  }

  return (
    <article>
      <header className="border-b border-border bg-surface">
        <div className="container-page max-w-3xl py-14">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">← Blog</Link>
          <span className="mt-4 inline-block rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground shadow-soft">{post.category}</span>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">{post.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{post.author}</span>
            <span>·</span>
            <span>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span>·</span>
            <span>{post.readMinutes} min read</span>
          </div>
        </div>
      </header>

      <div className="container-page max-w-3xl py-12">
        {post.toc.length > 0 && (
          <nav className="mb-10 rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Table of contents</p>
            <ol className="space-y-1 text-sm">
              {post.toc.map((item: { id: string; label: string }) => (
                <li key={item.id}><a href={`#${item.id}`} className="text-primary hover:underline">{item.label}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <div className="space-y-5">
          {post.content.map((block: { type: string; text?: string; items?: string[]; extensionSlug?: string }, i: number) => {
            if (block.type === "p") return <p key={i} className="leading-relaxed text-foreground">{block.text}</p>;
            if (block.type === "h2") {
              const id = block.text?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              return <h2 key={i} id={id} className="mt-8 text-2xl font-bold tracking-tight text-foreground">{block.text}</h2>;
            }
            if (block.type === "list") return (
              <ul key={i} className="ml-5 list-disc space-y-1.5 text-foreground">
                {block.items?.map((it: string) => <li key={it}>{it}</li>)}
              </ul>
            );
            if (block.type === "extension-card" && block.extensionSlug) {
              return <ExtensionCardBlock key={i} extensionSlug={block.extensionSlug} />;
            }
            return null;
          })}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map((t: string) => (
              <Link key={t} to="/tag/$slug" params={{ slug: tagSlug(t) }} className="rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">{t}</Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
