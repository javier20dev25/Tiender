# Track: Flujo de Suscripción v2: Trial, Planes Pagados y Ciclo de Vida Completo

**Descripción:** Esta iniciativa rediseña el modelo de facturación a un **ciclo de vida completo de suscripción**. Introduce una prueba gratuita de 7 días. Durante o después del trial, los usuarios pueden suscribirse al plan 'Standard'. El sistema gestionará la activación, cancelación y el acceso a características.

**Nota:** El **Plan Full** se encuentra **EN PAUSA**. La verificación final del flujo de pago en **Live** también está en pausa hasta que el usuario recupere el acceso a su cuenta de PayPal y obtenga una tarjeta.

---

### **Fase 0: Auditoría y Tareas Inmediatas**

*Meta: Asegurar que la base del proyecto es sólida antes de construir nuevas funcionalidades.*

*   **[ ] Tarea: Auditar conflictos de lógica con PayPal.**
*   **[ ] Tarea: Verificar la base de datos para configuraciones heredadas.**

---

### **Fase 1: Lógica de Trial y Límites del Plan**

*Meta: Establecer el ciclo de vida de la prueba gratuita y los límites correctos para los planes.*

*   **[x] Tarea: Actualizar la BD para el trial.**
    *   **Acción:** Añadir una columna `trial_ends_at`.
*   **[ ] Tarea: Garantizar que el trial/plan Standard ofrecen 30 productos.**
    *   **Acción:** Revisar la lógica de limitación de productos (probablemente en la tabla `stores` o en la función `get_store_analytics`) y asegurarse de que el límite sea 30 para el plan Standard y el período de prueba.
*   **[ ] Tarea: Implementar el bloqueo post-trial.**
*   **[ ] Tarea: Crear/Automatizar la política de eliminación de cuentas inactivas.**

---

### **Fase 2: Interfaz de Usuario y Gestión de Cuenta**

*Meta: Mejorar la experiencia de usuario y la gestión de la cuenta.*

*   **[ ] Tarea: Implementar Menú de Usuario Desplegable.**
    *   **Acción:** Añadir un botón (icono "hamburguesa") en el Dashboard. Al hacer clic, se abrirá un menú lateral (drawer) con las siguientes opciones:
        1.  **Cerrar Sesión:** Debe llamar a la función `signOut` del AuthContext.
        2.  **Cancelar Suscripción:** Debe abrir un modal de confirmación para cancelar el plan.
*   **[ ] Tarea: Crear la página de visualización de suscripción (`UpgradePage.tsx`).**
    *   **Acción:** Esta página mostrará el estado del plan actual. En el futuro, podría contener el botón para cambiar de plan.

### **Fase 3: Lógica de Backend para Pagos y Cancelaciones**

*Meta: Implementar la lógica de servidor para manejar la creación y cancelación de suscripciones.*

*   **[ ] Tarea: Configurar los Secrets en Supabase.**
*   **[ ] Tarea: Crear la función backend `cancel-paypal-subscription`.**
    *   **Acción:** Desarrollar una función Edge en Supabase que reciba la solicitud del frontend, encuentre la suscripción activa del usuario y la cancele a través de la API de PayPal.
*   **[ ] Tarea: Definir e implementar la política de cancelación.**
*   **[ ] Tarea: Revisar y extender el manejador de webhooks de PayPal.**

---

### **Fase 4: Backlog de Desarrollo de Funcionalidades (Priorizado)**

*Meta: Construir las funcionalidades clave de la aplicación mientras se resuelven los bloqueos externos.*

1.  **[ ] Tarea: Expandir límite de "Top 5" a "Top 10".**
    *   **Acción:** Identificar la función SQL que calcula el ranking y cambiar el `LIMIT 5` por `LIMIT 10`.

2.  **[ ] Tarea: Implementar enlaces externos en productos.**
    *   **Acción:**
        1.  **Base de datos:** Añadir las columnas `url_video` y `url_tienda_web` (tipo TEXT, nullable) a la tabla `products`.
        2.  **Formularios:** Modificar `AddProductForm.tsx` y `EditProductForm.tsx` para incluir campos opcionales para la URL de video y la URL de tienda web.
        3.  **Vista de Tienda (`SocialStorePage.tsx`):**
            *   Modificar la tarjeta de producto para mostrar iconos/tags dentro de la imagen del producto.
            *   Si existe `url_video`, mostrar un icono de YouTube que enlace a esa URL.
            *   Si existe `url_tienda_web`, mostrar un icono genérico de tienda/enlace que enlace a esa URL.
            *   Los iconos deben abrir la URL en una nueva pestaña.

3.  **[ ] Tarea: Implementar Chat de IA (Copiloto para la tienda).**
    *   **Acción:** Desarrollar una interfaz de chat que actúe como un asistente para que el dueño de la tienda gestione sus productos o analíticas.