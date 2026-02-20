-- First, add auth_user_id to customers table to link with Supabase Auth
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for auth_user_id lookup
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- Add policy for customers to manage their own data
DROP POLICY IF EXISTS "Customers can view own data" ON public.customers;
CREATE POLICY "Customers can view own data"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own data" ON public.customers;
CREATE POLICY "Customers can update own data"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Create saved_carts table for logged-in users
CREATE TABLE IF NOT EXISTS public.saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own cart
DROP POLICY IF EXISTS "Users can view own cart" ON public.saved_carts;
CREATE POLICY "Users can view own cart"
  ON public.saved_carts
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own cart" ON public.saved_carts;
CREATE POLICY "Users can insert own cart"
  ON public.saved_carts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own cart" ON public.saved_carts;
CREATE POLICY "Users can update own cart"
  ON public.saved_carts
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own cart" ON public.saved_carts;
CREATE POLICY "Users can delete own cart"
  ON public.saved_carts
  FOR DELETE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_carts_auth_user_id ON public.saved_carts(auth_user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE TRIGGER update_saved_carts_updated_at 
  BEFORE UPDATE ON public.saved_carts
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
