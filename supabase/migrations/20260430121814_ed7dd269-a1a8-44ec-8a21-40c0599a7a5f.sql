CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true,
  paddle_token_live text NOT NULL DEFAULT '',
  paddle_token_sandbox text NOT NULL DEFAULT '',
  paddle_mode text NOT NULL DEFAULT 'sandbox' CHECK (paddle_mode IN ('live','sandbox')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = true)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "admin write settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT DO NOTHING;