# Hype Xperience — Sistema de diseño Maestro v2.0 (2026-11-19)

> **Autoridad:** Este documento está sincronizado con `spec.md` §4 (Borrador v3, 2026-11-19 — Documento Maestro de Arquitectura y Especificaciones v2.0). Sustituye al sistema anterior "Hype Night v2" (maleta azul con parches, acento dorado `#d4af37` en botones y fondo `#000000`).

---

## 1. Marca e Isotipo

- **Wordmark:** **`HYPE`** (Montserrat **ExtraBold**, peso `800`) + **`XPERIENCE`** (Montserrat **Light/Regular**, peso `300`/`400`, `letter-spacing: 0.15em`).
- **Isotipo oficial:** **maleta rígida roja 3D (`#E62E3D`)** sobre fondo limpio, **sin parches**.
- **Regla de maleta única:** la maleta roja 3D (`#E62E3D`) es la **única imagen de maleta en toda la app** (pantalla de carga/splash, acceso/login, registro, encabezado, Perfil y pantalla de error). Quedan eliminadas la maleta azul con parches, el riel de parches en Feed/Explorar y la H dorada como isotipo principal.
- **Iconografía:** únicamente **iconos de línea** (zero emojis como iconos en toda la app). Las reseñas usan estrellas `1.0–5.0` (descartado el símbolo de fuego).

---

## 2. Paleta de Colores (Dark Mode por defecto & Light Mode)

### Dark Mode (Nocturno — por defecto)

| Token / Uso | Valor |
|---|---|
| Fondo principal (`background`) | `#0B0B0E` |
| Superficie de tarjetas translúcidas (`cardBackground`) | `rgba(28, 28, 34, 0.75)` con `backdrop-filter: blur(16px)` |
| Borde sutil de tarjetas (`border`) | `1px solid rgba(230, 46, 61, 0.25)` |
| Botón primario / acento marca (`accent` / `primaryButton`) | `#E62E3D` (sustituye al `#cf2d2b` y al dorado en botones), texto `#FFFFFF` centrado y simétrico |
| Texto principal | `#FFFFFF` |
| Texto secundario | `#A1A1AA` |
| Calendario — tus reservas | `#d4af37` (dorado) |
| Calendario — eventos próximos | `#46578f` (azul) |
| Fondo de Splash | `#000000` (negro puro) |

### Light Mode (Diurno / Playa — editable en Perfil)

| Token / Uso | Valor |
|---|---|
| Fondo / tarjetas perladas translúcidas | `rgba(248, 248, 250, 0.85)` con `backdrop-filter: blur(16px)` y sombras suaves |
| Acento coral / carmesí (`lightAccent`) | `#F23847` |
| Texto principal | `#111827` |
| Texto secundario | `#4B5563` |

---

## 2b. Liquid Glass, Hojas "?" Opacas, Selector de Fecha y Splash

- **Liquid Glass:** tarjetas, paneles, barras flotantes, modales y el **selector de fecha** (`T35`) usan vidrio esmerilado en ambos temas (`blur(16px)`).
- **Hojas de ayuda `?` 100% opacas (`T33`):** toda hoja de ayuda abierta debe ser completamente opaca (`#141418` en Dark / `#FFFFFF` en Light) con separación visual total respecto al contenido detrás, sin superposición de texto.
- **Splash Screen (`8000ms` / `900ms`):** video/animación de la **maleta rígida roja 3D girando** sobre **fondo negro puro `#000000`**, sin barra de progreso y sin texto:
  - Primera carga: **`8000 ms`** (`8 s`, un giro completo).
  - Cambio de modo (Explorador ↔ Aliado): **`900 ms`**.

---

## 3. Tipografía y Botones

- **Fuente de la aplicación:** **`Montserrat`** para todo el texto de la app (titulares, cuerpo, botones, etiquetas, tickets, códigos y montos en MXN).
- **Código fuente:** **`JetBrains Mono`** únicamente para código fuente en editor/herramientas.
- **Botón principal (`T40`):** color rojo **`#E62E3D`** con texto blanco `#FFFFFF` **centrado y simétrico** en todos los botones de interacción.

---

## 4. Navegación, Barra de Aura, Bienvenida, Calendario y Responsividad

- **Bienvenida (`T34`):** separada del logo; al iniciar sesión, el Explorador ve **`"Bienvenido a la Saga del Sol"`** acompañado de su nombre. Nunca se muestra `"MODO TURISTA"` en ninguna pantalla.
- **Pila inferior fija (de arriba hacia abajo en el fondo de pantalla, `T38`):**
  1. Contenido de la pantalla
  2. **Barra de navegación:** 5 botones horizontales flotantes e independientes (`Feed`, `Explorar`, `Tickets`, `Taxi`, `Wallet`)
  3. **Barra de Aura (componente firma, directamente DEBAJO de la barra de navegación):** contenedor tipo píldora (`border-radius: 999px`) con el orbe fluido rojo a la izquierda, placeholder **`"Crea tu Xperience con Aura..."`** y botón circular brillante de envío a la derecha.
- **Explorar unificado (`T37`):** el mapa de lugares y el calendario conviven en la misma sección `Explorar`.
- **Calendario simplificado en Feed:** sin botones de texto `Mes` / `Semana`, con botones circulares de flechas (`⬅️` / `➡️` / `⬆️` en iconos de línea), en vista semanal solo día y mes, en vista mensual solo el mes actual, sin leyenda de `"vista compartida"`. Reservas en dorado (`#d4af37`), eventos en azul (`#46578f`).
- **Pin de ubicación verificada (`T41`):** en tarjetas de negocio con ubicación verificada, el icono pin va junto al nombre de la dirección/zona.
- **Pantallas de acceso minimalistas y responsivas (`T43`):** jerarquía clara, una acción principal por pantalla, tarjeta centrada con ancho máximo, sin desbordamiento horizontal ni cortes en móvil chico (`390×844`), tableta (`768px+`) ni escritorio (`1280px+`).
