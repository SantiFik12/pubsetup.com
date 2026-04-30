import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings, useInvalidateSettings, type PaddleMode } from "@/data/settings";
import { Save, FlaskConical, Zap } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings, isLoading } = useAppSettings();
  const invalidate = useInvalidateSettings();
  const [tokenLive, setTokenLive] = useState("");
  const [tokenSandbox, setTokenSandbox] = useState("");
  const [mode, setMode] = useState<PaddleMode>("sandbox");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTokenLive(settings.paddleTokenLive);
    setTokenSandbox(settings.paddleTokenSandbox);
    setMode(settings.paddleMode);
  }, [settings.paddleTokenLive, settings.paddleTokenSandbox, settings.paddleMode]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase
      .from("app_settings")
      .update({
        paddle_token_live: tokenLive.trim(),
        paddle_token_sandbox: tokenSandbox.trim(),
        paddle_mode: mode,
      })
      .eq("id", true);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    invalidate();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold">Payment settings (Paddle)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Public client-side tokens are safe to expose. Get them from Paddle Dashboard → Developer Tools → Authentication.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Active mode</div>
          <div className="inline-flex rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => setMode("sandbox")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                mode === "sandbox" ? "bg-warning/15 text-warning-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FlaskConical className="h-4 w-4" /> Sandbox
            </button>
            <button
              onClick={() => setMode("live")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                mode === "live" ? "bg-success/10 text-success" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-4 w-4" /> Live
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Paddle Live client-side token
            </label>
            <input
              type="text"
              value={tokenLive}
              onChange={(e) => setTokenLive(e.target.value)}
              placeholder="live_..."
              className="ring-focus h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Paddle Sandbox client-side token
            </label>
            <input
              type="text"
              value={tokenSandbox}
              onChange={(e) => setTokenSandbox(e.target.value)}
              placeholder="test_..."
              className="ring-focus h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm"
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        {saved && <p className="mt-4 rounded bg-success/10 p-2 text-sm text-success">Settings saved.</p>}

        <div className="mt-6">
          <button
            onClick={save}
            disabled={saving}
            className="ring-focus inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
