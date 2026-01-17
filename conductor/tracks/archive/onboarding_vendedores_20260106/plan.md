# Plan: Onboarding de Vendedores y Publicación de Productos

This plan is structured in phases. Each phase should result in a testable piece of functionality.

## Phase 1: Setup y Autenticación
*Goal: Create the database structure and allow users to sign up and log in.*

- [ ] Task: Definir y crear las tablas `stores` y `products` en la base de datos de Supabase.
- [ ] Task: Implementar la UI para el registro de nuevos usuarios (email/contraseña).
- [ ] Task: Integrar Supabase Auth para manejar el registro y el inicio de sesión.
- [ ] Task: Escribir tests de lógica crítica para la creación de usuarios y la validación de datos.
- [ ] Task: Conductor - User Manual Verification 'Setup y Autenticación' (Protocol in workflow.md)

## Phase 2: Creación y Gestión de la Tienda
*Goal: Allow a logged-in user to create and manage their own store.*

- [ ] Task: Desarrollar el formulario para crear/editar una tienda (nombre, logo, número de WhatsApp).
- [ ] Task: Implementar la lógica para subir el logo de la tienda a Supabase Storage.
- [ ] Task: Configurar las políticas de Row Level Security (RLS) para la tabla `stores`, asegurando que los usuarios solo puedan gestionar su propia tienda.
- [ ] Task: Conductor - User Manual Verification 'Creación y Gestión de la Tienda' (Protocol in workflow.md)

## Phase 3: Creación y Visualización de Productos
*Goal: Allow a store owner to add products to their store.*

- [ ] Task: Crear la UI del dashboard del vendedor para listar los productos existentes.
- [ ] Task: Desarrollar el formulario para añadir un nuevo producto (título, precio, imagen).
- [ ] Task: Implementar la lógica para subir la imagen del producto a Supabase Storage.
- [ ] Task: Configurar las políticas de RLS para la tabla `products`.
- [ ] Task: Conductor - User Manual Verification 'Creación y Visualización de Productos' (Protocol in workflow.md)

## Phase 4: Optimización Automática de Imágenes
*Goal: Implement the backend process for image optimization.*

- [ ] Task: Crear una Supabase Edge Function que se active con la subida de nuevos objetos al bucket de imágenes.
- [ ] Task: Dentro de la Edge Function, usar la librería `sharp` para comprimir y crear múltiples tamaños de la imagen subida.
- [ ] Task: Escribir tests para la lógica de la Edge Function para asegurar que la optimización funciona correctamente.
- [ ] Task: Conductor - User Manual Verification 'Optimización Automática de Imágenes' (Protocol in workflow.md)
