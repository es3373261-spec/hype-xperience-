# Hype Xperience

App que gestiona y conecta todos los servicios turísticos de Acapulco en un solo lugar: alojamiento, experiencias, servicios, restaurantes, eventos y taxi. Lanzamiento: diciembre de 2026.

> BORRADOR v3 (2026-11-19) — basado en el Documento Maestro de Arquitectura y Especificaciones v2.0 enviado por Pedro el 2026-11-19. Sustituye al Borrador v1 que estaba en main y al borrador v3 del 2026-11-18 basado en el modelo de roles anterior.

## El plano

Toda la app se construye siguiendo `spec.md` al pie de la letra (SDD / TDD / ODD). No se inventan funcionalidades fuera del alcance. Si algo del spec es ambiguo, se pregunta a Pedro antes de programarlo.

## Stack

- Móvil: Expo + React Native + TypeScript — `app/`
- Backend: Firebase — Auth, Firestore, Storage, Functions, App Check — `functions/`
- Admin web: `admin/`
- Diseño: sistema "Hype Night" actualizado por el Documento Maestro (§4 del spec): fondo oscuro #0B0B0E, tarjetas translúcidas con blur, rojo #E62E3D, coral #F23847 en claro, maleta roja como logo, wordmark HYPE ExtraBold + XPERIENCE Light (tracking 0.15em), Montserrat para todo el texto. Barra de Aura en forma de píldora con orbe rojo, debajo de la barra de navegación.

## El modelo (2026-11-19, Pedro)

Modelo Airbnb fusionado con flujo tipo Uber: una sola cuenta que cambia entre **Explorador** (B2C, vista por defecto) y **Aliado** (B2B: proveedores, anfitriones y conductores, con onboarding dinámico por vertical y editor total 24/7). **Concierge** es un tercer modo oculto en la UI general, solo con permisos explícitos en base de datos: recibe los borradores de Aura, valida disponibilidad, ensambla Xperiences multi-servicio y libera links de pago consolidados.

Cuatro verticales de Aliados: Venues y Gastronomía, Experiencias y Tours, Alojamiento, Transporte (Hype Go 1.0x, Hype Confort 1.25x BYD eléctrico, Hype by Pro 1.5x+ solo Concierge/VIP).

## Lo que resuelve

Desconfianza en los pagos: hay prestadores a los que les cancelaron la transferencia después de dar el servicio. Por eso el pago es **prepago con Wallet de créditos de circuito cerrado** (1 crédito = $1 MXN, recarga vía Stripe; pago directo con tarjeta, 100% Wallet o mixto; saldo no retirable ni transferible). La dispersión a Aliados es híbrida: SPEI manual a CLABE o Stripe Connect.

Comisiones: reservas directas 5% los primeros 30 días desde `ally_activated_at`, 10% desde el día 31; paquetes curados por Concierge 15% plataforma / 85% aliados. Transporte con tarifa por fórmula: máx(mín $90–$100, [35 + 12/km + 2/min]) × multiplicador de tier, redondeado a $5.

Aura (Gemini 2.5 Flash, salidas estructuradas) recomienda solo servicios reales del catálogo activo con precios exactos, califica con máximo 2–3 preguntas (fechas, personas, alergias obligatorias) y manda el borrador a la bandeja de Concierge con el 15% calculado.

## Estado

Spec Borrador v3 (2026-11-19) / demo reestructurada `hype-xperience-v2` v5 en vivo, verificada end-to-end 2026-11-19 (ver `spec.md` §16). Tareas T-01 a T-10 aprobadas en main; T-11 completada en la rama local `feat/hype-control` (commit 5aa92769, solo en la máquina de Pedro), pendiente de fusionar — ver `t-11-merge-checklist.md`, paso 0: subir este spec v3 a main antes de fusionar (no el v2). Tarea siguiente: T-12, pantallas UI reales sobre los servicios ya hechos, con la demo `hype-xperience-v2` como referencia visual (no copiar su código).

Piloto cerrado: solo Mariscos Rulo's y One By Pro son proveedores reales confirmados; el resto del catálogo de la demo son ejemplos por confirmar.

Preguntas abiertas (no programar hasta resolverlas): ver `spec.md` §15 — piso exacto de tarifa mínima ($90–$100), redondeo de la comisión Concierge, reparto del 85% entre aliados de un paquete, privacidad del chat de viaje, clasificación de Palao Island Club y precios reales de los proveedores piloto.
