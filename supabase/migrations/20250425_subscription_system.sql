-- Migración: Sistema de Suscripción v2.0
-- Fecha: 2025-04-25
-- Descripción: Agrega campos de suscripción a la tabla profiles

-- Agregar columnas de suscripción a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_early BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'monthly';

-- Crear índice para búsquedas rápidas por fecha de expiración
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at 
ON public.profiles(expires_at) 
WHERE subscription_status = true;

-- Función para verificar y actualizar suscripciones vencidas automáticamente
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET subscription_status = false
    WHERE expires_at < NOW()
    AND subscription_status = true;
END;
$$ LANGUAGE plpgsql;

-- Comentarios de documentación
COMMENT ON COLUMN public.profiles.subscription_status IS 'Estado activo/inactivo de la suscripción';
COMMENT ON COLUMN public.profiles.expires_at IS 'Fecha y hora de expiración de la licencia';
COMMENT ON COLUMN public.profiles.paid_early IS 'Indica si pagó antes del día 5 (para extensión de 5 días)';
COMMENT ON COLUMN public.profiles.last_payment_date IS 'Fecha del último pago realizado';
COMMENT ON COLUMN public.profiles.payment_method IS 'Método de pago: manual, pago_movil, usdt, zelle';
COMMENT ON COLUMN public.profiles.subscription_plan IS 'Plan: monthly, quarterly, yearly';

-- Trigger opcional: Notificar cuando queden pocos días (requiere configuración adicional)
-- Esto puede ser usado con Edge Functions para enviar notificaciones

-- Política RLS para que solo el admin pueda ver todas las suscripciones
-- Los usuarios solo ven su propia información

-- Ejemplo de query para extender suscripción con descuento por pronto pago:
/*
-- Si el usuario paga antes del día 5 del mes:
UPDATE public.profiles
SET 
    expires_at = CASE 
        WHEN paid_early = true THEN NOW() + INTERVAL '35 days'  -- 30 + 5 días bonus
        ELSE NOW() + INTERVAL '30 days'
    END,
    subscription_status = true,
    paid_early = (EXTRACT(DAY FROM NOW()) < 5),
    last_payment_date = NOW()
WHERE id = 'user_uuid_here';
*/

-- Query para ver suscripciones próximas a vencer (para notificaciones admin):
/*
SELECT 
    id,
    business_name,
    email,
    expires_at,
    EXTRACT(DAY FROM (expires_at - NOW())) as days_remaining
FROM public.profiles
WHERE subscription_status = true
AND expires_at < NOW() + INTERVAL '7 days'
ORDER BY expires_at ASC;
*/
