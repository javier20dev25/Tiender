# Plan de Tests - Proyecto Tiender

## Estado Actual de los Tests (Actualizado: 2026-02-15)

### ✅ Tests que PASAN (¡Todos pasados!)
| Archivo | Tests | Descripción |
|---|---|---|
| `DashboardPage.test.tsx` | 4/4 | CRUD de productos, creación de tienda |
| `SocialStorePage.test.tsx` | 4/4 | Flujo de compra, eventos (like/dislike/visit/add_to_cart) |
| `paypal-webhooks.test.ts` | 6/6 | Mapeo de estados PayPal, idempotencia |
| `paypal-signature.test.ts` | 3/3 | Verificación de firmas PayPal |
| `App.test.tsx` | 3/3 | Routing básico, /dashboard, /auth, / |
| `AuthPage.test.tsx` | 2/2 | Página de autenticación (Login/Register toggle) |
| `SignInForm.test.tsx` | 2/2 | Formulario de inicio de sesión |
| `SignUpForm.test.tsx` | 3/3 | Formulario de registro y códigos de recuperación |
| `AuthContext.test.tsx` | 4/4 | Login, logout, updates de estado, carga inicial |
| `ProtectedRoute.test.tsx` | 4/4 | Redirecciones por auth o suscripción faltante |
| `store-flow.test.tsx` | 1/1 | Flujo de lectura pública tras creación (RLS) |
| `suscripcion-flow.test.tsx` | 2/2 | Mejora de plan, redirección PayPal, errores |
| `product-links.test.tsx` | 2/2 | Edición de enlaces externos y video |
| `full-flow.test.tsx` | 2/2 | Navegación básica entre Auth y Dashboard |
| `AuthFlow.test.tsx` | 2/2 | Registro exitoso y modal de códigos |

---

## 🔮 Tests Futuros (Pendientes de Implementación)

### 1. Test de Trial & Grace Period (Periodo de Prueba y Gracia)
**Prioridad:** Alta  
**Objetivo:** Verificar que la lógica de los 7 días de prueba gratuita funcione correctamente, incluyendo:
- Que un usuario nuevo con `plan_type: 'trial'` tenga acceso completo durante los 7 días.
- Que al expirar el trial (`trial_ends_at < now()`), el estado cambie automáticamente a `past_due`.
- Que un usuario con `past_due` NO pierda acceso inmediatamente (periodo de gracia), pero sí vea un banner de advertencia.
- Que la transición de `trial` → `active` funcione correctamente al completar el pago con PayPal.
- Que la transición de `past_due` → `canceled` funcione correctamente cuando se supera el periodo de gracia.

**Archivos involucrados:**
- `AuthContext.tsx` (lógica de suscripción)
- `ProtectedRoute.tsx` (lógica de acceso)
- `SubscriptionStatusBanner.tsx` (UI de advertencia)
- `handle-paypal-webhook/logic.ts` (procesamiento de webhooks)

### 2. Test de Error en `visit-gate` (Control Anti-Bot)
**Prioridad:** Media  
**Objetivo:** Verificar que la SocialStorePage maneja correctamente los errores de la función `visit-gate`:
- Que cuando `visit-gate` retorna un error, la página muestra "Acceso denegado. La visita ha sido marcada como sospechosa."
- Que NO se carguen datos de la tienda ni productos cuando la verificación falla.
- Que NO se registren eventos (`record-verified-event`) sin un `visit_token` válido.
- Que el estado de verificación se muestre correctamente: `pending` → `failed`.

**Archivos involucrados:**
- `SocialStorePage.tsx` (componente principal)
- `SocialStorePage.test.tsx` (agregar nuevos test cases)
