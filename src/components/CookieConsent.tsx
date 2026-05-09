import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const KEY = "pubsetup:cookie-consent";
type Choice = "accepted" | "rejected";

function read(): Choice | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

function applyChoice(choice: Choice) {
  localStorage.setItem(KEY, choice);
  // Toggle Jolt analytics script based on consent
  const existing = document.querySelector<HTMLScriptElement>('script[data-domain="pubsetup.com"]');
  if (choice === "accepted") {
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://usejolt.io/jolt.js";
      s.async = true;
      s.setAttribute("data-domain", "pubsetup.com");
      s.setAttribute("data-api-host", "https://usejolt.io/api/event");
      document.head.appendChild(s);
    }
  } else if (existing) {
    existing.remove();
  }
}

export function CookieConsent() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = read();
    setChoice(current);
    if (current) applyChoice(current);
  }, []);

  if (!mounted || choice) return null;

  const decide = (c: Choice) => {
    applyChoice(c);
    setChoice(c);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur"
    >
      <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground md:max-w-2xl">
          We use strictly necessary cookies to make pubsetup.com work, and a privacy-friendly
          analytics cookie to understand how the catalog is used. Read our{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("rejected")}>
            Reject non-essential
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
