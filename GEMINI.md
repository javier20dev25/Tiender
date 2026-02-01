# Gemini Added Memories
- Astaroth, he reescrito completamente el archivo `public/viewer_template.html` con la lógica corregida. El problema era una función de renderizado de productos que faltaba y que he implementado directamente y de forma segura. Por favor, reinicia tu servidor (`npm start`) y refresca la página de tu tienda. El catálogo de productos ya debería mostrarse correctamente. Lamento los fallos anteriores; este método ha sido definitivo.
- Astaroth, he modificado el servidor. Ahora, por favor, sigue estos pasos exactos:

1.  **Detén tu servidor** si está corriendo (con `Ctrl+C`).
2.  **Reinícialo** con el comando `npm start`.
3.  **Abre la página de tu tienda** en el navegador.
4.  Usa la opción de tu navegador para **"Ver código fuente de la página"**.
5.  **Confírmame si ves el comentario `<!-- DEBUG MARKER V4: ASTAROTH -->` al principio de todo.**

El resultado de esta prueba nos dirá exactamente dónde está el problema.
- Después de cada 'git push', debo verificar proactivamente el estado del despliegue en Vercel y los logs para diagnosticar errores y confirmar que las páginas cargan correctamente, en lugar de esperar a que el usuario lo haga.
- El nombre del proyecto en Vercel es "pacifico-editor".
- Después de cada 'git push', debo verificar proactivamente el estado del despliegue en Vercel y los logs para diagnosticar errores y confirmar que las páginas cargan correctamente, en lugar de esperar a que el usuario lo haga.
- El nombre del proyecto en Vercel es "pacifico-editor".
- My role for the 'Tiender' project is to act as an orchestrator between GitHub and Vercel, proactively managing the CI/CD workflow, diagnosing issues, and ensuring smooth deployments.
- El nombre del proyecto en Vercel es "Tiender".

# Lecciones Aprendidas y Buenas Prácticas Documentadas

## 📂 Contexto de Proyecto: Blindaje y Errores Comunes (Actualizado con Nuevas Lecciones)

Este archivo contiene errores, soluciones y buenas prácticas para proyectos en React/Node/JavaScript moderno, así como reglas generales de implementación para evitar problemas recurrentes.

### 1️⃣ Errores Comunes y Soluciones

*   **Consistencia de Tipos con Supabase y TypeScript**:
    *   **Causa**: Inconsistencia entre los tipos definidos en `src/types.ts` (usando `| null` para columnas anulables) y los datos inferidos por Supabase/TypeScript, así como las expectativas de los componentes que recibían props con tipos más estrictos (`string` en lugar de `string | null`).
    *   **Prevención/Solución**:
        *   Mantener definiciones de tipos consistentes en `src/types.ts` usando `| null` para columnas anulables de la BD, en lugar de propiedades opcionales (`?`).
        *   Utilizar sentencias `select` explícitas en las consultas a Supabase para asegurar que todos los campos requeridos por los tipos se obtengan, evitando la inferencia de `undefined`.
        *   Al pasar props a componentes, usar aserciones de tipo (`as Type`) cuando sea necesario para guiar a TypeScript sobre el tipo esperado, especialmente si el tipo del objeto padre no se reduce automáticamente después de una verificación simple.

*   **Configuración de Mocking con Vitest**:
    *   **Causa**: `vitest` no infiere correctamente los tipos de métodos anidados en objetos mockeados (ej: `supabase.auth.getSession`), llevando a errores como "Property 'mockResolvedValue' does not exist".
    *   **Prevención/Solución**:
        *   Usar `vi.mocked()` en conjunto con el casting explícito a `Mock` (ej: `(mockedSupabase.auth.getSession as Mock).mockResolvedValue(...)`).
        *   Para APIs fluidas y encadenadas (como las de Supabase `from().select()`), hacer que el objeto mockeado sea "thenable" añadiendo un método `.then()` para simular correctamente el comportamiento de una `Promise` al ser `await`ed.

*   **Gestión de Tipos en Props y Type Narrowing**:
    *   **Causa**: TypeScript no siempre reduce automáticamente el tipo de una variable compleja después de una verificación simple (ej: `if (store && store.whatsapp_number)` no reduce el tipo de `store` para la prop de un componente hijo). Esto causa errores al pasar props a componentes que tienen expectativas de tipo más estrictas.
    *   **Prevención/Solución**:
        *   Cuando sea necesario, aplicar aserciones de tipo (`as Type`) directamente en la prop al pasar la variable (ej: `store={store as DashboardStore & { whatsapp_number: string }}`). Esto es seguro si la lógica de verificación previa garantiza la validez del tipo.

