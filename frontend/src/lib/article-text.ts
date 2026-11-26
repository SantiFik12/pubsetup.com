export type ArticleTextPart = { type: "text" | "strong" | "code"; text: string } | { type: "link"; text: string; href: string };

export function articleHref(value: string): string | undefined {
  if (!value || /[\s\u0000-\u001f\u007f\\]/.test(value)) return undefined;
  if (value.startsWith("#") || (value.startsWith("/") && !value.startsWith("//"))) return value;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined;
    if (url.protocol === "https:" && url.hostname === "pubsetup.com") return url.pathname + url.search + url.hash;
    return value;
  } catch { return undefined; }
}

// A small inline subset, not HTML or a general Markdown engine. React escapes
// all text. Unsupported syntax is kept as text rather than interpreted.
export function articleTextParts(text: string): ArticleTextPart[] {
  const parts: ArticleTextPart[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > start) parts.push({ type: "text", text: text.slice(start, match.index) });
    if (match[1]) {
      const href = articleHref(match[2]);
      parts.push(href ? { type: "link", text: match[1], href } : { type: "text", text: match[0] });
    } else if (match[3]) parts.push({ type: "strong", text: match[3] });
    else parts.push({ type: "code", text: match[4] });
    start = match.index + match[0].length;
  }
  if (start < text.length) parts.push({ type: "text", text: text.slice(start) });
  return parts;
}
