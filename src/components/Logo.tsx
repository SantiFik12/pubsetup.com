import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center ${className}`} aria-label="pubsetup.com">
      <img src={logo} alt="pubsetup.com" className="h-8 w-auto" />
    </Link>
  );
}
