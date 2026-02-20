-- Fix RLS policies for customers table to allow checkout flow
-- The checkout needs to create customers without authentication

-- Drop existing customer policies
drop policy if exists "Authenticated admins manage customers" on public.customers;
drop policy if exists "Anyone can create customers" on public.customers;
drop policy if exists "Customers can view own profile" on public.customers;
drop policy if exists "Customers can update own profile" on public.customers;
drop policy if exists "Service role can manage customers" on public.customers;

-- Allow anyone (including anon) to create customers during checkout
create policy "Anyone can create customers" on public.customers
  for insert with check (true);

-- Allow anyone to read customers by email (needed for getOrCreateCustomer)
create policy "Anyone can read customers" on public.customers
  for select using (true);

-- Allow customers to update their own profile (via auth_user_id)
create policy "Customers can update own profile" on public.customers
  for update using (
    auth.uid() = auth_user_id OR 
    auth.uid() in (select id from public.admin_users)
  );

-- Admins can delete customers
create policy "Admins can delete customers" on public.customers
  for delete using (
    auth.uid() in (select id from public.admin_users)
  );

-- Also fix orders table to allow creation during checkout
drop policy if exists "Authenticated admins manage orders" on public.orders;
drop policy if exists "Anyone can create orders" on public.orders;
drop policy if exists "Customers can view own orders" on public.orders;

-- Allow anyone to create orders during checkout
create policy "Anyone can create orders" on public.orders
  for insert with check (true);

-- Allow customers to view their own orders (by email or auth_user_id)
create policy "Customers can view own orders" on public.orders
  for select using (
    auth.uid() in (select id from public.admin_users) OR
    customer_email = (select email from auth.users where id = auth.uid()) OR
    true -- Allow public read for order confirmation
  );

-- Admins can update/delete orders
create policy "Admins can manage orders" on public.orders
  for all using (
    auth.uid() in (select id from public.admin_users)
  );

-- Fix order_items table
drop policy if exists "Authenticated admins manage order_items" on public.order_items;
drop policy if exists "Anyone can create order items" on public.order_items;

-- Allow anyone to create order items during checkout
create policy "Anyone can create order items" on public.order_items
  for insert with check (true);

-- Allow public read for order items (needed for order confirmation)
create policy "Anyone can read order items" on public.order_items
  for select using (true);

-- Admins can update/delete order items
create policy "Admins can manage order items" on public.order_items
  for all using (
    auth.uid() in (select id from public.admin_users)
  );
