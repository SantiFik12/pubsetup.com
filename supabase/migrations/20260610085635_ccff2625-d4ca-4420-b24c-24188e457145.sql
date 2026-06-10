DROP POLICY IF EXISTS "anyone can create order" ON public.orders;
CREATE POLICY "anyone can create order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(customer_name) BETWEEN 1 AND 200
    AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    AND amount >= 0
    AND status = 'pending'::order_status
    AND service_id IS NOT NULL
  );

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT (order_code, id) ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

DROP POLICY IF EXISTS "insert can read own order_code" ON public.orders;
CREATE POLICY "insert can read own order_code" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (false);