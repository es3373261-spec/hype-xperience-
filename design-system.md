# Hype Xperience — Sistema de diseño "Hype Night" v2 (Liquid Glass)

Definido 2026-11-08 por Pedro, actualizado 2026-11-09 con Liquid Glass. Es el sistema oficial para la app real (Antigravity / Teamwork, spec.md) y para la demo en Muse. La imagen 0 (`341266_0_8jhd.jpg`, negro y dorado) sigue siendo la referencia de pantallas; este documento define el logo, el tema, la tipografía y cómo el logo se traduce en flujo y funciones.

## 1. Logo oficial

- **Principal:** la maleta azul sola, la imagen principal, sin ningún objeto apoyado ni debajo, con HYPE y XPERIENCE juntos en el centro, HYPE en una línea y XPERIENCE en la otra, bordados en blanco con **contorno negro en la costura (ya no dorado)**, y alrededor de ellos los demás parches — `workspace/hype-xperience/icon/hype-maleta-parches.png` (y `.gif`).
- **Dónde se usa la maleta con parches en la app:** SOLO en la pantalla de carga (splash), en el icono de la app y en la pantalla de elección Registro / Inicio de sesión. Ya no se ve en el encabezado, ni en Perfil, ni en la pantalla de error. La pantalla de carga ya no lleva el contorno amarillo en las letras de Hype Xperience.
- **Tema oscuro tipo Super AMOLED (2026-11-08):** fondo principal negro puro #000000, tarjetas y superficies en negro muy oscuro (#000000 a #0a0a0a, sin grises azulados), texto principal en blanco puro o casi blanco, acentos dorados y de la maleta intactos para que resalten sobre el negro. La pantalla de carga sigue al tema: en oscuro va en negro puro; en claro va en crema #f5f2ea (2026-11-09, Pedro). El tema claro no cambia. Aplica a todas las pantallas: Feed, Explorar, Tickets, Wallet, Taxi, calendario, Concierge, Perfil y autenticación.
- **Tipografía (2026-11-08):** todas las letras de la app usan la tipografía del título de la app en la parte superior izquierda del encabezado — esa es la tipografía que quiere Pedro (Montserrat, verificado en el código de la demo en v26). Títulos, cuerpo, botones, etiquetas, montos, códigos y fechas, todo con esa misma fuente.
  - Parches: pirámide maya (Chichén Itzá), Ángel de la Independencia, La Quebrada (clavadista tirándose), "Who's Crazy?", "ONE BY PRO", banana de Acapulco, jetski, sol con rayos, trueno y bocho de taxi azul. (El parche de Afterlife Zamna fue quitado el 2026-11-08 por pedido de Pedro.)
- **Secundario:** la H dorada sobre negro — `workspace/hype-xperience/icon/hype-xperience-icon-1024.png`. Se usa donde la maleta no cabe: icono de la app en el teléfono, avatar, favicon, marca de agua.
- **Uso:** la maleta con parches va en splash, registro y encabezado de la app; la H dorada va en el icono del sistema y en botones pequeños. Nunca se deforma el logo ni se le cambian los colores.

## 2. Tema "Hype Night" (modo oscuro, por defecto)

Basado en **Super AMOLED**, con los colores de la maleta:

| Uso | Color | Hex |
|---|---|---|
| Fondo principal | Negro puro | `#000000` |
| Fondo tarjetas / paneles | Negro muy oscuro | `#080808` |
| Fondo elevado / barra flotante | Negro muy oscuro | `#0a0a0a` |
| Texto principal | Blanco | `#ffffff` |
| Texto secundario | Gris claro | `#a9b1d6` |
| Azul maleta | Azul Hype | `#46578f` |
| Azul maleta oscuro | Azul Hype dark | `#2e3a5c` |
| Coral sombrilla | Coral Hype | `#ff8a5c` |
| Dorado | Dorado Hype | `#d4af37` |
| Dorado claro | Dorado light | `#e0af68` |
| Éxito / pagado | Verde | `#9ece6a` |
| Alerta / error | Rojo | `#f7768e` |

- **Modo claro:** mismo sistema invertido — fondo `#f5f2ea`, tarjetas blancas, texto `#1a1b26`, acentos dorado y coral. El usuario lo cambia en Perfil; el oscuro es el de arranque.
- **Botón principal:** dorado `#d4af37`, texto oscuro `#1a1b26`.
- **Tarjetas:** redondeadas (16–20 px), foto hero arriba, borde sutil `#1a1a1a` en oscuro.
- **Barra inferior del turista:** caja de texto del Concierge AI (Feed/Explorar/Tickets/Calendario a su izquierda, Taxi y Wallet a la derecha). Los demás roles conservan su barra inferior flotante, activo en dorado. Perfil arriba a la derecha, con avatar y rol.

## 2b. Liquid Glass — translúcido, ambos temas (2026-11-09, Pedro)

Las tarjetas, paneles, barras flotantes, modales y la caja del Concierge usan **vidrio translúcido** (liquid glass): desenfoque de fondo + relleno semitransparente + borde luminoso sutil + sombra suave. El dorado `#d4af37`, el negro de fondo y la tipografía Montserrat no cambian; solo las superficies pasan de sólidas a vidrio.

