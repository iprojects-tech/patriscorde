-- Create a trigger to automatically create a customer profile when a new user signs up
-- This runs with security definer privileges, bypassing RLS

-- First, add an INSERT policy that allows authenticated users to create their own profile
DROP POLICY IF EXISTS "Customers can insert own data" ON public.customers;
CREATE POLICY "Customers can insert own data"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (auth_user_id, email, name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', null)
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;

-- Create trigger that fires after a new user is created
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer();
