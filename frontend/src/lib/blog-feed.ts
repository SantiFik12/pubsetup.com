import type { BlogPost } from "../data/types";

export function latestBlogPosts(posts: BlogPost[], limit = 6): BlogPost[] {
  return posts.slice().sort((a, b) =>
    b.date.localeCompare(a.date)
    || ((Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0))
    || a.slug.localeCompare(b.slug)).slice(0, limit);
}
