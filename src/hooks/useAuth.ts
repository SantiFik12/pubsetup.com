import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleReloadKey, setRoleReloadKey] = useState(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setRoleError(null);
      setRoleLoading(false);
      return;
    }

    let cancelled = false;
    setRoleLoading(true);
    setRoleError(null);

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("[useAuth] role fetch error:", error);
          setRoleError(error.message);
          setRoleLoading(false);
          return;
        }

        setIsAdmin(!!data);
        setRoleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, roleReloadKey]);

  return {
    session,
    user,
    isAdmin,
    loading: authLoading || roleLoading,
    roleError,
    refreshRole: () => setRoleReloadKey((value) => value + 1),
  };
}
