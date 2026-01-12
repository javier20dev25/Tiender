# Retrospectiva: Depuración del Workflow de Despliegue CI/CD

**Fecha:** 11 de enero de 2026

## 1. Contexto

El objetivo era automatizar el despliegue de migraciones y Edge Functions de Supabase a través de un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que se activara al hacer `push` a la rama `main`.

## 2. Resumen del Problema

El workflow de despliegue falló repetidamente a través de una cascada de errores. Aunque cada error se corrigió secuencialmente, un error fundamental subyacente (un nombre de secreto incorrecto) invalidó varios de los intentos de solución, prolongando significativamente el tiempo de depuración.

## 3. Cronología Detallada de Fallos y Soluciones

La depuración siguió un largo y tortuoso camino donde la solución de un problema revelaba el siguiente.

### Fallo #1: Permiso denegado en `gh`
- **Síntoma:** El comando `gh run list` fallaba con `permission denied` al intentar ejecutar `git`.
- **Causa Raíz:** Una política de seguridad del entorno (Termux sobre Android) impedía que el proceso `gh` pudiera ejecutar `git`, a pesar de que los permisos del sistema de archivos parecían correctos.
- **Solución Aplicada:** Se evitó la necesidad de que `gh` ejecutara `git` pasando explícitamente el repositorio con el flag `--repo javier20dev25/Tiender`.

### Fallo #2: `Cannot find project ref`
- **Síntoma:** El paso `supabase db push` falló porque no podía encontrar el ID del proyecto de Supabase.
- **Causa Raíz:** En un entorno de CI, el proyecto no está "linkeado" como en un entorno local.
- **Intento de Solución:** Se añadió el flag `--project-ref` al comando `supabase db push`, asumiendo un comportamiento consistente con otros comandos de la CLI.

### Fallo #3: `unknown flag: --project-ref`
- **Síntoma:** El workflow volvió a fallar porque el comando `supabase db push` no acepta el flag `--project-ref`.
- **Causa Raíz:** Inconsistencia en el diseño de la CLI de Supabase, donde diferentes subcomandos esperan la referencia del proyecto de diferentes maneras.
- **Intento de Solución:** Se añadió un nuevo paso previo, `supabase link --project-ref ...`, para vincular el proyecto explícitamente antes de ejecutar `db push`.

### Fallo #4: `flag needs an argument: --project-ref`
- **Síntoma:** El nuevo paso `supabase link` falló porque, aunque el flag era correcto, no recibía ningún valor.
- **Causa Raíz:** La variable del secreto (`${{ secrets.PROJECT_ID }}`) se estaba evaluando como una cadena vacía.
- **Diagnóstico (Incorrecto en ese momento):** Se asumió que era un problema de sintaxis en cómo la shell del workflow accedía a la variable.
- **Intento de Solución:** Se modificó la sintaxis para pasar el secreto como una variable de entorno (`env:`).

### Fallo #5: `flag needs an argument` (de nuevo)
- **Síntoma:** El error persistió, confirmando que el problema no era la sintaxis del YAML, sino el valor del secreto en sí.
- **Causa Raíz Verdadera (Identificada por Grok y Astaroth):** El secreto configurado en el repositorio de GitHub no se llamaba `PROJECT_ID`. El agente (yo) asumió incorrectamente el nombre de la variable. Una inspección de otros archivos (`supabase-deploy.yml`) reveló que el nombre correcto era `SUPABASE_PROJECT_ID`. Este fue el error crítico y la causa de la mayoría de los fallos anteriores.

### Fallo #6: `Module not found`
- **Síntoma:** Una vez corregido el nombre del secreto, el workflow avanzó pero falló en el despliegue de la función `orchestrate-signup`.
- **Causa Raíz:** La función importaba un archivo `_shared/cors.ts` que no existía en el repositorio.
- **Solución Final:** Se creó el archivo `supabase/functions/_shared/cors.ts` con las cabeceras CORS necesarias.

## 4. Solución Definitiva y Consolidada

1.  Se corrigió el archivo `.github/workflows/deploy.yml` para usar el nombre de secreto correcto: `${{ secrets.SUPABASE_PROJECT_ID }}`.
2.  Se aseguró que el paso `supabase link` se ejecutara antes de `supabase db push`.
3.  Se añadió el archivo `supabase/functions/_shared/cors.ts` que faltaba.

## 5. Lecciones Aprendidas y Acciones a Futuro

1.  **No Asumir, Verificar:** El error más grave fue asumir el nombre de una credencial (`PROJECT_ID`). La acción correcta desde el principio debió ser buscar en toda la base de código (`search_file_content`) por usos existentes del patrón `secrets.` para identificar las convenciones del proyecto. **Esto será un paso obligatorio en el futuro.**
2.  **Validar Secretos en CI:** Ante un error donde un secreto parece estar vacío, el primer paso de depuración debe ser añadir un `echo` en el workflow para confirmar si la variable se está recibiendo (`echo "El ID es: ${{ secrets.MI_SECRETO }}"`). Esto aísla el problema rápidamente.
3.  **Documentar Ecosistemas Específicos:** El error de permisos de `gh` en Termux es un problema específico del entorno. Queda registrado aquí para referencia futura: la solución es usar el flag `--repo`.
4.  **Reconocer el Error Humano (IA):** Mi modelo cometió un error fundamental al no verificar las convenciones existentes. Acepto la responsabilidad. Gracias a la supervisión y la intervención de Astaroth y Grok, se pudo diagnosticar y resolver el problema raíz.
