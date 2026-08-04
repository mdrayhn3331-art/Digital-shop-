-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Admin is locked to a single email address.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT COALESCE(
    (SELECT lower(u.email) = 'mdrayhn3331@gmail.com' FROM auth.users u WHERE u.id = auth.uid()),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- PROFILES ------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Own profile insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- CATEGORIES ----------------------------------------------------------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCTS ------------------------------------------------------------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  category text,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Products admin write" ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS --------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  customer_address text,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_charge numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_number text,
  payment_txn text,
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders own or admin read" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Orders own insert" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Orders admin update" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Orders admin delete" ON public.orders
  FOR DELETE TO authenticated USING (public.is_admin());

-- APP SETTINGS --------------------------------------------------------
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text NOT NULL DEFAULT 'Digital Shop',
  logo text,
  banner text,
  bkash_number text,
  nagad_number text,
  delivery_charge numeric(10,2) NOT NULL DEFAULT 0,
  contact_phone text,
  contact_email text,
  contact_address text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Settings admin write" ON public.app_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- STORAGE POLICIES ----------------------------------------------------
CREATE POLICY "Shop images public read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'shop');
CREATE POLICY "Shop images admin write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop' AND public.is_admin());
CREATE POLICY "Shop images admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'shop' AND public.is_admin());
CREATE POLICY "Shop images admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'shop' AND public.is_admin());

-- SEED ----------------------------------------------------------------
INSERT INTO public.app_settings (app_name, bkash_number, nagad_number, delivery_charge, contact_phone, contact_email, contact_address)
VALUES ('Digital Shop', '01876872469', '01876872469', 60, '01876872469', 'mdrayhn3331@gmail.com', 'Dhaka, Bangladesh');

INSERT INTO public.categories (name) VALUES
  ('Smartphones'), ('Laptops'), ('Audio'), ('Accessories'), ('Smart Watches'), ('Gaming');

INSERT INTO public.products (name, price, description, category, stock) VALUES
  ('Aurora X Pro Smartphone', 78900, '6.7" AMOLED 120Hz display, 256GB storage, 50MP triple camera and all-day 5000mAh battery.', 'Smartphones', 12),
  ('Nimbus Lite 5G', 21500, 'Budget 5G phone with a 90Hz screen, 128GB storage and fast 33W charging.', 'Smartphones', 30),
  ('VoltBook Air 14', 112000, 'Ultra-thin 14" laptop, 16GB RAM, 512GB NVMe SSD and 18 hours of battery life.', 'Laptops', 7),
  ('VoltBook Pro 16', 189500, 'Creator laptop with a 16" 165Hz panel, 32GB RAM and dedicated graphics.', 'Laptops', 4),
  ('EchoBuds Pro ANC', 5900, 'True wireless earbuds with hybrid noise cancelling and 32 hours total playtime.', 'Audio', 45),
  ('BassRoom 40W Speaker', 4200, 'Portable Bluetooth speaker, IPX7 water resistant with deep bass drivers.', 'Audio', 25),
  ('65W GaN Fast Charger', 1850, 'Compact dual-port GaN charger that fast-charges phones and laptops.', 'Accessories', 60),
  ('Braided USB-C Cable 2m', 550, 'Nylon braided 100W USB-C cable built for daily heavy use.', 'Accessories', 120),
  ('PulseFit Watch 2', 6900, 'AMOLED smart watch with SpO2, heart rate, sleep tracking and 10-day battery.', 'Smart Watches', 22),
  ('TitanTime Sport GPS', 14900, 'Rugged GPS smart watch with 100+ sport modes and 5ATM water resistance.', 'Smart Watches', 9),
  ('StormPad Wireless Controller', 3600, 'Low-latency wireless controller with hall-effect sticks and rumble triggers.', 'Gaming', 18),
  ('RGB Mechanical Keyboard', 4800, 'Hot-swappable 87-key mechanical keyboard with per-key RGB lighting.', 'Gaming', 15);
