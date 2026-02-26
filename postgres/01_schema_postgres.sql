CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'manager'::text NOT NULL,
  created_at timestamptz DEFAULT now(),
  auth_user_id uuid,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_email_key UNIQUE (email),
  CONSTRAINT admin_users_auth_user_id_key UNIQUE (auth_user_id),
  CONSTRAINT admin_users_role_check CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text]))
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image text,
  status text DEFAULT 'active'::text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_slug_key UNIQUE (slug),
  CONSTRAINT categories_status_check CHECK (status = ANY (ARRAY['active'::text, 'draft'::text, 'archived'::text]))
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  name text,
  phone text,
  address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auth_user_id uuid,
  city text,
  state text,
  neighborhood text,
  country text,
  postal_code text,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_email_key UNIQUE (email),
  CONSTRAINT customers_auth_user_id_key UNIQUE (auth_user_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_number text NOT NULL,
  customer_id uuid,
  customer_email text NOT NULL,
  customer_name text,
  status text DEFAULT 'pending'::text NOT NULL,
  subtotal integer NOT NULL,
  shipping integer DEFAULT 0 NOT NULL,
  tax integer DEFAULT 0 NOT NULL,
  total integer NOT NULL,
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text]))
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sku text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price integer NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  category_id uuid,
  main_image text,
  gallery text[],
  featured boolean DEFAULT false,
  variants jsonb DEFAULT '{"sizes": [], "colors": []}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_sku_key UNIQUE (sku),
  CONSTRAINT products_slug_key UNIQUE (slug),
  CONSTRAINT products_status_check CHECK (status = ANY (ARRAY['active'::text, 'draft'::text, 'archived'::text]))
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  product_image text,
  quantity integer NOT NULL,
  unit_price integer NOT NULL,
  total_price integer NOT NULL,
  variant_size text,
  variant_color text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.saved_carts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  auth_user_id uuid NOT NULL,
  cart_data jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT saved_carts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_carts_auth_user_id_key UNIQUE (auth_user_id)
);

ALTER TABLE ONLY public.order_items
  ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items
  ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.orders
  ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.products
  ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON public.admin_users USING btree (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers USING btree (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_city ON public.customers USING btree (city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON public.customers USING btree (state);
CREATE INDEX IF NOT EXISTS idx_customers_neighborhood ON public.customers USING btree (neighborhood);
CREATE INDEX IF NOT EXISTS idx_customers_country ON public.customers USING btree (country);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products USING btree (featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products USING btree (status);
CREATE INDEX IF NOT EXISTS idx_saved_carts_auth_user_id ON public.saved_carts USING btree (auth_user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.order_number := 'ATL-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = user_id OR auth_user_id = user_id
  );
END;
$$;

CREATE OR REPLACE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION public.generate_order_number();

CREATE OR REPLACE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_saved_carts_updated_at
BEFORE UPDATE ON public.saved_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- NOTE:
-- This schema intentionally excludes Supabase-specific auth schema objects,
-- auth triggers, service_role grants, and auth.uid()-based policies.
-- If you want RLS in plain PostgreSQL, implement it with your app auth context.
