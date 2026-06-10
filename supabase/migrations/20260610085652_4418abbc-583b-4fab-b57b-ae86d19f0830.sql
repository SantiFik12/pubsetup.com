DROP POLICY IF EXISTS "insert can read own order_code" ON public.orders;
CREATE POLICY "public can read order code" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (true);