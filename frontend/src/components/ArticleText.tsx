import Link from "next/link";
import { articleTextParts } from "@/lib/article-text";

export function ArticleText({ text }: { text: string }) {
  return <>{articleTextParts(text).map((part, i) => {
    if (part.type === "strong") return <strong key={i}>{part.text}</strong>;
    if (part.type === "code") return <code key={i} className="break-words rounded bg-surface px-1 py-0.5 text-[0.9em]">{part.text}</code>;
    if (part.type === "link") {
      const className = "text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary";
      return part.href.startsWith("http")
        ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className={className}>{part.text}</a>
        : <Link key={i} href={part.href} prefetch={false} className={className}>{part.text}</Link>;
    }
    return part.text;
  })}</>;
}
