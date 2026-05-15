import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Menu, X } from "lucide-react";
import { useState } from "react";


const nav = [
  { to: "/extensions", label: "Extensions" },
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Blog" },
  { to: "/compare", label: "Compare" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-surface" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="https://magento.pubsetup.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Live demo ↗
          </a>
          <Link
            to="/services/$slug"
            params={{ slug: "magento-2-setup-from-scratch" }}
            className="ring-focus rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-hover"
          >
            Get Magento 2 Setup
          </Link>
        </div>
        <button
          className="ring-focus rounded-md p-2 text-foreground md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/services/$slug"
              params={{ slug: "magento-2-setup-from-scratch" }}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Get Magento 2 Setup
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
