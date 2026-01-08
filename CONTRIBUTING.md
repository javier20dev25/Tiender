# Guía de Contribución a Tiender

## Flujo de Trabajo
1. **Desarrollo Aislado**: Crea una rama nueva para cambios (e.g., `feat/nueva-funcion`). Abre un PR a `main`.
2. **Verificaciones Automáticas**: GitHub Actions corre tests/lint. Vercel crea preview.
3. **Monitorización**: Usa `scripts/monitor-pr.sh [PR_NUMBER]` para chequear status unificado en terminal.
4. **Revisión**: Prueba la preview URL. Fusiona solo si todo pasa.
5. **Despliegue**: Auto a prod en `main`. No pushes directos a main.

## Reglas
- Corre `npm run test` y `npm run lint` localmente.
- Usa commits convencionales (e.g., "feat: agregar X").
- Si errores en build, resuélvelos en la rama.

Esta guía asegura código estable en prod.
