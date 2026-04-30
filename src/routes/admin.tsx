import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, Wrench, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — pubsetup.com" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) return <div className="container-page py-20 text-center text-muted-foreground">Loading…</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">Your account does not have admin access.</p>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/extensions" className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-surface" activeProps={{ className: "ring-focus inline-flex items-center gap-2 rounded-lg border border-primary bg-brand-soft px-3 py-2 text-sm font-semibold text-primary" }}>
            <Package className="h-4 w-4" /> Extensions
          </Link>
          <Link to="/admin/services" className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-surface" activeProps={{ className: "ring-focus inline-flex items-center gap-2 rounded-lg border border-primary bg-brand-soft px-3 py-2 text-sm font-semibold text-primary" }}>
            <Wrench className="h-4 w-4" /> Services
          </Link>
          <Link to="/admin/settings" className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-surface" activeProps={{ className: "ring-focus inline-flex items-center gap-2 rounded-lg border border-primary bg-brand-soft px-3 py-2 text-sm font-semibold text-primary" }}>
            <SettingsIcon className="h-4 w-4" /> Settings
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}
            className="ring-focus inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-surface"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
