# Track: Flujo de Suscripción v2: Trial, Planes Pagados y Ciclo de Vida Completo

**Descripción:** Esta iniciativa rediseña el modelo de facturación a un **ciclo de vida completo de suscripción**. Introduce una prueba gratuita de 7 días. Durante o después del trial, los usuarios pueden suscribirse al plan 'Standard'. El sistema gestionará la activación, cancelación y el acceso a características.

**Nota:** El **Plan Full** se encuentra **EN PAUSA** hasta definir las características que lo diferenciarán del Plan Standard.

---

### **Fase 0: Auditoría y Tareas Inmediatas**

*Meta: Asegurar que la base del proyecto es sólida antes de construir nuevas funcionalidades.*

*   **[ ] Tarea: Auditar conflictos de lógica con PayPal.**
    *   **Acción:** Revisar el código existente para asegurar que no estamos implementando manualmente lógicas (como la gestión de trials) que PayPal ya maneja de forma automática.
*   **[ ] Tarea: Verificar la base de datos.**
    *   **Acción:** Auditar la base de datos para asegurar que no existen tablas, columnas o configuraciones de planes heredados de versiones anteriores que puedan entrar en conflicto.

---

### **Fase 1: Lógica de Trial y Política de Retención**

*Meta: Establecer el ciclo de vida de la prueba gratuita y la limpieza automática de cuentas.*

*   **[x] Tarea: Actualizar la BD para el trial.**
    *   **Acción:** Añadir una columna `trial_ends_at` (de tipo `timestamp`) a la tabla `stores`.
*   **[ ] Tarea: Garantizar que el trial ofrece TODAS las funciones del Plan Standard.**
    *   **Acción:** Revisar la lógica de feature-gating. Los usuarios con `trial_ends_at` en el futuro deben tener acceso de nivel 'Standard' (ej. límite de 30 productos, no 10).
*   **[ ] Tarea: Implementar el bloqueo post-trial.**
    *   **Acción:** Modificar el frontend para que si el trial ha terminado y no hay suscripción, se muestre un modal que obligue al usuario a suscribirse.
*   **[ ] Tarea: Crear política de eliminación de cuentas.**
    *   **Acción:** Crear una función SQL (`delete_inactive_users_after_trial`) para eliminar usuarios cuya prueba expiró hace más de 15 días y no tienen plan activo.
*   **[ ] Tarea: Automatizar la política de eliminación.**
    *   **Acción:** Configurar un cron job (`pg_cron`) para ejecutar la limpieza diariamente.

---

### **Fase 2: Interfaz para Gestión de Planes**

*Meta: Permitir a los usuarios gestionar su cuenta y suscripción de forma intuitiva.*

*   **[ ] Tarea: Crear un Sidebar de navegación en el Dashboard.**
    *   **Acción:** Implementar un sidebar persistente con opciones claras para "Cerrar Sesión" y "Gestionar Suscripción".
*   **[ ] Tarea: Crear la página de gestión de suscripción (`UpgradePage.tsx`).**
    *   **Acción:** Crear la vista donde se muestra el estado actual de la suscripción y se permite cancelarla. Cuando el Plan Full se reactive, aquí se permitirá el cambio.

---

### **Fase 3: Lógica de Backend para Ciclo de Vida de Suscripción**

*Meta: Implementar la lógica de servidor para manejar la creación y cancelación de suscripciones.*

*   **[ ] Tarea: Configurar los Secrets en Supabase.**
    *   **Acción:** El usuario debe añadir `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_PLAN_ID_STANDARD` (`P-3A8194626F195091XNF47Z2Q`) en la configuración de secrets del proyecto.
*   **[ ] Tarea: Definir e implementar la política de cancelación.**
    *   **Acción:** Al cancelar, la suscripción sigue activa hasta el fin del ciclo de facturación/prueba. El acceso se revoca después de esa fecha. El webhook `BILLING.SUBSCRIPTION.CANCELLED` debe reflejar esta lógica.
*   **[ ] Tarea: Revisar y extender el manejador de webhooks de PayPal.**
    *   **Acción:** Asegurar que `handle-paypal-webhook` gestiona correctamente:
        *   `CHECKOUT.ORDER.APPROVED` y `BILLING.SUBSCRIPTION.ACTIVATED`: Para iniciar la suscripción y el trial.
        *   `BILLING.SUBSCRIPTION.CANCELLED`: Para aplicar la política de cancelación.

---

### **Fase 4: Implementación de Características del Plan Standard**

*Meta: Asegurar que todas las funcionalidades prometidas en el plan están implementadas.*

*   **[ ] Tarea: Implementar Chat de IA.**
*   **[ ] Tarea: Expandir límite de "Top 5" a "Top 10".**
*   **[ ] Tarea: Implementar enlaces externos en productos.**
    *   **Acción:** Añadir campos a los productos para URLs de YouTube, tiendas externas (Shein, Shopify), etc., y mostrarlos en la tienda del usuario.