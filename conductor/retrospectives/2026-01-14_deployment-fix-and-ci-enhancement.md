# Retrospectiva: Mejora de CI y Despliegue de la Tienda Social

**Fecha:** 2026-01-14

## Resumen

Esta sesión se centró en implementar la funcionalidad clave de la "Tienda Social", mejorar drásticamente la cobertura de pruebas automatizadas y solucionar un fallo crítico en el despliegue de producción.

## 1. Implementación de Funcionalidades

### Vista Pública "Tienda Social" (`SocialStorePage.tsx`)
- Se implementó la interfaz de usuario principal, inspirada en "Tinder para Productos".
- La vista ahora muestra los productos de una tienda de uno en uno, permitiendo al usuario interactuar.
- Se añadió un sistema de carrito de compras local en el frontend.
- Se implementó la funcionalidad "Hacer Pedido por WhatsApp", que genera un enlace con un mensaje pre-redactado que incluye los productos del carrito y el total.

## 2. Mejoras en Testing y CI/CD

### Prueba de Integración para `SocialStorePage`
- Se creó un nuevo archivo de prueba (`SocialStorePage.test.tsx`).
- La prueba simula el flujo completo del usuario: ver un producto, añadirlo al carrito, abrir el modal del carrito y verificar que el enlace de WhatsApp se genere correctamente.
- Esta prueba asegura que la lógica de compra principal esté protegida contra regresiones.

### Integración de Tests de Backend (Deno) en CI
- Se modificó el workflow de CI (`.github/workflows/ci.yml`).
- Se añadió un nuevo job `deno-test` que se ejecuta en paralelo a las pruebas de frontend.
- Este job instala Deno y ejecuta los tests de las Edge Functions de Supabase, validando la lógica de backend en cada Pull Request.

## 3. Estado de Variables de Entorno y Despliegue

### Despliegue en Vercel (Frontend)
- Se diagnosticó y solucionó un fallo en el despliegue de producción en Vercel.
- **Causa:** El proceso de build en Vercel no tenía acceso a las variables de entorno necesarias.
- **Solución:** Se configuraron las variables a través de la CLI de Vercel.
- **Estado Actual:** El despliegue en producción está **operativo**.

#### Variables de Entorno en Vercel
Las siguientes variables están configuradas en los entornos de **Production, Preview y Development** del proyecto en Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### CI en GitHub Actions (Testing)
El pipeline de CI (`ci.yml`) utiliza los siguientes secrets del repositorio de GitHub:

- **Para el job `test` (Frontend):**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Para el job `deno-test` (Backend):**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 4. Limpieza del Repositorio
- Se eliminaron los archivos `.env.test` y `supabase/functions/.env.test` que fueron subidos al repositorio por error.
- Se actualizó el archivo `.gitignore` con la regla `*.env*` para prevenir que cualquier archivo de entorno sea subido en el futuro.
