# Hype Xperience

App que gestiona y conecta todos los servicios turísticos de Acapulco en un solo lugar: alojamiento, experiencias, servicios, restaurantes, eventos y taxi. Lanzamiento: diciembre de 2026.

> BORRADOR v5 (2026-11-25) — basado en el Documento Maestro de Arquitectura y Especificaciones v2.0 enviado por Pedro el 2026-11-19. Sustituye al Borrador v4 (2026-11-25, local, nunca subido a GitHub: el v5 lo sustituye y es el que se sube a main; el último commit en main sigue siendo c0c18dc4 del v3).

## El plano

Toda la app se construye siguiendo `spec.md` al pie de la letra (SDD / TDD / ODD). No se inventan funcionalidades fuera del alcance. Si algo del spec es ambiguo, se pregunta a Pedro antes de programarlo.

## Stack

- Móvil: Expo + React Native + TypeScript — `app/`
- Backend: Firebase — Auth, Firestore, Storage, Functions, App Check — `functions/`
- Admin web: `admin/`
- Diseño: sistema "Hype Night" actualizado por el Documento Maestro (§4 del spec) y por Pedro el 2026-11-25: fondo oscuro #0B0B0E, tarjetas translúcidas con blur, gris #8E8E93 (oscuro) / #6E6E73 (claro) como acento de marca (antes rojo #E62E3D), maleta gris plana y estática como logo, splash de 1.8 s, wordmark HYPE ExtraBold + XPERIENCE Light (tracking 0.15em), Montserrat para todo el texto. Barra de Aura en forma de píldora con orbe gris, debajo de la barra de navegación.

## El modelo (2026-11-19, Pedro)

Modelo Airbnb fusionado con flujo tipo Uber: una sola cuenta que cambia entre **Explorador** (B2C, vista por defecto) y **Aliado** (B2B: proveedores, anfitriones y conductores, con onboarding dinámico por vertical que arranca con un cuestionario de primera entrada que identifica el rol — Restaurante, Bar/Club, Alojamiento, Experiencias y Tours, Transporte — y abre solo las herramientas de ese rol, más editor total 24/7). **Concierge** es un tercer modo oculto en la UI general, solo con permisos explícitos en base de datos: recibe los borradores de Aura, valida disponibilidad, ensambla Xperiences multi-servicio y libera links de pago consolidados.

Cuatro verticales de Aliados: Venues y Gastronomía, Experiencias y Tours, Alojamiento, Transporte (Hype Go 1.0x, Hype Confort 1.25x BYD eléctrico, Hype by Pro 1.5x+ solo Concierge/VIP).

El cuestionario de primera entrada identifica el rol de aliado (Restaurante, Bar/Club, Alojamiento, Experiencias y Tours, Transporte) y abre solo sus herramientas: el restaurante lleva carta digital con IVA, alergias a cocina, Bar 360, mesas y turnos; el bar/club, mesa con botellas o solo entrada; el alojamiento, calendario por noche y tarifas dinámicas; las experiencias y tours, muelles, bloques de horario y cupo; el transporte, 4 fotos de verificación y tarifa por fórmula. Comunes a todos: perfil con logo y hasta 4 portadas, editor 24/7, Staff solo QR, reseñas con réplica pública y dispersión por SPEI o Stripe Connect. La cuenta administradora One Xperience lleva el registro de cuentas, el catálogo, el Resumen del día, la bandeja de Concierge, el despacho de transporte y la curaduría de Experiencias y Tours (Xperience lo controla Hype). Operación de venue (v11): Cocina con tickets y alergias, plano de mesas, dividir la cuenta, llamar al mesero, QR por mesa, avisos y analítica del aliado, carta en inglés y despacho en vivo del admin. Ver `spec.md` §19.

## Lo que resuelve

Desconfianza en los pagos: hay prestadores a los que les cancelaron la transferencia después de dar el servicio. Por eso el pago es **prepago con Wallet de créditos de circuito cerrado** (1 crédito = $1 MXN, recarga vía Stripe; pago directo con tarjeta, 100% Wallet o mixto; saldo no retirable ni transferible). La dispersión a Aliados es híbrida: SPEI manual a CLABE o Stripe Connect.

Comisiones: reservas directas 5% los primeros 30 días desde `ally_activated_at`, 10% desde el día 31; paquetes curados por Concierge 15% plataforma / 85% aliados. Transporte con tarifa por fórmula: máx(mín $90–$100, [35 + 12/km + 2/min]) × multiplicador de tier, redondeado a $5.

Aura (Gemini 2.5 Flash, salidas estructuradas) recomienda solo servicios reales del catálogo activo con precios exactos, califica con máximo 2–3 preguntas (fechas, personas, alergias obligatorias) y manda el borrador a la bandeja de Concierge con el 15% calculado.

## Estado

Spec Borrador v5 (2026-11-25) / demo reestructurada `hype-xperience-v2` v11 en reconstrucción, verificada end-to-end 2026-11-19 y actualizada 2026-11-25 (ver `spec.md` §16). Tareas T-01 a T-10 aprobadas en main; T-11 completada en la rama local `feat/hype-control` (commit 5aa92769, solo en la máquina de Pedro) — **fusión BLOQUEADA**: Pedro no tiene acceso a esa computadora por un buen rato; solo se desbloquea con `git push origin feat/hype-control` desde esa máquina — ver `t-11-merge-checklist.md`. Tarea siguiente: T-12, pantallas UI reales sobre los servicios ya hechos, con la demo `hype-xperience-v2` como referencia visual (no copiar su código).

Piloto cerrado: solo Mariscos Rulo's y One By Pro son proveedores reales confirmados; el resto del catálogo de la demo son ejemplos por confirmar.

Preguntas abiertas (no programar hasta resolverlas): ver `spec.md` §15 — piso exacto de tarifa mínima ($90–$100), redondeo de la comisión Concierge, reparto del 85% entre aliados de un paquete, privacidad del chat de viaje, clasificación de Palao Island Club y precios reales de los proveedores piloto. Contraste del gris #8E8E93 (3.26:1, no pasa 4.5:1; fix pendiente de confirmación: botones con texto blanco en oscuro a #6E6E73). Tope de video por platillo (8 MB; un video normal de teléfono lo supera). Por confirmar visualmente en el teléfono de Pedro: la prueba de la v11 (ticket en Cocina, QR de mesa, dividir cuenta, llamar al mesero, carta en inglés, avisos y analítica, despacho en vivo), selector de alergias y selector de archivos (cámara/galería) al subir fotos de platillos.
