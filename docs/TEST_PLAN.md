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

| `trial-and-grace-period.test.tsx` | 6/6 | Lógica de Trial, Active, Past Due (Grace Period), Unpaid |
| `SocialStorePage.test.tsx` | 6/6 | Flujo de compra, eventos, Anti-Bot (visit-gate), Double-Submit prevention |

---

## 🔮 Tests Futuros (Pendientes de Implementación)

### 1. Test de Rendimiento / Carga (Opcional)
**Prioridad:** Baja
**Objetivo:** Verificar tiempos de respuesta bajo carga simulada.
