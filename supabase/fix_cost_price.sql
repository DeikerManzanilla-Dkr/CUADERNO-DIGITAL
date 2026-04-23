-- ============================================
-- FIX: Corregir el campo cost_price_at_sale
-- ============================================

-- Hacer que cost_price_at_sale acepte NULL temporalmente
-- hasta que actualicemos la aplicación

ALTER TABLE public.sale_items 
ALTER COLUMN cost_price_at_sale DROP NOT NULL;

-- Agregar valor por defecto de 0 para evitar errores
ALTER TABLE public.sale_items 
ALTER COLUMN cost_price_at_sale SET DEFAULT 0;

-- Actualizar registros existentes si los hay
UPDATE public.sale_items 
SET cost_price_at_sale = 0 
WHERE cost_price_at_sale IS NULL;

-- ============================================
-- VERIFICACIÓN: Verificar estado de las tablas
-- ============================================

-- Verificar estructura de sale_items
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sale_items'
ORDER BY ordinal_position;

-- Contar registros en cada tabla
SELECT 'products' as tabla, count(*) as registros FROM public.products
UNION ALL
SELECT 'sales', count(*) FROM public.sales
UNION ALL
SELECT 'sale_items', count(*) FROM public.sale_items
UNION ALL
SELECT 'categories', count(*) FROM public.categories
UNION ALL
SELECT 'inventory_movements', count(*) FROM public.inventory_movements;
