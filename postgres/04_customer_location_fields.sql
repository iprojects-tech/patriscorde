ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS neighborhood text;

CREATE INDEX IF NOT EXISTS idx_customers_state ON public.customers USING btree (state);
CREATE INDEX IF NOT EXISTS idx_customers_neighborhood ON public.customers USING btree (neighborhood);
