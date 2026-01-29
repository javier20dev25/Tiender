# Notas del Proyecto Tiender

## Flujo de Despliegue y Cambios en Infraestructura

**CRÍTICO: Debido a limitaciones del entorno de desarrollo (Termux), se debe seguir el siguiente protocolo para cambios en la infraestructura:**

*   **Supabase:** Cualquier cambio en la configuración, migraciones de base de datos o funciones de Supabase **debe** realizarse a través de los workflows de **GitHub Actions** definidos en el repositorio. El CLI de Supabase no funciona correctamente en este entorno y su uso directo está prohibido para evitar inconsistencias.

*   **Vercel:** Los despliegues y cambios de configuración en Vercel pueden realizarse de dos maneras:
    1.  **Recomendado:** A través de los workflows de **GitHub Actions** (push a la rama principal).
    2.  **Alternativa:** Iniciando sesión directamente en la plataforma de Vercel.

Este protocolo es fundamental para mantener la integridad y consistencia de los entornos de staging y producción.

**Protocolo de Commits y Push:**
*   Yo me encargaré de preparar los commits, incluyendo la adición de archivos y la redacción de mensajes.
*   También me encargaré de hacer `git push` a la rama correspondiente después de que apruebes el commit. Tú solo necesitas confirmar las acciones.

---

## Diagnóstico de Git: Cuando los Cambios Parecen Desaparecer

### Escenario
Intentas hacer `git commit`, pero recibes el mensaje `no changes added to commit`, a pesar de que estás seguro de haber añadido archivos con `git add`. Posteriormente, al hacer `git push`, recibes `Everything up-to-date`.

### Diagnóstico
Esto casi siempre significa que **el trabajo ya está hecho, commiteado y subido**. La confusión suele venir de un `git status` que muestra muchos otros archivos modificados que no son relevantes para la tarea actual.

### Protocolo de Verificación
1.  **Verificar Cambios Reales:** Para confirmar si un archivo o directorio específico tiene cambios pendientes de commit, usa `git diff HEAD -- <ruta/al/archivo>`. Si este comando no devuelve nada, el archivo es idéntico al del último commit.
2.  **Verificar Estado del Push:** Si `git push` indica `Everything up-to-date`, significa que el repositorio remoto ya tiene todos tus commits.

### Conclusión
Si ambos casos se cumplen, puedes estar seguro de que tu cambio ya fue desplegado. Ignora otros archivos no relacionados en `git status` y continúa con el siguiente paso.
