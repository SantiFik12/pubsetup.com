import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            The trusted catalog of Magento 2 extensions and expert installation services.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Catalog</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/extensions" className="hover:text-foreground">All extensions</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "seo" }} className="hover:text-foreground">SEO</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "checkout" }} className="hover:text-foreground">Checkout</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "performance" }} className="hover:text-foreground">Performance</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Services</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services" className="hover:text-foreground">All services</Link></li>
            <li><Link to="/services/$slug" params={{ slug: "magento-2-setup-from-scratch" }} className="hover:text-foreground">Magento 2 setup</Link></li>
            <li><Link to="/services/$slug" params={{ slug: "install-magento-2-extension" }} className="hover:text-foreground">Extension install</Link></li>
            <li><Link to="/services/$slug" params={{ slug: "magento-2-speed-optimization" }} className="hover:text-foreground">Speed optimization</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/blog" className="hover:text-foreground">Blog & guides</Link></li>
            <li><Link to="/$landing" params={{ landing: "best-magento-2-seo-extensions" }} className="hover:text-foreground">Best SEO extensions</Link></li>
            <li><Link to="/$landing" params={{ landing: "magento-2-hyva-compatible-extensions" }} className="hover:text-foreground">Hyvä compatible</Link></li>
            <li><a href="https://magento.pubsetup.com" target="_blank" rel="noreferrer" className="hover:text-foreground">Live demo ↗</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} pubsetup.com — Independent Magento 2 catalog & services.</p>
          <p>Affiliate disclosure: we may earn a commission from links to partner sites.</p>
        </div>
      </div>
    </footer>
  );
}