| Elemento | Tema oscuro | Tema claro |
|---|---|---|
| Relleno del vidrio | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.65)` |
| Borde | 1px `rgba(255,255,255,0.16)` | 1px `rgba(255,255,255,0.6)` + sombra suave |
| Desenfoque de fondo | `blur(20px) saturate(180%)` | `blur(20px) saturate(180%)` |
| Fondo detrás | Negro puro `#000000` (se mantiene) | `#f5f2ea` (se mantiene) |
| Texto | Blanco `#ffffff` | `#1a1b26` |

- **Dónde aplica:** tarjetas del Feed, tarjetas flotantes de Wallet/Taxi/Calendario, caja del Concierge, paneles de proveedor, tickets, modales, tarjeta de Perfil, barras inferiores y el panel de mando Hype.
- **Legibilidad:** el texto sobre vidrio debe mantener contraste — si hace falta, se sube la opacidad del relleno o se añade un velo oscuro sutil detrás del texto; nunca texto sobre una foto movida sin el vidrio detrás.
- **Fotos hero:** siguen a sangre completa dentro de las tarjetas de vidrio; el vidrio va en los paneles y la información, no encima de la foto.
- **Splash y logo:** la pantalla de carga sigue siendo solo la maleta con parches, sin vidrio ni letras, pero su fondo sigue al tema: negro puro en oscuro, crema #f5f2ea en claro (2026-11-09, Pedro).

## 3. Tipografía

- **Wordmark / nombre de la marca: letra gruesa, redondeada y amigable, estilo parche bordado** — como la de la muestra `marketing/wordmark-hype-xperience.png`: en la app va **apilado, HYPE arriba y XPERIENCE abajo, uno encima del otro** (Pedro lo pidió así el 2026-11-08, después de haberlo pedido en una sola línea). En la app el equivalente es **Montserrat (Bold / SemiBold)**: la misma fuente que todo el resto de la app. Nunca letra delgada, serif elegante ni geométrica afilada: eso rompería con la maleta.
- **Color del nombre, adaptable al tema:** en el tema oscuro el nombre va en **blanco**, en el tema claro va en **negro**, para las dos palabras por igual. (La muestra bordada en azul marino con borde dorado queda solo para marketing/impresos, no para la app.)
- **Logo sin parches en la pantalla de inicio:** en la pantalla de inicio de la app los parches no se distinguen a ese tamaño, así que ahí se usa solo la maleta azul **sin parches y sin ningún objeto** (`icon/hype-maleta-sin-parches.png`). La maleta con parches se usa en grande: pantalla de carga, Perfil y marketing.
- **UI y textos (titulares y cuerpo): Montserrat** — moderna, legible en móvil. Títulos en Montserrat Bold, cuerpo en Montserrat Regular.
- **Código, tickets y dinero: Montserrat** — para códigos Hype Ticket (ej. `HYPE-CEQBU7`), montos del Wallet (`$14,500 MXN`), fechas y horas. En el editor / Teamwork el código fuente usa JetBrains Mono.
- **Escala:** título 22 Bold, subtítulo 16, cuerpo 14, secundario 12, 13 para códigos y montos.
- **Letras del logo:** no se recrean con tipografía; el logo siempre es la imagen de la maleta o la H dorada.

## 4. Los parches en el logo (la sección de flujo en la app fue quitada)

> Actualización 2026-11-08: Pedro pidió quitar la sección "La maleta es el flujo" de la app. Los parches siguen en el logo de la maleta, pero ya no hay un riel de parches en el Feed ni "Explorar por parche" en Explorar. Las categorías se muestran de forma normal, sin el parche como filtro. La tabla de abajo queda solo como referencia de qué representa cada parche, no como flujo de la app.

| Parche | Función en la app | Flujo |
|---|---|---|
| La Quebrada (clavadista) | Experiencias / Tours | Descubrir → reservar tour → Hype Ticket con código |
| Pirámide maya | Cultura / Tours históricos | Descubrir → reservar → ticket |
| Ángel de la Independencia | Perfil VIP / Hype Black | Perfil → puntos, beneficios, identidad VIP |
| Who's Crazy? | Vida nocturna / Clubes | Reservar mesa o entrada → escaneo de ticket en puerta → pedido en mesa |
| ONE BY PRO | Deportes / Actividades pro | Reservar actividad (jetski, buceo, paracaídas) → ticket |

- En Explorar, las categorías se muestran con su parche como icono. Si una categoría no tiene proveedores activos, se oculta (catálogo dinámico, spec §5).
- El Concierge (Aura) recomienda usando estos mismos parches: siempre con servicios reales del catálogo, nunca inventados.

## 5. Imagen y foto

- Fotos hero reales de Acapulco (La Quebrada, Caleta, bahía de noche), nunca fotos de stock genéricas.
- Estilo 3D suave y redondeado, como la maleta: sombras suaves, esquinas redondeadas, sin bordes duros.
- Los parches se pueden usar sueltos como stickers en redes (Instagram / Facebook) para el marketing.

## 6. Qué cambia respecto al spec anterior

- spec.md §6 (diseño) se mantiene, pero ahora remite a este archivo: el fondo negro y dorado de la imagen 0 se concreta en la paleta Super AMOLED (negro puro #000000) + azul maleta + dorado, y la tipografía es Montserrat para todo el texto.
- El logo de la app es la maleta con parches, no la H sola. La H queda como secundaria.
