# 📒 Cuaderno Digital - Sistema POS Profesional

## ⚡ Versión 2.0 "Rayo" - Optimizada para Velocidad y Móvil

<p align="center">
  <img src="https://img.shields.io/badge/Versión-2.0%20Rayo-cyan?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase" />
</p>

---

## 🎯 Características Principales

### 🚀 Rendimiento Optimizado
- ⚡ **Carga ultrarrápida** - Construido con Vite para tiempos de compilación mínimos
- 📱 **PWA Ready** - Diseño responsive optimizado para tablets y móviles
- 🎨 **Business Pro UI** - Interfaz profesional con paleta slate/cyan elegante
- 🔄 **Estado en tiempo real** - Sincronización instantánea con Supabase

### 💼 Módulos del Sistema

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| 🛒 **POS** | Punto de venta con búsqueda inteligente y carrito | ✅ Activo |
| 📦 **Inventario** | Gestión de productos, stock y categorías | ✅ Activo |
| 📊 **Reportes** | Métricas de ventas, ticket promedio y cierres diarios | ✅ Activo |
| 💰 **Cobros** | Sistema de fiados y seguimiento de deudas | ✅ Activo |
| 🔐 **Auth** | Login seguro con animaciones profesionales | ✅ Activo |

---

## 🛠️ Stack Tecnológico

```
Frontend:     React 18 + TypeScript 5 + Vite 5
UI/UX:        Tailwind CSS + shadcn/ui + Lucide Icons
Backend:      Supabase (PostgreSQL + Auth + Realtime)
Estado:       React Query (TanStack Query)
Utilidades:   date-fns, sonner (toast notifications)
```

---

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Cuenta Supabase** (proyecto configurado)

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/DeikerManzanilla/CUADERNO-DIGITAL.git
cd CUADERNO-DIGITAL
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key-aqui
```

> ⚠️ **IMPORTANTE**: Las variables deben comenzar con `VITE_` para ser accesibles en el frontend.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza build de producción |
| `npm run lint` | Ejecuta ESLint |

---

## 🎨 Diseño Business Pro

La versión 2.0 introduce el estilo **"Business Pro"**:

- 🎨 **Paleta profesional**: Slate, cyan y grises elegantes
- ✨ **Sin distracciones**: Eliminados efectos glow excesivos
- 📐 **Espaciado generoso**: Interfaces limpias y respirables
- 🔤 **Tipografía clara**: JetBrains Mono + Inter para datos y texto
- 📱 **Primero móvil**: Optimizado para tablets POS y smartphones

---

## 🔐 Seguridad

- ✅ **Autenticación JWT** mediante Supabase Auth
- ✅ **Row Level Security (RLS)** en todas las tablas
- ✅ **Variables de entorno** para credenciales sensibles
- ✅ **Sin console.logs** en producción
- ✅ **Auto-complete** habilitado para gestores de contraseñas

---

## 📱 Optimización PWA

La aplicación está optimizada para funcionar como Progressive Web App:

- 📲 **Manifest configurado** para instalación en dispositivos
- 🔄 **Service Worker** para caché inteligente
- 📶 **Offline-first** donde es posible
- 🖼️ **Íconos adaptativos** para todas las plataformas

---

## 🗄️ Esquema de Base de Datos

### Tablas Principales

```sql
-- Products: Catálogo de productos
products (id, sku, name, cost_price, base_price, iva_amount, final_price, stock, category)

-- Sales: Registro de ventas
sales (id, subtotal, tax, total, payment_method, customer_name, customer_phone, status, created_at)

-- Sale Items: Detalle de cada venta
sale_items (id, sale_id, product_id, product_name, quantity, unit_price, cost_price_at_sale, subtotal)

-- Debts: Sistema de fiados/crédito
debts (id, sale_id, customer_name, customer_phone, total_amount, remaining_amount, status, created_at)
```

---

## 🚀 Despliegue en Vercel

### Configuración de Variables de Entorno

En el panel de Vercel, agregar estas variables:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📝 Changelog v2.0 Rayo

### ✨ Nuevas Características
- 🎯 **POS Rediseñado**: Búsqueda tipo "Pokedex" con navegación por teclado
- 💱 **Conversión Bs/USD**: Integración con tasa BCV en tiempo real
- 📊 **Ticket Promedio**: Métrica clave en reportes
- 🎨 **Business Pro UI**: Refactorización completa del diseño
- 📱 **UX Móvil Optimizada**: Teclado controlado, inputs optimizados

### 🔧 Mejoras Técnicas
- ⚡ **Bundle size reducido**: Eliminadas dependencias innecesarias
- 🧹 **Código limpio**: Eliminados todos los console.log
- 🔐 **Auth mejorado**: Entrada suave del logo, auto-complete habilitado
- 📈 **Performance**: Animaciones CSS optimizadas, sin efectos 3D pesados

### 🐛 Correcciones
- ✅ Fix: Teclado Android que permanecía abierto tras venta
- ✅ Fix: Errores de compilación en Inventory.tsx
- ✅ Fix: Cierre de tags JSX en componentes
- ✅ Fix: Orden de imports CSS según estándares

---

## 🤝 Contribución

Este es un proyecto privado para gestión comercial. Para reportar issues o sugerencias, contactar al equipo de desarrollo.

---

## 📄 Licencia

Proyecto propietario - Cuaderno Digital © 2025

---

<p align="center">
  <strong>Hecho con ❤️ para optimizar tu negocio</strong><br>
  <em>"De la anotación manual al futuro digital"</em>
</p>
