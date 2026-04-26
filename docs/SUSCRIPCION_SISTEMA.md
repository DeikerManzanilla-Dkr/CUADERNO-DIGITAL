# 📅 Sistema de Suscripción Cuaderno Digital v2.0

## 🎯 Resumen

Sistema de gestión de licencias mensuales con descuentos por pronto pago y gestión manual de pagos.

---

## 🗄️ Estructura de Base de Datos

### Tabla `profiles` - Campos de Suscripción

| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `subscription_status` | BOOLEAN | Activo/Inactivo | true |
| `expires_at` | TIMESTAMP | Fecha de expiración | null |
| `paid_early` | BOOLEAN | Pagó antes del día 5 | false |
| `last_payment_date` | TIMESTAMP | Último pago realizado | null |
| `payment_method` | TEXT | Método: manual, pago_movil, usdt | 'manual' |
| `subscription_plan` | TEXT | Plan: monthly, quarterly | 'monthly' |

---

## 💰 Lógica de Descuentos y Beneficios

### 🎯 Descuento por Pronto Pago

**Regla:** Si el usuario paga antes del día 5 de cada mes:
- ✅ Obtiene **5 días extra** de licencia (35 días total)
- ✅ Se marca el campo `paid_early = true`
- ✅ Aplicable en pagos manuales (Pago Móvil, USDT, Zelle)

**Cálculo en el código:**
```typescript
// Si pagó antes del día 5, extender 5 días extra
const finalDays = profile.paid_early && days > 0 ? days + 5 : days;
```

### 📊 Alertas Visuales en la App

| Días Restantes | Color | Icono | Acción |
|----------------|-------|-------|--------|
| > 7 días | 🟢 Verde | Reloj | Normal |
| 3-7 días | 🟡 Ámbar | Reloj | Aviso |
| ≤ 3 días | 🔴 Rojo | Alerta | Urgente |
| Vencida | 🔴 Rojo | Alerta | Bloqueo próximo |

---

## 🔄 Flujo de Gestión de Pagos (Manual)

### 1. Usuario Realiza Pago
```
Paso 1: Usuario envía comprobante de pago (captura/referencia)
        → Vía WhatsApp o sección "Mi Suscripción"
```

### 2. Validación por Admin
```sql
-- Query para ver usuarios con suscripción próxima a vencer
SELECT 
    id,
    business_name,
    email,
    expires_at,
    EXTRACT(DAY FROM (expires_at - NOW())) as days_remaining,
    paid_early
FROM public.profiles
WHERE subscription_status = true
AND expires_at < NOW() + INTERVAL '7 days'
ORDER BY expires_at ASC;
```

### 3. Extender Suscripción
```sql
-- Extender licencia por 30 días (o 35 si pagó antes del día 5)
UPDATE public.profiles
SET 
    expires_at = CASE 
        WHEN EXTRACT(DAY FROM NOW()) < 5 THEN NOW() + INTERVAL '35 days'
        ELSE NOW() + INTERVAL '30 days'
    END,
    subscription_status = true,
    paid_early = (EXTRACT(DAY FROM NOW()) < 5),
    last_payment_date = NOW(),
    payment_method = 'pago_movil' -- o 'usdt', 'zelle', 'manual'
WHERE id = 'uuid-del-usuario';
```

---

## 📱 Notificaciones al Usuario

### En el Navbar (Ya Implementado)
- Badge con días restantes
- Color cambia según proximidad de vencimiento
- Versión móvil: punto indicador cuando ≤ 7 días

### WhatsApp de Adquisición (En Auth.tsx)
- Link directo con mensaje pre-llenado
- Botón visible en pantalla de login
- Tarjeta de beneficios con descuento destacado

---

## 🛠️ Configuración Inicial

### 1. Ejecutar Migración SQL

```bash
# En Supabase SQL Editor, ejecutar:
\i supabase/migrations/20250425_subscription_system.sql
```

### 2. Configurar Usuario Admin

```sql
-- Marcar al primer usuario como activo por defecto
UPDATE public.profiles
SET 
    subscription_status = true,
    expires_at = NOW() + INTERVAL '30 days',
    paid_early = false
WHERE id = 'uuid-del-admin';
```

### 3. Edge Function Opcional (Para notificaciones automáticas)

Crear en `supabase/functions/notify-expiring/index.ts` para enviar:
- Notificaciones push 7 días antes
- Recordatorios por WhatsApp 3 días antes
- Alerta final 1 día antes

---

## 📊 Queries Útiles para Admin

### Verificar Suscripciones Activas
```sql
SELECT 
    p.business_name,
    p.email,
    p.expires_at,
    p.paid_early,
    EXTRACT(DAY FROM (p.expires_at - NOW())) as days_left,
    CASE 
        WHEN p.expires_at < NOW() THEN 'Vencida'
        WHEN p.expires_at < NOW() + INTERVAL '3 days' THEN 'Crítica'
        WHEN p.expires_at < NOW() + INTERVAL '7 days' THEN 'Próxima'
        ELSE 'Activa'
    END as status
FROM public.profiles p
WHERE p.subscription_status = true
ORDER BY p.expires_at ASC;
```

### Extender Suscripción con Bonus
```sql
-- Aplicar pago con bonus de 5 días
UPDATE public.profiles
SET 
    expires_at = NOW() + INTERVAL '35 days',
    paid_early = true,
    last_payment_date = NOW()
WHERE id = 'user-uuid';
```

### Desactivar Suscripción Vencida
```sql
-- Auto-desactivar vencidas (puede ser un cron job)
UPDATE public.profiles
SET subscription_status = false
WHERE expires_at < NOW()
AND subscription_status = true;
```

---

## 🎨 UI/UX Implementada

### Pantalla de Login (Auth.tsx)
- ✅ Botón WhatsApp con mensaje pre-llenado
- ✅ Tarjeta de beneficios con diseño elegante
- ✅ Destacado del descuento por pronto pago

### Navbar (AppLayout.tsx)
- ✅ Badge de días restantes (Desktop)
- ✅ Indicador visual móvil (≤ 7 días)
- ✅ Colores según urgencia

---

## 🔒 Seguridad

- RLS: Usuarios solo ven su propia información de suscripción
- Solo admin puede modificar fechas de expiración
- Validación de fechas en el frontend y backend

---

## 📞 Soporte y Contacto

Para adquirir o renovar licencia:
- **WhatsApp:** [Link directo en Auth.tsx]
- **Mensaje automático:** "Hola, quiero adquirir una licencia para Cuaderno Digital. Mi nombre es..."

---

*Sistema desarrollado para Cuaderno Digital v2.0 "Rayo"*
