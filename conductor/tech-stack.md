# Pila Tecnológica (Tech Stack)

Esta es la pila tecnológica seleccionada para el desarrollo de Tiender, alineada con la visión del producto, las guías de marca y los requisitos del MVP.

## Lenguaje Principal

*   **TypeScript:** Proporciona una base de código sólida, tipada y escalable desde el primer día, reduciendo errores y mejorando la mantenibilidad.

## Frontend

*   **React (con Vite):** Permite un ciclo de desarrollo rápido y una experiencia de desarrollo moderna, ideal para iterar rápidamente en la interfaz de usuario "social-first".
*   **React Router:** Un componente necesario para la funcionalidad de las "Tiendas Sociales", ya que permite que cada tienda sea accesible y compartible a través de una URL única.
*   **Tailwind CSS:** Facilita la implementación de una identidad visual consistente y vibrante de manera rápida, siendo ideal para construir el look & feel viral que se busca.

## Backend & Base de Datos

*   **Supabase:** Actúa como la solución de backend integral, proveyendo autenticación de usuarios, base de datos en tiempo real y capacidades de despliegue sin fricción. Simplifica enormemente la infraestructura necesaria para el MVP.

## Flujo de Trabajo y Despliegue (CI/CD)

*   **GitHub Actions & Supabase:** Se utiliza un bot automatizado que coordina los despliegues y otras tareas entre el repositorio de GitHub y la plataforma de Supabase.

## Testing

*   **Vitest:** Como corredor de pruebas principal, seleccionado por su alta velocidad, su integración nativa con Vite y su potente sistema de mocks.
*   **React Testing Library:** Para renderizar componentes y simular interacciones del usuario, siguiendo la filosofía de testear el software de la manera en que el usuario lo utiliza.
*   **Mocking (`vi.mock`):** La estrategia clave para el aislamiento de componentes y la simulación de dependencias externas. Se utiliza `vi.mock` de forma extensiva para crear dobles de prueba de servicios como Supabase, permitiendo tests de integración de frontend robustos y predecibles sin depender de una red o una base de datos real.
