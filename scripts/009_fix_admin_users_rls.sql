-- Fix RLS policies for admin_users table to allow admins to manage other admins

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;

-- Create new policies that allow admins to manage other admin users
-- An admin is someone whose auth.uid() matches either id or auth_user_id in admin_users

CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert admin users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE (id = auth.uid() OR auth_user_id = auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin users"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE (id = auth.uid() OR auth_user_id = auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete admin users"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE (id = auth.uid() OR auth_user_id = auth.uid())
      AND role = 'admin'
    )
  );
