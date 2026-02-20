-- Fix infinite recursion in RLS policies

-- Drop problematic policies
drop policy if exists "Admins can do everything on categories" on public.categories;
drop policy if exists "Admins can do everything on products" on public.products;
drop policy if exists "Admins can view their own profile" on public.admin_users;
drop policy if exists "Admins can view all admin users" on public.admin_users;
drop policy if exists "Admins can do everything on customers" on public.customers;
drop policy if exists "Admins can do everything on orders" on public.orders;
drop policy if exists "Admins can do everything on order_items" on public.order_items;

-- Recreate admin_users policies without recursion
-- Allow users to view their own admin profile (no subquery needed)
create policy "Users can view own admin profile" on public.admin_users
  for select using (auth.uid() = id);

-- Allow admins to insert/update/delete their profile
create policy "Users can update own admin profile" on public.admin_users
  for update using (auth.uid() = id);

-- For admin operations on other tables, check auth.uid() directly against admin_users.id
-- This avoids the recursive check

-- Categories: Admins can manage all
create policy "Authenticated admins manage categories" on public.categories
  for all using (
    auth.uid() in (select id from public.admin_users)
  );

-- Products: Admins can manage all  
create policy "Authenticated admins manage products" on public.products
  for all using (
    auth.uid() in (select id from public.admin_users)
  );

-- Customers: Admins can manage all
create policy "Authenticated admins manage customers" on public.customers
  for all using (
    auth.uid() in (select id from public.admin_users)
  );

-- Orders: Admins can manage all
create policy "Authenticated admins manage orders" on public.orders
  for all using (
    auth.uid() in (select id from public.admin_users)
  );

-- Order items: Admins can manage all
create policy "Authenticated admins manage order_items" on public.order_items
  for all using (
    auth.uid() in (select id from public.admin_users)
  );
