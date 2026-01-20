# Plan de Implementación: Finalización del Flujo de Autenticación y Recuperación

**Objetivo:** Conectar, desplegar y verificar la funcionalidad completa de generación y uso de códigos de recuperación de cuenta.

## Resumen del Problema

El diagnóstico ha confirmado que el frontend no se está comunicando correctamente con las funciones de Supabase. Las llamadas se dirigen a rutas inexistentes (`/.redirections/...`) en lugar de invocar las funciones directamente mediante el cliente de Supabase.

---

## Tareas Pendientes

### 1. [Pendiente] Corregir las llamadas a Funciones en el Frontend

El objetivo es reemplazar las llamadas `fetch` incorrectas por `supabase.functions.invoke()`.

-   **Archivo a modificar:** `src/features/auth/components/SignUpForm.tsx`
    -   **Tarea:** Localizar la lógica que se ejecuta tras un registro exitoso (dentro de `handleSignUp`).
    -   **Acción:** Sustituir la llamada `fetch` actual por la invocación directa a la función de Supabase para generar los códigos.
    -   **Ejemplo de código:**
        ```javascript
        const { data, error } = await supabase.functions.invoke('generate-backup-codes', {
          body: { userId: user.id },
        });
        ```

-   **Archivo a modificar:** `src/pages/RecoveryPage.tsx`
    -   **Tarea:** Localizar la lógica de envío del formulario de recuperación.
    -   **Acción:** Sustituir la llamada `fetch` por la invocación a la función de Supabase para verificar el código.
    -   **Ejemplo de código:**
        ```javascript
        const { data, error } = await supabase.functions.invoke('verify-backup-code', {
          body: { email, code },
        });
        ```

### 2. [Pendiente] Desplegar las Funciones de Supabase

Las funciones `generate-backup-codes` y `verify-backup-code` deben desplegarse en el entorno de Supabase. La preferencia es usar un workflow de GitHub Actions para automatizar este proceso.

-   **Workflow sugerido:** `.github/workflows/manage-supabase.yml` (o crear uno nuevo si es necesario).
-   **Comando a ejecutar en el workflow:**
    ```bash
    supabase functions deploy generate-backup-codes --project-ref $SUPABASE_PROJECT_REF
    supabase functions deploy verify-backup-code --project-ref $SUPABASE_PROJECT_REF
    ```
    *(Nota: `--no-verify-jwt` puede ser necesario si el token se gestiona a nivel de workflow).*

### 3. [Pendiente] Configurar el Secreto `APP_URL` en Supabase

La función `serve-share-page` depende de la variable de entorno `APP_URL` para construir las metaetiquetas correctamente. Esta configuración quedó pendiente.

-   **Método:** Utilizar el mismo workflow de GitHub Actions que despliega las funciones.
-   **Comando a ejecutar en el workflow:**
    ```bash
    supabase secrets set --env-file <(echo "APP_URL=$VITE_APP_URL")
    ```
    *(Nota: `$VITE_APP_URL` debe estar disponible como secreto o variable en GitHub Actions para pasarlo al comando).*

### 4. [Pendiente] Commit, Despliegue y Verificación Final

Una vez completadas las correcciones de código y la configuración de la infraestructura:

1.  **Commit:** Agrupar los cambios del frontend en un commit claro y descriptivo.
2.  **Push:** Enviar los cambios al repositorio para activar los workflows de CI/CD.
    -   El workflow de Vercel desplegará el frontend.
    -   El workflow de Supabase (manual o automático) desplegará las funciones si no se ha hecho ya.
3.  **Verificación E2E:**
    -   Navegar al sitio en producción.
    -   Crear una nueva cuenta.
    -   Verificar que el modal con los códigos de recuperación aparece y se pueden descargar.
    -   Cerrar sesión.
    -   Ir a la página de recuperación.
    -   Utilizar el email y uno de los códigos para iniciar sesión.
    -   Confirmar que el inicio de sesión es exitoso.
