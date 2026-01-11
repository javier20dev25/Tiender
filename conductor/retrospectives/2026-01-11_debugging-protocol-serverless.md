# Protocolo de Depuración para Funciones Serverless

Este documento resume una lección clave aprendida durante la implementación inicial del proyecto para evitar futuros ciclos de depuración largos e ineficientes.

## La Lección Clave

Pasamos un tiempo considerable intentando depurar la **lógica interna** de una Edge Function (`orchestrate-signup`) bajo la suposición de que estaba desplegada y en ejecución, cuando en realidad no era así. El problema raíz no era un bug en el código, sino un **problema de despliegue**: la función no existía en el servidor.

## Protocolo de Depuración (La Próxima Vez)

Ante un problema con una función serverless que no parece funcionar (no hay logs, no hay cambios en la base de datos), el primer paso **NUNCA** es depurar su código. El primer paso es **VERIFICAR QUE LA FUNCIÓN ESTÁ DESPLEGADA Y ES ALCANZABLE**.

El flujo de depuración debe ser el siguiente:

1.  **Verificar Invocación con `curl`:** Realiza una llamada directa al endpoint de la función usando `curl`, asegurándote de incluir la bandera `-i` para ver los headers de la respuesta y quitar la bandera `-s` (silencioso).

    ```bash
    curl -i -X POST "https://<project_ref>.supabase.co/functions/v1/<function-name>" \
      -H "Authorization: Bearer <anon_key>" \
      -H "Content-Type: application/json" \
      -d '{...}'
    ```

2.  **Analizar la Respuesta HTTP:**
    *   **Si recibes un `404 NOT_FOUND`:** ¡DETENTE! El problema es de despliegue. La función no existe en el servidor. No pierdas tiempo revisando la lógica. La causa probable es que el workflow de CI/CD no ha ejecutado el despliegue para el commit/rama correctos. Revisa la configuración del workflow (`.github/workflows/deploy.yml`) y las ejecuciones en la pestaña "Actions" de GitHub.
    *   **Si recibes un `5xx` (Error de Servidor):** La función fue invocada pero falló al inicializarse. Ahora sí es momento de revisar los **logs de la propia Edge Function** en el dashboard de Supabase, ya que probablemente haya un error de "bootstrap" (e.g., falta una variable de entorno en la configuración de la función).
    *   **Si recibes un `4xx` (que no sea 404) o un `2xx`:** ¡Felicidades! La función está desplegada y ejecutando su lógica. Ahora sí puedes empezar a depurar el código de la función, revisar los logs de negocio (e.g., la tabla `business_events`), etc.

Adherirse a este protocolo nos ahorrará una cantidad significativa de tiempo y tokens al diagnosticar el problema correcto desde el principio.