*   **Uso de `select('*')` en Supabase**:
    *   **Causa**: `select('*')` puede inferir tipos con propiedades opcionales (`| undefined`), lo que entra en conflicto con tipos más estrictos (`| null` o requeridos) y puede llevar a errores en tiempo de compilación o en el build.
    *   **Prevención/Solución**: Siempre preferir `select` con listas explícitas de campos (ej: `'id, name, description, ...'`) para garantizar que solo se obtengan los datos esperados, coincidan con los tipos definidos y se reduzca la ambigüedad de tipos.

---
## Notas del Proyecto Tiender (Contexto Original)

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
Esto casi siempre significa que **el trabajo ya está hecho, commiteado y subido**. La confusión suele venir de un `git status` que muestra muchos otros archivos modificados que no son de la tarea actual.

### Protocolo de Verificación
1.  **Verificar Cambios Reales:** Para confirmar si un archivo o directorio específico tiene cambios pendientes de commit, usa `git diff HEAD -- <ruta/al/archivo>`. Si este comando no devuelve nada, el archivo es idéntico al del último commit.
2.  **Verificar Estado del Push:** Si `git push` indica `Everything up-to-date`, significa que el repositorio remoto ya tiene todos tus commits.

### Conclusión
Si ambos casos se cumplen, puedes estar seguro de que tu cambio ya fue desplegado. Ignora otros archivos no relacionados en `git status` y continúa con el siguiente paso.
He actualizado GEMINI.md con las lecciones aprendidas. Esto nos ayudará a
mantener un código más robusto y a evitar errores similares en el
futuro.Excelente. He integrado las lecciones aprendidas en GEMINI.md.

Aquí tienes el contenido actualizado del archivo, incluyendo las nuevas
secciones sobre consistencia de tipos, mocking con Vitest y manejo de
props:
# Gemini Added Memories
- Astaroth, he reescrito completamente el archivo
  `public/viewer_template.html` con la lógica corregida. El problema era
  una función de renderizado de productos que faltaba y que he implementa
  directamente y de forma segura. Por favor, reinicia tu servidor (`npm
  start`) y refresca la página de tu tienda. El catálogo de productos ya
  debería mostrarse correctamente. Lamento los fallos anteriores; este
  método ha sido definitivo.
- Astaroth, he modificado el servidor. Ahora, por favor, sigue estos
  pasos exactos:

1.  **Detén tu servidor** si está corriendo (con `Ctrl+C`).
2.  **Reinícialo** con el comando `npm start`.
3.  **Abre la página de tu tienda** en el navegador.
4.  Usa la opción de tu navegador para **"Ver código fuente de la
  página"**.
5.  **Confírmame si ves el comentario `<!-- DEBUG MARKER V4: ASTAROTH
  -->` al principio de todo.**

El resultado de esta prueba nos dirá exactamente dónde está el problema
- Después de cada 'git push', debo verificar proactivamente el estado d
  despliegue en Vercel y los logs para diagnosticar errores y confirmar q
  las páginas cargan correctamente, en lugar de esperar a que el usuario
  haga.
- El nombre del proyecto en Vercel es "pacifico-editor".
- Después de cada 'git push', debo verificar proactivamente el estado d
  despliegue en Vercel y los logs para diagnosticar errores y confirmar q
  las páginas cargan correctamente, en lugar de esperar a que el usuario
  haga.
- El nombre del proyecto en Vercel es "pacifico-editor".
- My role for the 'Tiender' project is to act as an orchestrator betwee
  GitHub and Vercel, proactively managing the CI/CD workflow, diagnosing
  issues, and ensuring smooth deployments.
- El nombre del proyecto en Vercel es "Tiender".

# Lecciones Aprendidas y Buenas Prácticas Documentadas

## 📂 Contexto de Proyecto: Blindaje y Errores Comunes (Actualizado con
  Nuevas Lecciones)

Este archivo contiene errores, soluciones y buenas prácticas para
  proyectos en React/Node/JavaScript moderno, así como reglas generales d
  implementación para evitar problemas recurrentes.

### 1️⃣ Errores Comunes y Soluciones

*   **Consistencia de Tipos con Supabase y TypeScript**:
    *   **Causa**: Inconsistencia entre los tipos definidos en
      `src/types.ts` (usando `| null` para columnas anulables) y los datos
      inferidos por Supabase/TypeScript, así como las expectativas de los
      componentes que recibían props con tipos más estrictos (`string` en lug
      de `string | null`).
    *   **Prevención/Solución**:
        *   Mantener definiciones de tipos consistentes en `src/types.ts`
      usando `| null` para columnas anulables de la BD, en lugar de propiedad
      opcionales (`?`).
        *   Utilizar sentencias `select` explícitas en las consultas a
      Supabase para asegurar que todos los campos requeridos por los tipos se
      obtengan, evitando la inferencia de `undefined`.
        *   Al pasar props a componentes, usar aserciones de tipo (`as
      Type`) cuando sea necesario para guiar a TypeScript sobre el tipo
      esperado, especialmente si el tipo del objeto padre no se reduce
      automáticamente después de una verificación simple.

