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
    *   **Acción:** Revisar la lógica de limitación de productos y asegurarse de que el límite sea 30, no 10.
*   **[ ] Tarea: Implementar el bloqueo post-trial.**
*   **[ ] Tarea: Crear/Automatizar la política de eliminación de cuentas inactivas.**

---

### **Fase 2: Interfaz de Usuario y Gestión de Cuenta**

*Meta: Mejorar la experiencia de usuario y la gestión de la cuenta.*

*   **[ ] Tarea: Implementar Menú de Usuario Desplegable.**
    *   **Acción:** Añadir un botón (icono "hamburguesa") en el Dashboard. Al hacer clic, se abrirá un menú lateral con dos opciones:
        1.  **Cerrar Sesión:** Debe llamar a la función `signOut`.
        2.  **Cancelar Suscripción:** Debe abrir un modal de confirmación para cancelar el plan.
*   **[ ] Tarea: Crear la página de visualización de suscripción (`UpgradePage.tsx`).**
    *   **Acción:** Esta página mostrará el estado del plan actual. En el futuro, podría contener el botón para cambiar de plan.

### **Fase 3: Lógica de Backend para Pagos (En Pausa)**

*Meta: Implementar la lógica de servidor para manejar la creación y cancelación de suscripciones.*

*   **[ ] Tarea: Configurar los Secrets en Supabase.**
*   **[ ] Tarea: Definir e implementar la política de cancelación.**
*   **[ ] Tarea: Revisar y extender el manejador de webhooks de PayPal.**

---

### **Fase 4: Backlog de Desarrollo de Funcionalidades (Priorizado)**

*Meta: Construir las funcionalidades clave de la aplicación mientras se resuelven los bloqueos externos.*

1.  **[ ] Tarea: Expandir límite de "Top 5" a "Top 10".**
    *   **Acción:** Identificar la función SQL que calcula el ranking y cambiar el `LIMIT 5` por `LIMIT 10`.

2.  **[ ] Tarea: Implementar enlaces externos en productos.**
    *   **Acción:** Añadir campos a los productos para URLs de YouTube, tiendas externas (Shein, Shopify), etc., y mostrarlos en la tienda del usuario. El usuario (Astaroth) proveerá más detalles en este punto.

3.  **[ ] Tarea: Implementar Chat de IA (Copiloto para la tienda).**
    *   **Acción:** Desarrollar una interfaz de chat que actúe como un asistente para que el dueño de la tienda gestione sus productos o analíticas.