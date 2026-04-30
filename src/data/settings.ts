import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaddleMode = "live" | "sandbox";

export interface AppSettings {
  paddleTokenLive: string;
  paddleTokenSandbox: string;
  paddleMode: PaddleMode;
}

const EMPTY: AppSettings = {
  paddleTokenLive: "",
  paddleTokenSandbox: "",
  paddleMode: "sandbox",
};

async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("paddle_token_live, paddle_token_sandbox, paddle_mode")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY;
  return {
    paddleTokenLive: data.paddle_token_live ?? "",
    paddleTokenSandbox: data.paddle_token_sandbox ?? "",
    paddleMode: (data.paddle_mode as PaddleMode) ?? "sandbox",
  };
}

export function useAppSettings() {
  const q = useQuery({
    queryKey: ["app_settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
  return { settings: q.data ?? EMPTY, isLoading: q.isLoading, error: q.error };
}

export function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["app_settings"] });
}

export function activePaddleToken(s: AppSettings): string {
  return s.paddleMode === "live" ? s.paddleTokenLive : s.paddleTokenSandbox;
}