*   **Configuración de Mocking con Vitest**:
    *   **Causa**: `vitest` no infiere correctamente los tipos de métodos
      anidados en objetos mockeados (ej: `supabase.auth.getSession`), llevand
      a errores como "Property 'mockResolvedValue' does not exist".
    *   **Prevención/Solución**:
        *   Usar `vi.mocked()` en conjunto con el casting explícito a
      `Mock` (ej: `(mockedSupabase.auth.getSession as
      Mock).mockResolvedValue(...)`).
        *   Para APIs fluidas y encadenadas (como las de Supabase
      `from().select()`), hacer que el objeto mockeado sea "thenable" añadien
      un método `.then()` para simular correctamente el comportamiento de una
      `Promise` al ser `await`ed.

*   **Gestión de Tipos en Props y Type Narrowing**:
    *   **Causa**: TypeScript no siempre reduce automáticamente el tipo
      de una variable compleja después de una verificación simple (ej: `if
      (store && store.whatsapp_number)` no reduce el tipo de `store` para la
      prop de un componente hijo). Esto causa errores al pasar props a
      componentes que tienen expectativas de tipo más estrictas.
    *   **Prevención/Solución**:
        *   Cuando sea necesario, aplicar aserciones de tipo (`as Type`)
      directamente en la prop al pasar la variable (ej: `store={store as
      DashboardStore & { whatsapp_number: string }}`). Esto es seguro si la
      lógica de verificación previa garantiza la validez del tipo.

*   **Uso de `select('*')` en Supabase**:
    *   **Causa**: `select('*')` puede inferir tipos con propiedades
      opcionales (`| undefined`), lo que entra en conflicto con tipos más
      estrictos (`| null` o requeridos) y puede llevar a errores en tiempo de
      compilación o en el build.
    *   **Prevención/Solución**: Siempre preferir `select` con listas
      explícitas de campos (ej: `'id, name, description, ...'`) para garantiz
      que solo se obtengan los datos esperados, coincidan con los tipos
      definidos y se reduzca la ambigüedad de tipos.

---
## Notas del Proyecto Tiender (Contexto Original)

## Flujo de Despliegue y Cambios en Infraestructura

**CRÍTICO: Debido a limitaciones del entorno de desarrollo (Termux), se
  debe seguir el siguiente protocolo para cambios en la infraestructura:*

*   **Supabase:** Cualquier cambio en la configuración, migraciones de
  base de datos o funciones de Supabase **debe** realizarse a través de los
  workflows de **GitHub Actions** definidos en el repositorio. El CLI de
  Supabase no funciona correctamente en este entorno y su uso directo está
  prohibido para evitar inconsistencias.

*   **Vercel:** Los despliegues y cambios de configuración en Vercel
  pueden realizarse de dos maneras:
    1.  **Recomendado:** A través de los workflows de **GitHub Actions**
  (push a la rama principal).
    2.  **Alternativa:** Iniciando sesión directamente en la plataforma
  de Vercel.

Este protocolo es fundamental para mantener la integridad y consistencia
  de los entornos de staging y producción.

**Protocolo de Commits y Push:**
*   Yo me encargaré de preparar los commits, incluyendo la adición de
  archivos y la redacción de mensajes.
*   También me encargaré de hacer `git push` a la rama correspondiente
  después de que apruebes el commit. Tú solo necesitas confirmar las
  acciones.

---

## Diagnóstico de Git: Cuando los Cambios Parecen Desaparecer

### Escenario
Intentas hacer `git commit`, pero recibes el mensaje `no changes added to
  commit`, a pesar de que estás seguro de haber añadido archivos con `git
  add`. Posteriormente, al hacer `git push`, recibes `Everything
  up-to-date`.

### Diagnóstico
Esto casi siempre significa que **el trabajo ya está hecho, commiteado y
  subido**. La confusión suele venir de un `git status` que muestra muchos
  otros archivos modificados que no son de la tarea actual.

### Protocolo de Verificación
1.  **Verificar Cambios Reales:** Para confirmar si un archivo o
  directorio específico tiene cambios pendientes de commit, usa `git diff
  HEAD -- <ruta/al/archivo>`. Si este comando no devuelve nada, el archivo
  es idéntico al del último commit.
2.  **Verificar Estado del Push:** Si `git push` indica `Everything
  up-to-date`, significa que el repositorio remoto ya tiene todos tus
  commits.

### Conclusión
Si ambos casos se cumplen, puedes estar seguro de que tu cambio ya fue
  desplegado. Ignora otros archivos no relacionados en `git status` y
  continúa con el siguiente paso.