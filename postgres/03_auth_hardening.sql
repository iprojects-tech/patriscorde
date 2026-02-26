ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz;

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz;

-- Optional bootstrap for the main admin if no password hash exists.
-- Temporary password: admin123
UPDATE public.admin_users
SET password_hash = crypt('admin123', gen_salt('bf')),
    password_updated_at = NOW()
WHERE lower(email) = 'admin@atelier.com'
  AND (password_hash IS NULL OR length(password_hash) = 0);
