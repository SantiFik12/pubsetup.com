import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-primary-foreground shadow-soft">
        i.
      </span>
      <span className="text-base font-semibold tracking-tight text-foreground">
        implement<span className="text-primary">.it</span>
      </span>
    </Link>
  );
}
