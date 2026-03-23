# Tiender CLI - Guía de Usuario

Esta herramienta de línea de comandos permite gestionar tu tienda "Tiender" directamente desde la terminal. Puedes crear cuentas, gestionar productos, ver estadísticas y obtener el enlace de tu tienda.

## Instalación

Asegúrate de tener instalado [Node.js](https://nodejs.org/) y [Bun](https://bun.sh/) (o npm).

```bash
# Instalar dependencias
bun install
```

## Comandos Disponibles

Para ejecutar la CLI, usa:
```bash
bun scripts/tiender.ts <comando> [opciones]
```

### 1. Autenticación

#### `login`
Inicia sesión en tu cuenta de Tiender.
```bash
bun scripts/tiender.ts login --email tu@email.com --password tu_password
```

#### `status`
Verifica el estado de tu sesión y la información de tu tienda.
```bash
bun scripts/tiender.ts status
```

#### `logout`
Cierra la sesión actual (elimina el archivo `.session.json`).
```bash
bun scripts/tiender.ts logout
```

### 2. Gestión de la Tienda

#### `create-store`
Crea una nueva tienda si aún no tienes una.
```bash
bun scripts/tiender.ts create-store --name "Mi Tienda" --slug "mi-tienda"
```

#### `update-store`
Actualiza la información de tu tienda (nombre o logo).
```bash
bun scripts/tiender.ts update-store --name "Nuevo Nombre" --logo "ruta/al/logo.png"
```

#### `view-store`
Obtén el enlace público de tu tienda.
```bash
bun scripts/tiender.ts view-store
```

### 3. Gestión de Productos

#### `list-products`
Lista todos los productos de tu tienda.
```bash
bun scripts/tiender.ts list-products
```

#### `add-product`
Añade un nuevo producto a tu tienda.
```bash
bun scripts/tiender.ts add-product --name "Producto 1" --price 19.99 --description "Descripción" --image "ruta/a/imagen.jpg"
```

#### `update-product`
Edita un producto existente mediante su ID.
```bash
bun scripts/tiender.ts update-product --id "ID_DEL_PRODUCTO" --name "Nuevo Nombre" --price 25.00
```

#### `delete-product`
Elimina un producto de la tienda.
```bash
bun scripts/tiender.ts delete-product --id "ID_DEL_PRODUCTO"
```

### 4. Estadísticas y Métricas

#### `stats`
Obtén métricas detalladas de tu tienda (visitas, likes, carritos, etc.).
```bash
bun scripts/tiender.ts stats
```

## Flujo de Trabajo para Agentes de IA

La CLI está diseñada para ser compatible con agentes de IA. Las respuestas se proporcionan en el flujo de la terminal para que puedan ser capturadas y procesadas fácilmente.

1. **Login**: `bun scripts/tiender.ts login ...`
2. **Configuración**: `bun scripts/tiender.ts create-store ...` o `update-store ...`
3. **Carga masiva**: Usar `add-product` de forma iterativa.
4. **Verificación**: `bun scripts/tiender.ts list-products` y `view-store`.
5. **Análisis**: `bun scripts/tiender.ts stats`.

---
© 2026 Tiender Inc.
