# Track: Flujo de Suscripción v2: Trial, Planes Pagados y Ciclo de Vida Completo

**Descripción:** (Actualizada) Esta iniciativa rediseña el modelo de facturación a un **ciclo de vida completo de suscripción**. Introduce una prueba gratuita de 7 días. Durante o después del trial, los usuarios pueden suscribirse a un plan 'Standard' o 'Full'. Los usuarios con un plan activo pueden cambiar entre ellos en cualquier momento. El sistema gestionará la activación, cancelación, mejoras y degradaciones, ajustando el acceso a las características de forma inmediata y la facturación en el siguiente ciclo. También incluye una política de eliminación de cuentas que no se convierten tras el trial.

---

### **Fase 1: Lógica de Trial y Política de Retención de Datos**

*Meta: Establecer el ciclo de vida de la prueba gratuita y la limpieza automática de cuentas.*

*   **[x] Tarea: Actualizar la BD para el trial.**
    *   **Acción:** Añadir una columna `trial_ends_at` (de tipo `timestamp`) a la tabla `stores`.

*   **[ ] Tarea: Implementar el bloqueo post-trial.**
    *   **Acción:** Modificar el frontend para que, si el trial ha terminado y no hay suscripción, se muestre un modal que obligue a elegir un plan.

*   **[ ] Tarea: Crear la política de eliminación de cuentas.**
    *   **Acción:** Crear una nueva función SQL en Supabase (`delete_inactive_users_after_trial`) que elimine usuarios cuya prueba expiró hace más de 15 días y no tienen un plan activo.

*   **[ ] Tarea: Automatizar la ejecución de la política de eliminación.**
    *   **Acción:** Configurar un cron job (`pg_cron`) para ejecutar la limpieza diariamente.

---

### **Fase 2: Interfaz para Gestión de Planes**

*Meta: Permitir a los usuarios visualizar, elegir, mejorar y degradar su plan en cualquier momento.*

*   **[ ] Tarea: Rediseñar la UI de planes.**
    *   **Acción:** Crear una vista (`/billing` o similar) donde se muestren los planes 'Standard' ($4.99) y 'Full' ($9.99).
    *   **Lógica:**
        *   Si el usuario está en trial, puede elegir cualquiera de los dos para empezar su suscripción.
        *   Si el usuario tiene un plan activo, puede elegir el otro plan para iniciar el cambio.

---

### **Fase 3: Lógica de Backend para Ciclo de Vida de Suscripción**

*Meta: Implementar toda la lógica de servidor para manejar la creación, cancelación, mejora y degradación de suscripciones.*

*   **[ ] Tarea: Actualizar la creación de suscripciones.**
    *   **Acción:** Modificar la función `create-paypal-subscription` para que reciba el `plan_id` ('standard' o 'full') deseado desde el frontend.

*   **[ ] Tarea: Crear endpoint para modificar suscripciones.**
    *   **Acción:** Crear una nueva función (`revise-paypal-subscription`) que el frontend llamará cuando un usuario quiera cambiar de plan. Esta función se comunicará con PayPal para actualizar la suscripción existente.

*   **[ ] Tarea: Extender el manejador de webhooks de PayPal.**
    *   **Acción:** Añadir lógica a `handle-paypal-webhook` para los siguientes eventos:
        *   **`BILLING.SUBSCRIPTION.ACTIVATED`:** (Ya implementado) Activa el plan inicial.
        *   **`BILLING.SUBSCRIPTION.CANCELLED`:** Marca la suscripción como 'cancelada' y revoca el acceso al final del periodo pagado.
        *   **`BILLING.SUBSCRIPTION.UPDATED`:** Es el evento clave para cambios de plan.
            *   **Si es Mejora (`standard` -> `full`):** El webhook confirmará el cambio. Se asume que PayPal gestiona un cobro prorrateado inmediato. El acceso a las características 'full' se concede al instante.
            *   **Si es Degradación (`full` -> `standard`):** El webhook confirmará el cambio. El acceso se reduce a 'standard' inmediatamente, y el nuevo precio, más bajo, se cobrará en el siguiente ciclo de facturación (sin reembolsos).