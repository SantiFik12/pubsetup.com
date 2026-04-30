-- Add image and user guide fields to extensions
ALTER TABLE public.extensions
  ADD COLUMN IF NOT EXISTS cover_image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS user_guide_url text NOT NULL DEFAULT '';

-- Create public storage bucket for extension images
INSERT INTO storage.buckets (id, name, public)
VALUES ('extension-images', 'extension-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for this bucket
CREATE POLICY "public read extension images"
ON storage.objects FOR SELECT
USING (bucket_id = 'extension-images');

CREATE POLICY "admin upload extension images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'extension-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update extension images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'extension-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete extension images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'extension-images' AND public.has_role(auth.uid(), 'admin'));