-- Add individual address columns to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS postal_code text;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_customers_city ON public.customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_country ON public.customers(country);
