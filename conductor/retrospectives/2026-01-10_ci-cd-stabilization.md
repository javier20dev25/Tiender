# Retrospectiva: Estabilización del Pipeline de CI/CD (10-Ene-2026)

## 1. Problema Inicial

El pipeline de CI/CD en GitHub Actions presentaba fallos recurrentes que bloqueaban el desarrollo y despliegue. Los problemas se manifestaron en tres áreas principales:

1.  **Fallo en Configuración de Secrets:** La herramienta `gh` no funcionaba en el entorno de Termux debido a un bug de permisos, impidiendo la configuración de las claves de Supabase.
2.  **Errores de Calidad de Código (Linting):** Tras encontrar un workaround para los secrets, el pipeline comenzó a fallar por numerosos errores de "linting" (código que no cumplía las reglas de estilo), como variables e importaciones sin usar.
3.  **Fallo de Tests por Variables de Entorno:** Una vez corregidos los errores de linting, los tests unitarios fallaron masivamente con el error `supabaseUrl is required`. Esto se debió a que el entorno de ejecución de tests en GitHub Actions no tenía acceso a las variables de entorno (`.env`) necesarias para inicializar el cliente de Supabase.

## 2. Proceso de Depuración

Se abordó cada problema de forma secuencial y metódica:

1.  **Diagnóstico del Bug de `gh`:** Se confirmó que el problema era específico de la interacción entre `gh` y Termux. Se adoptó como solución un **workaround manual y seguro**, guiando al usuario para configurar los secrets directamente en la interfaz web de GitHub.
2.  **Corrección de Errores de Linting:** Se corrigieron 9 errores de código en 7 archivos distintos. El proceso implicó un intento de corrección automática (`npm run lint -- --fix`) que no funcionó, seguido de una corrección manual y precisa de cada error utilizando reemplazo de texto.
3.  **Solución a los Fallos de Tests:** Se identificó la falta de variables de entorno en el runner de CI. Se eligió la solución más limpia y robusta: **modificar `vite.config.ts`** para inyectar las variables de entorno de Supabase directamente en la configuración de Vitest. Esto asegura un entorno de pruebas consistente y autocontenido.

## 3. Resultado Final

El resultado es un **pipeline de CI/CD 100% funcional y estable** en la rama `setup/ci-cd`. Este pipeline ahora sirve como un guardián de la calidad del código, garantizando que todos los tests y verificaciones pasen antes de que cualquier cambio se integre a la rama principal.

Este trabajo desbloquea el desarrollo futuro, permitiendo añadir nuevas funcionalidades de forma segura y con la confianza de que la base del proyecto es sólida.
