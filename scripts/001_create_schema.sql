-- Atelier E-commerce Database Schema

-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image text,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  description text,
  price integer not null, -- stored in cents
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  category_id uuid references public.categories(id) on delete set null,
  main_image text,
  gallery text[], -- array of image URLs
  featured boolean default false,
  variants jsonb default '{"sizes": [], "colors": []}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Admin users table (extends auth.users)
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'manager' check (role in ('admin', 'manager')),
  created_at timestamp with time zone default now()
);

-- Customers table (for store customers)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  phone text,
  address jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text not null,
  customer_name text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal integer not null, -- in cents
  shipping integer not null default 0, -- in cents
  tax integer not null default 0, -- in cents
  total integer not null, -- in cents
  shipping_address jsonb,
  billing_address jsonb,
  stripe_session_id text,
  stripe_payment_intent_id text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text not null,
  product_image text,
  quantity integer not null,
  unit_price integer not null, -- in cents
  total_price integer not null, -- in cents
  variant_size text,
  variant_color text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public read access for categories and products (storefront)
create policy "Public can view active categories" on public.categories
  for select using (status = 'active');

create policy "Public can view active products" on public.products
  for select using (status = 'active');

-- Admin full access policies
create policy "Admins can do everything on categories" on public.categories
  for all using (
    exists (select 1 from public.admin_users where id = auth.uid())
  );

create policy "Admins can do everything on products" on public.products
  for all using (
    exists (select 1 from public.admin_users where id = auth.uid())
  );

create policy "Admins can view their own profile" on public.admin_users
  for select using (auth.uid() = id);

create policy "Admins can view all admin users" on public.admin_users
  for select using (
    exists (select 1 from public.admin_users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can do everything on customers" on public.customers
  for all using (
    exists (select 1 from public.admin_users where id = auth.uid())
  );

create policy "Admins can do everything on orders" on public.orders
  for all using (
    exists (select 1 from public.admin_users where id = auth.uid())
  );

create policy "Admins can do everything on order_items" on public.order_items
  for all using (
    exists (select 1 from public.admin_users where id = auth.uid())
  );

-- Public can insert orders (checkout)
create policy "Public can create orders" on public.orders
  for insert with check (true);

create policy "Public can create order items" on public.order_items
  for insert with check (true);

create policy "Public can view their orders by email" on public.orders
  for select using (true);

-- Create indexes for performance
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_featured on public.products(featured);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_categories_updated_at before update on public.categories
  for each row execute function public.update_updated_at_column();

create trigger update_products_updated_at before update on public.products
  for each row execute function public.update_updated_at_column();

create trigger update_customers_updated_at before update on public.customers
  for each row execute function public.update_updated_at_column();

create trigger update_orders_updated_at before update on public.orders
  for each row execute function public.update_updated_at_column();

-- Function to generate order number
create or replace function public.generate_order_number()
returns trigger as $$
begin
  new.order_number = 'ATL-' || to_char(now(), 'YYYYMMDD') || '-' || 
    lpad(floor(random() * 10000)::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_order_number before insert on public.orders
  for each row when (new.order_number is null)
  execute function public.generate_order_number();
