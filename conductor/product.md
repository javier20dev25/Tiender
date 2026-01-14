# Concepto Principal: Marketplace Social-First

Tiender no es un marketplace transaccional clásico, sino una plataforma **social-first**. Su valor principal no reside únicamente en la compra-venta, sino en la **viralidad y la prueba social** que se genera y se comparte fuera de la aplicación.

El flujo central se basa en que los vendedores compartan "Tiendas Sociales" (páginas de producto) a través de enlaces directos en plataformas como WhatsApp e Instagram. Las interacciones de los compradores (votos, visitas, etc.) generan "señales sociales" (rankings, tendencias, tops de productos) que son, a su vez, compartibles. Este modelo busca influenciar a potenciales clientes incluso antes de que visiten la plataforma, aprovechando la confianza y curiosidad de los círculos sociales.

# Perfiles de Usuario Clave

## Vendedores Casuales / Artesanos (El Motor)

Son el motor inicial del producto. Típicamente, son individuos o pequeños creadores que ya venden de manera informal a través de WhatsApp o historias de Instagram.

*   **Necesidades:** Buscan una solución rápida, viral y simple para vender, evitando la complejidad y los costos de plataformas como Shopify.
*   **Rol en Tiender:** Crean las "Tiendas Sociales" y activan el ciclo de compartición viral en sus redes existentes.

## Nano-Influencers / Líderes de Opinión (El Acelerador)

Son el acelerador de crecimiento de la plataforma. Ya entienden el valor de la prueba social y saben cómo movilizar a sus comunidades.

*   **Necesidades:** Les interesan las herramientas que cuantifican y exhiben la popularidad (rankings, tops) para reforzar su credibilidad y monetizar su audiencia, ya sea con productos propios o curados.
*   **Rol en Tiender:** Hacen que la plataforma se vea poderosa y deseable en las redes sociales, amplificando el alcance y atrayendo a nuevos usuarios.

## Compradores Sociales (El Efecto Red)

Representan el efecto red y son cruciales para la validación de los productos.

*   **Comportamiento:** No siempre llegan con una intención de compra directa. A menudo, acceden por curiosidad, impulsados por un enlace compartido en un grupo o una historia.
*   **Influencias:** Toman decisiones basadas en la prueba social: rankings de productos, número de interacciones y las preferencias de su grupo.
*   **Rol en Tiender:** Convierten las interacciones pasivas en prueba social activa, validando los productos y alimentando el motor de tendencias.

# Producto Mínimo Viable (MVP)

## Hipótesis a Validar

El MVP está diseñado para validar una única y fundamental hipótesis:
**"Si le doy a una tienda un link social con productos y un método de pedido fácil por WhatsApp, la gente interactuará y comprará."**

## Funcionalidades Críticas del MVP

Para validar la hipótesis, el MVP se centrará exclusivamente en dos funcionalidades imprescindibles:

1.  **Generador de "Tienda Social":** El corazón del producto. Una herramienta que permite a un vendedor crear una página de producto simple, la cual tiene un enlace único y compartible. Este enlace es el punto de entrada para todas las interacciones y el ciclo viral.
2.  **Checkout vía WhatsApp:** El punto de conversión. Un botón "Pedir por WhatsApp" que, al ser presionado, pre-redacta un mensaje con los detalles del pedido, eliminando la fricción y aprovechando un hábito de comunicación ya existente en el usuario. Tiender no busca reemplazar WhatsApp, sino potenciarlo como canal de cierre.

## Funcionalidades Estratégicamente Postpuestas

*   **Dashboard de "Señales Sociales":** Aunque es una funcionalidad clave para la visión a largo plazo, se desarrollará después de validar el MVP. Su propósito será optimizar, profesionalizar y fidelizar a los vendedores una vez que exista un volumen de tráfico e interacciones suficiente para justificarlo.

---

# Visión Detallada de Funcionalidades v1

