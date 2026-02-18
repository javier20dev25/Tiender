# Gemini Added Memories
- Astaroth, he reescrito completamente el archivo `public/viewer_template.html` con la lógica corregida. El problema era una función de renderizado de productos que faltaba y que he implementado directamente y de forma segura. Por favor, reinicia tu servidor (`npm start`) y refresca la página de tu tienda. El catálogo de productos ya debería mostrarse correctamente. Lamento los fallos anteriores; este método ha sido definitivo.
- Después de cada 'git push', debo verificar proactivamente el estado del despliegue en Vercel y los logs para diagnosticar errores y confirmar que las páginas cargan correctamente, en lugar de esperar a que el usuario lo haga.
- El nombre del proyecto en Vercel es "Tiender".
- My role for the 'Tiender' project is to act as an orchestrator between GitHub and Vercel, proactively managing the CI/CD workflow, diagnosing issues, and ensuring smooth deployments.

# Lecciones Aprendidas y Buenas Prácticas Documentadas

## 📂 Contexto de Proyecto: Blindaje y Errores Comunes
Este archivo contiene errores, soluciones y buenas prácticas para proyectos en React/Node/JavaScript moderno, así como reglas generales de implementación para evitar problemas recurrentes.

### 1️⃣ Errores Comunes y Soluciones
*   **Consistencia de Tipos con Supabase y TypeScript**:
    *   **Causa**: Inconsistencia entre los tipos definidos en `src/types.ts` (usando `| null` para columnas anulables) y los datos inferidos por Supabase/TypeScript, así como las expectativas de los componentes que recibían props con tipos más estrictos.
    *   **Prevención/Solución**:
        *   Mantener definiciones de tipos consistentes en `src/types.ts` usando `| null` para columnas anulables de la BD.
        *   Utilizar sentencias `select` explícitas en las consultas a Supabase para asegurar que todos los campos requeridos se obtengan.
        *   Al pasar props, usar aserciones de tipo (`as Type`) cuando sea necesario si el filtrado previo no reduce el tipo automáticamente.

*   **Configuración de Mocking con Vitest**:
    *   **Causa**: `vitest` no infiere correctamente los tipos de métodos anidados en objetos mockeados.
    *   **Prevención/Solución**: Usar `vi.mocked()` con casting explícito a `Mock`. Para APIs fluidas, hacer que el objeto sea "thenable".

*   **Gestión de Tipos en Props y Type Narrowing**:
    *   **Causa**: TypeScript no siempre reduce automáticamente el tipo de una variable compleja después de una verificación simple.
    *   **Prevención/Solución**: Aplicar aserciones de tipo (`as Type`) directamente en la prop si la lógica garantiza la validez.

*   **Uso de `select('*')` en Supabase**:
    *   **Causa**: Puede inferir tipos con propiedades opcionales (`| undefined`), causando conflictos.
    *   **Prevención/Solución**: Preferir `select` con listas explícitas de campos.

---

## 🛠️ Protocolos de Infraestructura (Tiender)

**CRÍTICO: Debido a limitaciones del entorno de desarrollo (Termux), se debe seguir el siguiente protocolo para cambios en la infraestructura:**

*   **Supabase:** Cualquier cambio en la configuración, migraciones de base de datos o funciones de Supabase **debe** realizarse a través de los workflows de **GitHub Actions**. El CLI de Supabase no funciona correctamente en este entorno.
*   **Vercel:** Los despliegues se gestionan principalmente vía **GitHub Actions** (push a main). El nombre del proyecto es **Tiender**.

**Protocolo de Commits y Push:**
*   La IA preparará los commits (añadir archivos y redactar mensajes).
*   La IA hará `git push` a la rama correspondiente tras la aprobación del usuario.

## 🔍 Diagnóstico y Mejores Prácticas de Git

### El trabajo "Parece Desaparecer"
Si `git status` muestra cambios inesperados pero `git push` indica `Everything up-to-date`, el trabajo ya está subido. Usa `git diff HEAD -- <archivo>` para confirmar cambios reales.

### Higiene del Directorio de Trabajo (Untracked Files)
No añadir todo (`git add .`). Investigar archivos inesperados. Eliminar artefactos de prueba o borradores antes de commitear.

## 🧭 Protocolo del Mapa Estructural (Structural Awareness)
1.  **Actualización por Iniciativa de la IA**: Tras crear/eliminar archivos o cambiar dependencias, ejecutar `python3 generate_structural_map.py`.
2.  **Actualización Manual**: El usuario puede solicitar "refresca el mapa".
3.  **Uso Obligatorio**: Consultar `conductor/structural_map.json` antes de proponer cambios y presentar el bloque `[STRUCTURAL AWARENESS]`.

---

### 🛡️ PayPal MCP Server Orchestration
Se ha instalado y verificado un servidor MCP oficial de PayPal para gestionar pagos y suscripciones directamente desde el asistente.
- **Paquete:** `@paypal/mcp` (instalado globalmente).
- **Comando:** `mcp --access-token=<TOKEN> --tools=all --paypal-environment=sandbox`
- **Uso:** El asistente debe usar estos comandos para verificar estados, suscripciones y transacciones.
- **Nota:** El token de acceso tiene una vida útil de ~8 horas. Si falla, usar `scripts/verify-paypal-connection.ts` para generar uno nuevo.
