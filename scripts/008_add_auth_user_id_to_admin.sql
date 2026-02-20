-- Add auth_user_id column to admin_users table to link with Supabase Auth
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON public.admin_users(auth_user_id);

-- Update RLS policies to use auth_user_id
DROP POLICY IF EXISTS "Admins can view own data" ON public.admin_users;
CREATE POLICY "Admins can view own data"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update own data" ON public.admin_users;
CREATE POLICY "Admins can update own data"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());
