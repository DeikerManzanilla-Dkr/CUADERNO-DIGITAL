
-- Add user_id to products
ALTER TABLE public.products ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to sales
ALTER TABLE public.sales ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to sale_items
ALTER TABLE public.sale_items ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow all access to sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all access to sale_items" ON public.sale_items;

-- Products: users see/manage only their own
CREATE POLICY "Users manage own products"
ON public.products FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Sales: users see/manage only their own
CREATE POLICY "Users manage own sales"
ON public.sales FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Sale items: users see/manage only their own
CREATE POLICY "Users manage own sale_items"
ON public.sale_items FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
