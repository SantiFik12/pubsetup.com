drop policy if exists "anyone can create order" on public.orders;
create policy "anyone can create order"
  on public.orders for insert to anon, authenticated
  with check (
    length(customer_name) between 1 and 200
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and amount >= 0
    and status = 'pending'
    and service_id is not null
  );