Esta sección detalla las características específicas de los planes y la experiencia de usuario.

## Modelo de Planes

### El Plan Estándar: El Lanzamiento

Este es el plan base para que cualquier vendedor pueda empezar a validar sus productos.

*   **Gestión de Tienda:**
    *   Añadir/Editar **Nombre de la Tienda**.
*   **Gestión de Productos:**
    *   Añadir productos con:
        *   Una foto por producto.
        *   Nombre.
        *   Precio (en USD).
        *   Descripción opcional.
*   **Panel de Métricas (Simplificado):**
    *   Visitas totales del día a la tienda.
    *   Visitas totales de la semana.
    *   **Ranking de Productos Más Gustados** (basado en 'likes').
*   **Informes con IA (Básico):**
    *   Un botón para generar un informe de IA que analizará los datos disponibles en este plan (visitas, likes, información de productos) para dar recomendaciones.
*   **Acciones de la Tienda:**
    *   Botón "Agregar/Actualizar Tienda" para guardar cambios.
    *   Botón "Compartir Tienda" que genera un enlace con un texto predefinido.

### El Plan Full: El Acelerador de Negocio

Este plan ofrece herramientas avanzadas para que los vendedores no solo validen, sino que optimicen su negocio. Incluye todo lo del Plan Estándar más:

*   **Gestión de Tienda Avanzada:**
    *   Añadir una **foto/logo** para la tienda.
*   **Métricas y Rankings Avanzados:**
    *   **Captura de Datos Completa:** Registra `likes`, `dislikes`, y productos "saltados" (sin reacción).
    *   **Métricas de Carrito:** Captura qué productos se añaden al carrito y en qué cantidad.
    *   **Rankings Detallados:**
        *   Top 5 productos más gustados.
        *   Top 5 productos menos gustados.
        *   Top 5 productos que generan indiferencia (saltados).
    *   **Métricas de Valor:**
        *   Total de productos añadidos al carrito (hoy y en la semana).
        *   Valor total en USD de los carritos (hoy y en la semana).
*   **Informes con IA (Avanzado):**
    *   El botón "Generar Informe con IA" incluye campos opcionales para que el vendedor añada:
        *   Total de productos facturados vía WhatsApp.
        *   Ingresos totales de esas ventas.
        *   Observaciones (ej. "promociones, pagos a cuotas...").
    *   La IA usará **todos los datos** para generar un informe financiero y administrativo de alto valor.
*   **Funcionalidades de Producto Externas:**
    *   Añadir un **enlace a un vídeo de YouTube** por producto.
    *   Añadir un **enlace directo al producto** en una tienda externa (ej. Shopify, Amazon).

## La Experiencia del Comprador: La "Tienda Social"

Esta es la interfaz pública que ven los clientes al recibir un enlace, inspirada en "Tinder para Productos".

*   **Diseño General:**
    *   Arriba: Logo (si es Plan Full) y Nombre de la Tienda.
    *   Centro: La imagen del producto.
    *   Superpuesto en la imagen (solo Plan Full):
        *   Icono de YouTube (abajo a la izquierda).
        *   Icono de "Ver en tienda" (abajo a la derecha).
*   **Interacción (Estilo Tinder):**
    *   Botón de Dislike (❌) a la izquierda.
    *   Botón de Siguiente Producto en medio.
    *   Botón de Like (❤️) a la derecha.
*   **Carrito de Compras:**
    *   Debajo de los botones de reacción: un botón **"Añadir al Carrito"**.
    *   Al añadir, aparece una **burbuja de carrito**.
    *   Al tocar la burbuja, se abre un resumen (modal) con:
        *   Tabla con miniatura, cantidad (+/-), precio unitario y total.
        *   Total general del pedido.
        *   Botón **"Hacer Pedido por WhatsApp"**.
    *   Este último botón redirige a WhatsApp con un mensaje pre-redactado. El cierre de la venta es **off-platform**.