# Identidad de Diseño: Tiender "Neon Glass" 🚀

Este documento define la dirección visual y de experiencia de usuario (UX) para el rediseño de Tiender. La visión es fusionar la utilidad de un E-commerce con la adicción visual de **Tinder**, **NGL** y **TikTok**.

---

## 🎨 1. Sistema Esencial: "Neon Glass"

### Paleta de Colores
*   **Acción Positiva / Primaria (Sunset Gradient):** 
    *   De `#FF4D4D` (Rojo Pasión) a `#F9CB28` (Amarillo Sol).
    *   Uso: Botones "Like", "Inscripción", "Completar Pago".
*   **Acción de Valor / Secundaria (Electric):**
    *   `#00FF94` (Verde Neón) o `#00F0FF` (Cian Eléctrico).
    *   Uso: Botones de "Añadir al Carrito", "Finalizar Compra WhatsApp".
*   **Sistemas de Fondos:**
    *   **Vendedor (Dashboard):** Negro Profundo (`#09090b` - Zinc 950). Estética NGL/Exclusiva.
    *   **Cliente (Tienda):** Blanco casi puro (`#FAFAFA`) para priorizar la fotografía de producto.

### Tipografía
*   **Títulos y Precios:** `Clash Display` o `Space Grotesk`. (Fuentes con "actitud", tecnológicas y virales).
*   **Cuerpo de Texto:** *System Sans* (Inter/Roboto) para máxima legibilidad.

---

## 📱 2. Experiencia de Usuario (UX)

### Vista de Tienda (Swipe Experience)
*   **Efecto "Stack":** Las tarjetas de producto deben verse apiladas, mostrando ligeramente el borde de la siguiente para incitar al deslizado.
*   **Overlay de Texto:** Información del producto (título y precio) directamente sobre la imagen en la parte inferior con un gradiente negro suave (`bg-gradient-to-t from-black/80 to-transparent`).
*   **Sellos de Validación:** Aparecen marcas de agua dinámicas al interactuar:
    *   Deslizar Derecha -> Sello "ME GUSTA" inclinado.
    *   Deslizar Izquierda -> Sello "SIGUIENTE".
*   **Carrito Palpitante:** El botón de carrito flotante debe tener una micro-animación `pulse` cuando contenga ítems.

### Dashboard del Vendedor (Centro de Comando)
*   **Dark Mode Forzado:** Interfaz oscura de alto contraste.
*   **Métricas de Impacto:** Números gigantes para visitas y ventas.
*   **Inbox de Deseos:** Las notificaciones de interés se muestran como burbujas de chat con la foto del producto, no como simples líneas de texto.

---

## 📈 3. Elementos Virales y Plan Full

### Social Sharing (Flex Model)
*   **Spotify Wrapped Style:** Generación de imágenes dinámicas para compartir que no parecen catálogos, sino logros o tendencias.
*   **Copies Dinámicos:** "🔥 Mi tienda está on fire", "Top 3 de la semana", "¡Casi agotados!".

### Funciones Premium "Gamificadas"
*   **Match de Descuento:** Al saltar la oferta por inactividad, se presenta como una pantalla de "¡ES UN MATCH!", creando urgencia emocional.
*   **AI Insights:** Consejos de la IA presentados como "Story Cards" efímeras.

---

## 🛠️ Notas de Implementación

1.  **Compatibilidad:** Estos cambios son puramente visuales y de UX. No afectan la integridad de la base de datos ni los procesos de pago de PayPal.
2.  **Tailwind:** Se extenderá la configuración de Tailwind para incluir los gradientes personalizados y las nuevas fuentes.
3.  **Radio de Bordes:** Transición de `rounded-xl` a `rounded-[30px]` para dar un aspecto más orgánico y moderno (Mobile-First).
