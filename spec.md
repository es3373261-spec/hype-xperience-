# Hype Xperience — Spec SDD / TDD / ODD
## Para Antigravity CLI / Teamwork

- **Fecha:** 2026-11-07 / 2026-11-08 / 2026-11-09 / 2026-11-13 / 2026-11-15 / 2026-11-18 / 2026-11-19
- **Estado:** Borrador v3 (2026-11-19) para revisión de Pedro. No es código, es el plano. **Sustituye al Borrador v2** (archivado en `spec-borrador-v2-archivo.md`) y al borrador v3 del 2026-11-18 basado en el modelo de roles anterior (renombrado a `spec-borrador-v3-superseded.md`).
- **Fuente:** Documento Maestro de Arquitectura y Especificaciones v2.0 (2026-11-19, `workspace/user/files/Documento_Maestro_-_Hype_Xperience_0_v7wj.pdf`), enviado por Pedro con la orden de analizarlo, aplicarlo a la demo y mandar el spec. Referencia visual y de comportamiento: demo reestructurada `hype-xperience-v2` (verificada end-to-end 2026-11-19, ver §15). Análisis de brechas: `documento-maestro-analisis.md`.
- **Regla de oro para Antigravity:** seguir este spec al pie de la letra. No inventar funcionalidades fuera del alcance. Si algo del spec es ambiguo, preguntar a Pedro antes de programarlo.

## 1. Objetivo

App que gestiona y conecta todos los servicios turísticos de Acapulco en un solo lugar, en modo moderno, para lanzar en diciembre de 2026, la temporada más fuerte del año.

Problema principal que ataca: desconfianza en los pagos. Hay prestadores que brindaron el servicio y luego les cancelaron la transferencia. Por eso el pago es prepago con Wallet, no promesa de pago después. Y problema del mercado que ataca el nuevo modelo: en Acapulco aparentemente no se puede ofrecer servicios como anfitrión, así que habilitar anfitriones que publiquen alojamiento, experiencias y servicios es donde está el mercado (decidido por Pedro 2026-11-19, modelo Airbnb fusionado con flujo tipo Uber).

## 2. Alcance

### MVP — diciembre 2026
- Tres modos en un solo ecosistema (ver §3): Explorador (B2C, vista por defecto), Aliado (B2B: proveedores, anfitriones y conductores) y Concierge (curaduría y ensamblaje, oculto salvo permiso explícito).
- Una sola cuenta que cambia entre Explorador y Aliado con un interruptor; Concierge es un permiso, no un registro.
- Aliado: registro con onboarding dinámico por vertical (§5), editor total 24/7 "Editar Perfil y Oferta", gestión de calendario, creación de sub-cuentas Staff solo QR.
- Explorador: descubrir, Aura para diseñar experiencias a medida, reservar servicios individuales o paquetes curados, pedir taxi con tarifa por fórmula, Hype Ticket con QR, Wallet de créditos, recibos digitales (ver F9).
- Venue: carta digital con foto por platillo, precios con IVA, selector obligatorio de alergias enviado a cocina, Bar 360 condicional, gestión de mesas y turnos, cierre de cuenta en sitio.
- Club: reserva de mesa con botellas, mesa sin botella o solo entrada; staff con permiso limitado para escanear boletos y hostess; pedido de bebidas en mesa desde la carta precargada.
- Taxista individual (sin flota): registro con 4 fotos de verificación, recibir viajes, aceptar, seguimiento por WhatsApp y chat en la app, bolsa de comisiones prepagada.
- Wallet de créditos de circuito cerrado + pagos híbridos (§7): recarga vía Stripe, pago directo con tarjeta / 100% Wallet / mixto; dispersión a aliados por SPEI manual o Stripe Connect.
- Wallet siempre cargado — Fase 1 (lanzamiento): recarga automática con mínimo y tope mensual elegidos por el turista, alertas de saldo bajo y sugerencia de precarga del Concierge antes del viaje. (F8, T-13; decidido 2026-11-13.)
- Mapa y calendario unificados en Explorar (decidido 2026-11-15): el mapa de lugares y el calendario son una sola sección, Explorar.
- Perfil arriba a la derecha, con avatar y modo, abre tarjeta flotante. Bienvenida separada del logo: al iniciar, el explorador ve "Bienvenido a la Saga del Sol" con su nombre. Barra inferior en una sola pila fija anclada al fondo: primero la barra de navegación (Feed, Explorar, Tickets, Taxi y Wallet) y directamente debajo la caja de texto de Aura, para iniciar la conversación con Aura desde ahí (regla de colocación de Pedro, 2026-11-19). Tema oscuro / claro editable en Perfil.
- Catálogo dinámico: una categoría sin proveedor activo no se muestra. Un anuncio sin disponibilidad no se publica (puerta de publicación verificada 2026-11-19).
- Panel de Concierge (Pedro + curadores autorizados): inventario en tiempo real de todos los Aliados, bandeja de borradores de Aura, validación de disponibilidad, ensamblaje de Xperiences multi-servicio, links de pago consolidados, Resumen del día.
- Experiencias Xperience armadas por Concierge: paquetes con alojamiento, transporte, comida y actividades; al reservarse, cada negocio aliado recibe su sub-reserva directa en su panel.
- Alergias del explorador visibles para el restaurante en reservas y pedidos; pre-pedido de comida junto con la reserva de mesa, para que esté listo al llegar.
- Reseñas verificadas (§11): solo reservas completadas, 1.0–5.0 estrellas, doble evaluación en transporte, réplica pública del aliado.

### Fase 2 — después del lanzamiento
- Pedido en mesa completo con cocina / barra, analytics VIP, bodega, telemetría de chóferes.
- Split the Hype completo entre 4 personas.
- Wallet siempre cargado — Fase 2 (T-13b, después del lanzamiento): recarga en OXXO con código y carga por SPEI/CoDi. Fase 3 (T-13c, 2027): recarga de tag de peaje y pago de gasolina con QR.

### Fuera de alcance por ahora
- Pagos con tarjeta directa sin Wallet como método principal (el pago directo con tarjeta existe solo como opción dentro del pago híbrido, ver §7).
- Conexión real con Meta API / OAuth. En la demo es solo demo. En producción es trabajo aparte, con app de Negocios en Meta Developers.
- Publicación en tiendas hasta pasar el piloto cerrado.

## 3. Modos y roles

Tres modos operativos dentro de un mismo ecosistema. Una cuenta cambia entre Explorador y Aliado; Concierge se renderiza únicamente mediante permisos explícitos en base de datos (campo `concierge_access`), nunca como opción de registro.

| Modo | Usuario | Ve | Puede hacer | No puede hacer |
|---|---|---|---|---|
| Explorador (B2C, por defecto) | Cliente final, turista o local | Feed, Explorar (mapa + calendario unificados), Aura, Tickets, Wallet, Recibos digitales | Registrarse, buscar, reservar, pagar (tarjeta / Wallet / mixto), pedir taxi con tarifa por fórmula, ver sus reservas y eventos, calificar servicios completados | Ver paneles de Aliado o Concierge, ver finanzas de otros, ver cuentas registradas |
| Aliado (B2B) | Dueños de negocios, prestadores de servicios turísticos, anfitriones de alojamiento y conductores | Su panel (Hoy, Calendario, Anuncios, Mensajes, Menú), "Editar Perfil y Oferta" 24/7, sus reservas y sub-reservas, sus reseñas, su dispersión | Auto-registrarse y publicar (onboarding por vertical, §5), editar precios, menús, horarios, reglas y fotos en todo momento, gestionar calendario, crear sub-cuentas Staff solo QR, responder públicamente reseñas | Ver reservas de otros aliados, ver el precio total de un paquete ni a los otros negocios de un paquete, ver la bandeja de Concierge |
| Concierge (curaduría, oculto) | Super Admin (One Xperience, Pedro) y curadores autorizados | Inventario en tiempo real de todos los Aliados, bandeja de borradores de Aura, todas las reservas y pendientes, Resumen del día | Validar disponibilidad, ensamblar Xperiences multi-servicio, liberar links de pago consolidados, activar aliados (fija `ally_activated_at`), gestionar cuentas, aprobar/rechazar acciones pendientes | — |

- **Cuenta administradora:** One Xperience (correo es3373261@gmail.com; la contraseña la define Pedro y no se registra en este spec). La cuenta anterior de mando (pedro@hypexperience.demo) queda como legado, no se borra. **Pedro es el operador Xperience (Hype): él arma y vende las experiencias completas.**
- **Guía de turistas (asignado por Concierge):** ve solo sus tours asignados con clientes, horario y punto de encuentro; no ve otros tours, finanzas ni precios del paquete. Su cuenta la crea Pedro/Hype, sin auto-registro.
- **Staff (creado por el dueño del aliado):** acceso exclusivo al escáner QR en puerta, muelle o recepción; sin acceso a finanzas ni edición. Solo puede validar tickets de su propio aliado.
- **Cambio de modo:** el interruptor Explorador/Aliado está en el Perfil. Cambiar de modo muestra la pantalla de carga con la maleta roja (8 s la primera vez, 900 ms en cambios de modo). Un correo es una sola cuenta con dos modos.
- **Registro minimalista (2026-11-19, Pedro):** registro único con nombre, email, teléfono y casilla obligatoria de términos; sin verificación de correo (eliminada 2026-11-19 por orden de Pedro); la cuenta queda activa al instante. Sin emojis como iconos en toda la app (iconos de línea).

## 4. Diseño — tokens del Documento Maestro

- **Marca:** HYPE (ExtraBold) + XPERIENCE (Light/Regular, letter-spacing: 0.15em). Isotipo: maleta rígida roja 3D (#E62E3D) sobre fondo limpio. La maleta roja es la única imagen de maleta en toda la app (carga, acceso, registro, encabezado, Perfil, error).
- **Dark Mode (nocturno, por defecto):** fondo negro profundo #0B0B0E; tarjetas translúcidas rgba(28, 28, 34, 0.75) con backdrop-filter blur(16px); bordes sutiles en rojo oscuro rgba(230, 46, 61, 0.25).
- **Light Mode (diurno / playa):** fondo blanco perlado translúcido rgba(248, 248, 250, 0.85), sombras suaves, acentos coral/carmesí #F23847.
- **Componente firma (Barra de Aura):** contenedor tipo píldora (border-radius: 999px) con el orbe fluido rojo a la izquierda ("Crea tu Xperience con Aura...") y el botón circular brillante de envío a la derecha. Diseño exacto de las fotos de Pedro (`workspace/user/files/10625_75_kylq.jpg` oscuro, `10624_76_l6q8.jpg` claro). Colocación: va DEBAJO de la barra de navegación, al fondo de la pantalla, en todas las pantallas principales (Feed/Explorar y donde aparezca); el orden inferior es contenido, barra de navegación, caja de texto de Aura (regla de Pedro, 2026-11-19; verificada en demo v2, viewport móvil 390×844, sin solapamiento ni desbordamiento).
- **Tipografía:** Montserrat para todo el texto de la app (en el editor, JetBrains Mono solo para código fuente).
- **Botón principal:** rojo #E62E3D (en la demo v2 verificada se usa #E62E3D como rojo maleta; el #cf2d2b anterior queda sustituido). Texto centrado y simétrico en todos los botones.
- **Splash:** video de la maleta roja girando de Pedro (8 s en la primera carga, un giro completo; 900 ms en cambios de modo), solo la maleta, fondo negro puro, sin barra ni letras.
- **Liquid Glass:** superficies (tarjetas, paneles, barras flotantes, modales, hojas "?", selector de fecha) en vidrio esmerilado en ambos temas. Hojas de ayuda "?" totalmente opacas, con separación visual total del contenido de detrás.
- **Pantallas de acceso minimalistas y responsivas:** jerarquía clara, una acción principal por pantalla, tarjeta centrada con ancho máximo, sin desbordamiento horizontal ni elementos cortados en celular chico, tableta y computadora.
- **Calendario simplificado (Feed):** sin botones de Mes y Semana; botones circulares con flechas; en semana solo se muestra el día y el mes; en mes, solo el mes actual; sin leyenda de "vista compartida". Reservas en dorado, eventos en azul.

## 5. Verticales de Aliados y onboarding

El onboarding despliega formularios condicionales según la vertical elegida y habilita el módulo permanente de **"Editar Perfil y Oferta"** disponible en todo momento (precios, menús, horarios, reglas, fotos). La activación por un admin de Hype fija `ally_activated_at` y arranca la ventana promocional de 30 días al 5% (§7). **Puerta de publicación (verificada 2026-11-19):** ningún anuncio se publica sin al menos una fecha con precio en su calendario; una experiencia además necesita al menos un momento en su itinerario ("Lo que harás"). Si falta algo, el anuncio queda "En progreso" y la respuesta indica lo que falta.

| Vertical (`ally_category`) | Subcategorías (`ally_subcategory`) | Reglas y módulos específicos |
|---|---|---|
| 1. Venues y Gastronomía (Comida y Vida Nocturna) | Restaurante, Catering / Chef, Privado, Antro / Club Nocturno, Bar / Lounge, Beach Club | Carta Digital y Pedido Anticipado: platillos con fotos individuales, precios con IVA incluido y selector obligatorio de alergias / restricciones (mariscos, nueces, gluten, etc.) enviado directo a cocina. Bar 360 (condicional): menú digital de botellas con imagen; se oculta por completo en el flujo de reserva si el consumo de botella no es obligatorio. Gestión de Mesas y Turnos: control de aforo por horarios. |
| 2. Experiencias y Tours (Actividades Acuáticas, Náuticas y Tierra) | Paseos Turísticos Bahía (barcos fondo de cristal La Roqueta, yates recreativos, salidas Parque de la Reina / Malecón, Bonanza / Aca Rey), Acuáticas Motorizadas (Jet Ski, Paracaídas, Banana, Esquí), Náuticas Privadas (Yates, Lanchas, Pesca deportiva), Deportes (Surf, Paddleboard, Buceo / Snorkel), Tierra y Playa (ATV / Cuatrimotos, renta de sombrillas / toldos / camastros) | Gestor de Salidas y Muelles: horarios fijos de muelle o playa y cupo por turno. Bloques de Tiempo: renta por turnos (30 min, 1 hr) o por día completo. Checklist Operativo: requisitos, nivel de actividad, qué traer, qué incluye / no incluye. |
| 3. Alojamiento (Estancias) | Departamento / Condo, Villa, Casa de lujo, Hotel Boutique / Habitación | Calendario de Noches: tarifas dinámicas por noche, horarios de check-in/out y políticas de cancelación. Amenidades y Accesibilidad: idiomas del Aliado, equipamiento y nivel de acceso. |
| 4. Transporte y Movilidad (Traslados) | Hype Go (1.0x): taxi local azul/blanco tradicional verificado. Hype Confort (1.25x): taxi BYD eléctrico rotulado o sedán reciente con A/C al 100%. Hype by Pro (1.5x+): SUV, Van (Suburban/Sprinter) o sedán ejecutivo sin rotular, uso exclusivo en Modo Concierge y traslados VIP. | Validación por Estado Real: registro de conductor + 4 fotos obligatorias (exterior, asientos, tablero/A/C y tarjetón/licencia), sin discriminar por año de fabricación en gama Go. |

- **Gestión multimedia (Cloud Storage):** Nivel 1 Avatar (foto de perfil o logotipo oficial, `avatar_url`); Nivel 2 Galería (carrusel principal de instalaciones, vistas, embarcaciones o las 4 fotos de verificación vehicular, `gallery_photos`); Nivel 3 Catálogo (fotografía individual por cada platillo del menú, botella en Bar 360, embarcación o habitación, `image_url`).

## 6. Flujos principales

### F1. Explorador reserva
1. Se registra (nombre, email, teléfono, términos; sin verificación de correo) o entra con una cuenta existente.
2. Explora Feed / Explorar, con filtros por categoría y vertical.
3. Abre un servicio, ve precio, reseñas verificadas, disponibilidad y "Lo que debes saber".
4. Reserva con desglose de precio (subtotal + IVA = total) y cancelación gratuita. Elige método de pago: tarjeta, 100% Wallet o mixto.
5. Si elige Wallet o mixto y no tiene saldo suficiente en la parte Wallet, el pago se rechaza con "Saldo insuficiente — agrega dinero en tu Wallet".
6. Paga antes del servicio. Recibe Hype Ticket con código y recibo digital.
7. Ve su reserva en Tickets y en el Calendario: dorado = tus reservas, azul = eventos próximos.

### F2. Wallet híbrida
1. El explorador recarga en Perfil > Wallet vía Stripe (1 crédito = $1 MXN): chips $500, $1,000, $2,000, $5,000 o monto libre. El saldo es de circuito cerrado: no retirable a efectivo ni transferible entre usuarios.
2. Al pagar, el método queda registrado en el movimiento (tarjeta / wallet / mixto) y en el libro mayor con saldos antes y después.
3. No se puede pagar dos veces la misma reserva.
4. El aliado ve su saldo pendiente de dispersión en su panel y cobra por SPEI manual (cortes periódicos a su CLABE) o Stripe Connect (dispersión automática), según su `payout_method`.

### F3. Venue: pedido, cierre de cuenta y comisión
1. El venue carga su carta con foto por platillo y precio con IVA.
2. El explorador reserva mesa con pedido anticipado; su selector de alergias (obligatorio, o "Sin alergias") llega directo a cocina.
3. En sitio, el explorador puede agregar consumos extras en mesa.
4. Al cerrar la cuenta, la comisión se recalcula sobre el **ticket final** (pedido anticipado + extras), excluyendo las propinas, que van íntegras (100%) al personal del aliado.
5. Staff escanea el Hype Ticket en puerta. Ticket válido = "Acceso autorizado". Ticket ya usado = rechazado. Staff no ve pagos ni finanzas.

### F4. Taxi con tarifa por fórmula
1. El explorador pide taxi con origen y destino (ruta) y tier (Go / Confort / by Pro; by Pro solo Concierge y VIP).
2. La app muestra la cotización congelada por adelantado con su desglose (base + km + minutos, multiplicador de tier, redondeo a $5) antes de confirmar.
3. El conductor registrado en línea más cercano recibe el viaje y lo acepta. Regla cruzada: si se pide servicio privado y el amarillo vacío más cercano está más cerca que el azul más cercano, el amarillo es notificado y puede aceptar el viaje privado.
4. Seguimiento del viaje: chat propio de Hype entre explorador y conductor (botón "Chatear", respuestas rápidas); solo los dos participantes ven el hilo, ni siquiera Hype. Como alternativa, seguimiento por WhatsApp con enlace y mensaje listo; el mensaje lleva solo el ID del viaje, el estado y la ETA (origen y destino no van en el texto).
5. El viaje se paga según su método: Wallet/tarjeta reparte la comisión vigente al cerrar; en efectivo, la comisión se descuenta de la bolsa prepagada del conductor (§7).
6. **Sin choferes predeterminados:** el mapa no muestra taxis hasta que un conductor registrado comparte su ubicación en tiempo real. Las 6 rutas (Zapata, Vacacional, Rena, Coloso, Colosio, Costera) se ven trazadas con sus líneas en el mapa.

### F5. Aura y Concierge
1. El explorador escribe en la barra de Aura.
2. Aura consulta el catálogo activo. Si la petición es abierta, hace máximo 2–3 preguntas breves en un solo mensaje (fechas y duración, personas, alergias obligatorias si hay comida o actividad física).
3. Aura recomienda solo servicios reales del catálogo activo con precios exactos; nunca inventa. Si falta algún servicio solicitado, lo dice con transparencia y sugiere la mejor alternativa real. Si no hay nada, lo dice y escala a humano.
4. Aura arma el borrador: suma los precios netos de los aliados y calcula exactamente el 15% adicional de gestión Concierge. El borrador se muestra marcado como "sujeto a verificación del Concierge".
5. Al confirmarlo, el borrador entra a la bandeja de Concierge (`concierge_requests`, estado `draft_from_aura`).
6. El Concierge lo toma a revisión (`under_review`), valida la disponibilidad de cada servicio, lo aprueba y libera el link de pago consolidado (`approved_payment_sent`).
7. El explorador paga el link (Wallet o tarjeta); cada aliado recibe su precio neto, Hype el 15% de gestión, y se crea una reserva aceptada por servicio (`paid`).
8. **Concierge con visto bueno de Pedro:** ninguna acción que comprometa reserva, precio o disponibilidad se ejecuta sin el visto bueno del Concierge (estado pendiente de verificación).

### F6. Paquete Xperience y sub-reservas
1. El Concierge arma una Xperience: elige alojamiento, transporte, comida y actividades día por día.
2. La publica como un solo producto reservable, con precio total real (suma de los servicios reales).
3. El explorador reserva el paquete y paga una sola vez por adelantado (Wallet, tarjeta o mixto).
4. Al pagarse, la app genera una **sub-reserva por cada aliado** del paquete, que cae en el panel de ese aliado con fecha, hora, número de personas, servicio y punto de encuentro. Las sub-reservas llegan **directas, sin que el aliado tenga que confirmarlas** (decidido 2026-11-13): si un aliado tiene un conflicto, lo avisa a Pedro/Hype y se reasigna, pero la reserva ya pagada no queda esperando confirmación.
5. Cada aliado ve solo su sub-reserva, no el precio total del paquete ni a los otros negocios.
6. El Concierge asigna al guía del paquete (o por día); el guía ve su tour, sus clientes, horario y punto de encuentro.
7. **Cancelación en cascada (corregido 2026-11-19):** al cancelar un paquete antes de ser aceptado, sus sub-reservas se cancelan también y se reembolsa el 100% al Wallet del explorador.
8. **Guardia de auto-reserva (corregido 2026-11-19):** un aliado no puede reservar su propio anuncio ni su propio paquete.

### F7. Alergias y pre-pedido en restaurante
1. El explorador registra sus **alergias** en su Perfil (por ejemplo, mariscos, gluten, nueces).
2. Al reservar mesa o pedir, las alergias se muestran al restaurante en la reserva y en el pedido, para que la cocina las tenga en cuenta. El selector de alergias es obligatorio en venues (o "Sin alergias").
3. Con la reserva de mesa, el explorador puede **pre-ordenar su comida**: elige los platillos del menú al reservar y paga por adelantado.
4. El restaurante recibe el pre-pedido junto con la reserva y lo va preparando, para que esté listo cuando el explorador llegue.
5. Al llegar, el explorador solo confirma; no vuelve a pedir desde cero.

### F8. Wallet siempre cargado — Fase 1, lanzamiento diciembre 2026 (2026-11-13)

Contexto: Ley de Economía Digital para Pagos Digitales y Electrónicos (DOF 4 nov 2026, en vigor 5 nov 2026). Art. 10: los tres órdenes de gobierno deben aceptar pagos digitales en trámites y servicios. Art. 13: la SHCP define en 15 días hábiles los sectores donde lo digital será el único medio; gasolineras y casetas van primero. **Regla de Pedro: en Hype se ofrece, nunca se impone** — todo es opt-in; el Wallet es una opción para que el turista siempre traiga saldo, no una obligación.

1. **F8.1 Recarga automática:** el explorador elige un saldo mínimo y un monto de recarga; cuando el saldo baja del mínimo, el Wallet recarga solo con la tarjeta guardada en Stripe. Tope mensual elegido por el explorador; sin tope no hay recarga automática. Se puede apagar en un toque.
2. **F8.2 Alertas de saldo bajo:** aviso cuando el saldo no alcanza la próxima reserva del itinerario, con recarga en un toque.
3. **F8.3 Recarga antes del viaje:** al armar un itinerario, Aura sugiere cuánto cargar según el total de reservas y traslados previstos. Solo sugiere; el explorador decide el monto.

**Fase 2 (T-13b, después del lanzamiento):** recarga en efectivo en OXXO con código (vigencia y monto exacto; si vence, se genera otro) y carga por SPEI o CoDi. El saldo se acredita solo cuando el pago se confirma; antes queda "pendiente", nunca disponible.
**Fase 3 (T-13c, 2027):** recarga del tag de peaje (TeleVía / IAVE / PASE) desde el Wallet y pago de gasolina con QR con saldo ya cargado. La tarjeta virtual del Wallet queda como futuro, fuera de T-13.

### F9. Recibo digital (2026-11-15)
1. Cada pago genera un recibo digital con los datos exactos de la compra: comercio, artículos con precio, subtotal, total con IVA, efectivo, cambio e IVA desglosado.
2. El recibo se ve como un ticket de compra real (ticket térmico, con código de barras).
3. Se abre desde la Wallet (historial de movimientos) y desde Tickets, en una sección nueva "Recibos".
4. Un recibo marcado como ejemplo/demo lleva la leyenda "EJEMPLO · DEMO" y "No es un comprobante fiscal".

### F10. Reseñas verificadas (ver §11)
1. Solo un explorador cuyo código QR fue escaneado o cuyo servicio figura como completado puede calificar (1.0 a 5.0 estrellas + comentario + fotos).
2. En transporte hay doble evaluación: el explorador califica al conductor/unidad y el conductor califica al pasajero.
3. En paquetes Concierge se califica la experiencia global y cada servicio individual.
4. Los aliados pueden responder públicamente a las reseñas desde su panel.

### F11. Staff y escáner QR
1. El dueño del aliado crea sub-cuentas Staff (Puerta, Muelle o Recepción) desde su panel.
2. El Staff entra solo al escáner QR y solo puede validar tickets de su propio aliado.
3. El Staff no ve finanzas, no edita nada y no crea cuentas.

## 7. Tarifas, comisiones y pagos híbridos

### A. Fórmula de cálculo de transporte (Maps API)

El precio se congela por adelantado (Upfront Pricing) combinando distancia, tiempo y categoría del vehículo:

**Tarifa Final = max(Tarifa Mínima, [Base + (Km × Tarifa Km) + (Min × Tarifa Min)]) × Multiplicador Tier**, redondeada a múltiplos de $5 MXN.

- **Parámetros base:** Base $35 MXN + $12 MXN/km + $2 MXN/min.
- **Piso mínimo garantizado:** $95 MXN (valor central del rango $90–$100 del Maestro, calibrado para trayectos cortos de referencia de ~3.5 km / 7–8 min; Pedro confirma el piso exacto, ver §14).
- **Multiplicadores:** 1.0x (Hype Go) | 1.25x (Hype Confort) | 1.5x+ (Hype by Pro).
- La cotización muestra el desglose (base + km + minutos, tier, redondeo) antes de confirmar. El colectivo amarillo ya no tiene pasaje fijo de $25: toda tarifa se calcula con esta fórmula.

### B. Reglas de comisiones

1. **Reservas directas (Explorador → Aliado, incluyendo taxis):**
   - **Mes 1 (primeros 30 días desde `ally_activated_at`): 5%** comisión plataforma / **95%** neto Aliado.
   - **Mes 2 en adelante (día 31+): 10%** comisión plataforma / **90%** neto Aliado.
   - La tasa se calcula por aliado según su antigüedad y se muestra en su panel con los días restantes de promoción.
2. **Paquetes curados (Aura → Concierge):**
   - **Comisión: 15%** de gestión Concierge calculada sobre el subtotal neto de los aliados, cobrada adicional al cliente. Los aliados reciben su precio neto íntegro. Ejemplo del Maestro: subtotal $2,900 + 15% ($435) = total $3,335.
   - El esquema anterior 90/10 fijo queda sustituido por este esquema. La pregunta abierta del 90/10 (base con IVA o sin IVA) queda cerrada: la base es el precio neto del aliado y, en venues, el ticket final cerrado sin propinas.
3. **Regla de ticket final en venues:**
   - En restaurantes, bares y antros, la comisión se calcula sobre el **subtotal final de la cuenta cerrada en sitio** (pedido anticipado + consumos extras agregados en mesa), excluyendo las propinas que van íntegras (100%) al personal del Aliado.
   - Al cerrar la cuenta, la comisión se recalcula sobre el ticket final y se registra el ajuste en el libro mayor.
4. **Reparto del 85% entre aliados de un paquete:** pendiente de definición de Pedro (ver §14). En la demo v2, cada aliado recibe su precio neto íntegro y Hype cobra el 15% adicional al cliente.

### C. Arquitectura financiera: Wallet Hype + dispersión híbrida (Stripe Connect / SPEI)

1. **Wallet Hype del Explorador (circuito cerrado):**
   - Los usuarios recargan saldo vía **Stripe** (1 crédito Hype = $1.00 MXN) para pagar servicios dentro de la app (pago directo con tarjeta, pago 100% con Wallet o pago mixto).
   - Para cumplir con la normativa de pagos digitales sin requerir licencia bancaria (IFPE), el saldo de la Wallet es **de consumo exclusivo dentro de Hype Xperience** (no retirable a efectivo ni transferible entre usuarios).
   - Cada movimiento queda en el libro mayor inmutable (`wallet_transactions`) con tipo, monto, saldos antes y después, referencia y método de pago.
2. **Wallet de comisiones para taxistas (pagos en efectivo):**
   - Cuando un pasajero paga un taxi en efectivo al chofer, el sistema descuenta automáticamente la comisión del **5% o 10%** (según antigüedad del conductor) de la bolsa prepagada del conductor (`driver_commission_pool`). Si su saldo baja del límite permitido (**-$30 MXN**), el botón *"En línea"* se pausa hasta que recargue saldo o complete viajes pagados con tarjeta/Wallet en la app.
3. **Modelo híbrido de dispersión a aliados (`payout_method`):**
   - **spei_manual (ideal para lanzamiento y prestadores locales):** el dinero se concentra en la cuenta de Stripe de Hype Xperience. El sistema genera cortes periódicos automáticos con el neto exacto (descontando comisiones y ajustes de ticket final) y se transfiere por **SPEI** a la CLABE de 18 dígitos del Aliado.
   - **stripe_connect (ideal para empresas formales y escalamiento):** el Aliado vincula su cuenta bancaria mediante KYC de Stripe Connect y el sistema dispersa su porcentaje de forma automática tras validar el QR o cerrar la cuenta.

## 8. Diagrama de flujo integral del sistema

```
[USUARIO INGRESA A HYPE XPERIENCE]
├──► [MODO EXPLORADOR (B2C)]
│    ├──► Recarga Wallet Hype (Stripe) o Paga Directo
│    ├──► Reserva Directa (Venue / Tour / Alojamiento / Transporte)
│    │    └──► Comisión: 5% (días 1–30) | 10% (día 31+)
│    │         • Venues: sobre Ticket Final cerrado (sin propinas)
│    │         • Taxis en efectivo: descuenta de Wallet Chofer
│    └──► Escribe en Barra de AURA (Gemini API)
│         ├──► Aura consulta Catálogo Activo en Firestore
│         ├──► Hace preguntas rápidas (fechas, pax, alergias)
│         ├──► Genera Borrador JSON + 15% Comisión Concierge
│         └──► Envía solicitud a [MODO CONCIERGE]
│              └──► Concierge valida disponibilidad y libera cobro
└──► [MODO ALIADO (B2B)]
     ├──► Onboarding Dinámico + Config. Pago (SPEI o Stripe Connect)
     ├──► Editor Total 24/7 (Precios, Menú/Alergias, Bar 360, Fotos)
     ├──► Jerarquía Staff: Dueño/Productor ──► Staff Puerta/Muelle (Solo QR)
     └──► Validación Admin ──► Registra ally_activated_at
▼
[DISPERSIÓN HÍBRIDA A ALIADOS]
• Corte SPEI Programado (CLABE) | • Split Automático (Stripe Connect)
```

## 9. Datos — modelo en Firestore

### Colección `config/pricing_rules`

```json
{
  "transport": {
    "base_fare": 35,
    "per_km": 12,
    "per_min": 2,
    "min_fare": 95,
    "round_to_nearest": 5,
    "multipliers": { "hype_go": 1.0, "hype_confort": 1.25, "hype_pro": 1.5 }
  },
  "commissions": {
    "ally_promo_days": 30,
    "ally_promo_rate": 0.05,
    "ally_standard_rate": 0.10,
    "transport_override_rate": null,
    "concierge_bundle_rate": 0.15,
    "driver_min_wallet_balance_mxn": -30
  }
}
```

### Colección `users/{uid}` (Explorador, Aliado y Wallet)

```json
{
  "display_name": "Sofía",
  "email": "sofia@ejemplo.com",
  "roles": ["explorer"],
  "mode": "viajero",
  "concierge_access": false,
  "allergies": ["nueces"],
  "wallet": {
    "balance_mxn": 1500.00,
    "currency": "MXN",
    "is_closed_loop": true,
    "stripe_customer_id": "cus_R9x82kLmN01",
    "updated_at": "2026-11-19T08:40:00Z"
  }
}
```

### Colección `allies/{allyId}` (perfil unificado, editable y pagos)

```json
{
  "owner_uid": "uid_del_dueno_o_productor",
  "status": "pending_review | active | suspended",
  "ally_activated_at": "2026-11-19T08:40:00Z",
  "ally_category": "venue | tour | accommodation | transport",
  "ally_subcategory": "restaurante | barco_turistico | jetski | departamento | hype_confort",
  "payout_config": {
    "payout_method": "spei_manual | stripe_connect",
    "spei_clabe": "012345678901234567",
    "spei_beneficiary_name": "Mariscos Rulos SA de CV",
    "stripe_connect_account_id": null,
    "pending_payout_balance_mxn": 4250.00,
    "driver_commission_pool_mxn": 250.00
  },
  "profile": {
    "business_name": "Mariscos Rulo's",
    "avatar_url": "https://storage.googleapis.com/.../logo_rulos.jpg",
    "description": "Restaurante bar en la playa, acceso CICI.",
    "location": { "lat": 16.84911, "lng": -99.85405, "address": "Playa, acceso CICI, Acapulco", "meeting_point": "Palapa principal frente al mar" },
    "languages": ["es", "en"],
    "gallery_photos": ["https://storage.googleapis.com/.../palapa_1.jpg"],
    "rating_summary": { "average": 4.95, "total_reviews": 41, "breakdown": { "5": 39, "4": 2, "3": 0, "2": 0, "1": 0 } },
    "rules": {
      "cancellation_policy": "Gratuita antes de aceptación",
      "advance_booking_hours": 2,
      "what_to_bring": "Efectivo o Wallet Hype para extras",
      "includes": "Mesa reservada y pedido anticipado",
      "excludes": "Bebidas fuera del pedido anticipado"
    }
  },
  "vertical_config": {
    "venue": {
      "requires_mandatory_bottle": false,
      "supports_allergies_alert": true,
      "menu_items": [
        { "id": "item_01", "name": "Ceviche de pez vela", "description": "Pez vela fresco curtido al momento.", "price_mxn": 250, "image_url": "https://storage.googleapis.com/.../ceviche.jpg", "allergens": ["pescado", "citricos"], "available": true }
      ],
      "bar_360_bottles": [],
      "tables": [ { "label": "Palapa principal", "capacity": 40 } ],
      "turns": ["13:00", "16:00", "19:00"]
    },
    "tour": {
      "departure_dock": "Parque de la Reina",
      "schedule_slots": ["11:00", "14:00", "16:30"],
      "duration_minutes": 150,
      "capacity_per_slot": 80,
      "price_per_person_mxn": 350
    },
    "accommodation": {
      "price_per_night_mxn": 1450,
      "max_guests": 4,
      "check_in": "15:00",
      "check_out": "12:00",
      "amenities": ["wifi", "cocina", "elevador"]
    },
    "transport": {
      "vehicle_tier": "hype_confort",
      "model": "BYD Dolphin Mini",
      "plates": "A-123-FGA",
      "passenger_capacity": 4,
      "has_ac": true,
      "is_online": true,
      "verification_photos": ["front", "seats", "dashboard_ac", "license"]
    }
  },
  "staff_uids": ["uid_staff_puerta_1"]
}
```

Nota: la ubicación de Mariscos Rulo's en el Maestro es lat 16.8492, lng -99.8511; la verificada en campo es 16.84911, -99.85405 (acceso CICI). Se conserva la verificada; Pedro confirma cuál queda (ver §14).

### Subcolección `allies/{allyId}/reviews/{reviewId}`

```json
{
  "booking_id": "res_987654",
  "explorer_uid": "uid_sofia_mty",
  "explorer_name": "Sofía",
  "explorer_city": "Monterrey",
  "rating": 5,
  "comment": "La vista es tal cual las fotos y la ubicación no puede ser más central.",
  "user_photos": [],
  "ally_reply": null,
  "created_at": "2026-10-15T18:30:00Z"
}
```

### Colección `wallet_transactions/{txId}` (libro mayor inmutable)

```json
{
  "uid": "uid_explorador_o_aliado",
  "wallet_type": "explorer_credits | driver_commission_pool | ally_payout_ledger",
  "type": "topup_stripe | booking_payment | ticket_final_adjustment | refund_credit | driver_fee_deduction | spei_disbursement",
  "amount_mxn": -250.00,
  "balance_before": 1500.00,
  "balance_after": 1250.00,
  "reference_id": "booking_88291 | pi_3Q9xLm2eZvKYlo2C",
  "payment_method": "wallet_hype | stripe_card | mixed | spei",
  "created_at": "2026-11-19T08:40:00Z"
}
```

### Colección `concierge_requests/{requestId}` (bandeja de Aura → Concierge)

```json
{
  "explorer_uid": "uid_cliente",
  "status": "draft_from_aura | under_review | approved_payment_sent | paid",
  "occasion": "Aniversario",
  "days": 3,
  "guests": 2,
  "allergies_and_notes": "Alergia a nueces. Buscan cena romántica y paseo al atardecer.",
  "itinerary_items": [
    { "day": 1, "ally_id": "ally_depto_costera", "service_name": "Departamento frente a la bahía", "net_price_mxn": 2900 }
  ],
  "financials": {
    "allies_subtotal_mxn": 2900,
    "concierge_commission_rate": 0.15,
    "concierge_fee_mxn": 435,
    "final_client_total_mxn": 3335
  },
  "created_at": "2026-11-19T08:40:00Z"
}
```

### Otras entidades (demo y producción)

- `Listing`: id, hostId, tipo (alojamiento / experiencia / servicio), categoría, subtipo, título, descripción, fotos, precio (por noche / por participante / por persona), duración, idiomas, ubicación + punto de encuentro, aspectos (máx. 2, alojamiento), itinerary (momentos), knowBefore, disponibilidad (fechas con precio), estado (en_progreso / publicado), rating, reviewCount.
- `Offer`: id, listingId, título (máx. 32), foto, precio por persona.
- `Booking`: id, travelerId, listingId, fecha, hora, personas, estado (pendiente / aceptada / completada / cancelada), ticketCode, paymentMethod (tarjeta / wallet / mixto), walletPart, subtotal, taxes, total, hostPayout, hypeFee, commissionRate, allergies, finalTicket, tips, qrScanned, packageId, conciergeRequestId.
- `SubBooking`: id, packageBookingId, partnerId, serviceLabel, fecha, hora, personas, estado (directa / cancelada / completada).
- `Trip`: id, travelerId, driverId, ruta, tier, estado, fare + desglose (fareBase, fareKm, fareMin, fareMultiplier, distanceKm, minutes), paymentMethod, crossRule, código.
- `Review`: id, bookingId / tripId / conciergeRequestId, authorId, kind (servicio / transporte_conductor / transporte_pasajero), stars 1–5, texto, fotos, ciudad, allyReply.
- `Receipt`: id, walletTxId, comercio, artículos, subtotal, total con IVA, efectivo, cambio, iva, fecha, ejemplo.
- `Guide`: id, userId, nombre, teléfono, tours asignados.
- `ConciergeAction`: id, tipo, detalle, estado (pendiente de verificación / aprobado / rechazado), creado por, aprobado por.

Reglas de seguridad: un usuario solo lee / escribe sus propios datos y los de su negocio. Staff solo escanea tickets de su propio aliado. Nadie lee CLABE completa, solo últimos 4. Los hilos de chat solo los ven sus dos participantes, ni siquiera Hype.

## 10. Configuración de Aura (Gemini API)

### Arquitectura de ejecución

1. El frontend envía el mensaje del Explorador a una Cloud Function (`chatWithAura`).
2. La función consulta en Firestore `allies` con status == "active", serializa los servicios disponibles en un JSON ligero y lo inyecta en el `system_instruction` de **gemini-2.5-flash**.
3. Se fuerza la respuesta mediante `response_schema` (Structured Outputs) para alimentar tanto la burbuja de chat como las tarjetas interactivas de itinerario.

### system_instruction de producción

Eres Aura, la concierge digital experta de Hype Xperience en Acapulco, Guerrero. Tu objetivo es escuchar la intención del usuario (aniversarios, despedidas de soltero/a, vacaciones familiares, clases de surf/buceo/natación, tours en bahía, antros o traslados) y construir un borrador de Xperience utilizando ÚNICAMENTE los servicios reales proporcionados en el CATÁLOGO ACTIVO adjunto. REGLAS OPERATIVAS ESTRICTAS:

1. CERO ALUCINACIONES: Jamás inventes precios, nombres de embarcaciones, restaurantes, horarios ni disponibilidad fuera del JSON del catálogo activo. Si falta algún servicio solicitado, indícalo con transparencia y sugiere la mejor alternativa real disponible.
2. CALIFICACIÓN EFICIENTE: Si la petición es abierta, realiza máximo 2 o 3 preguntas breves en un solo mensaje para obtener: fechas exactas y duración en días; número de personas; alergias alimentarias o restricciones médicas/dietéticas (obligatorio si el plan incluye restaurantes, catering o actividades físicas).
3. INTEGRACIÓN DE MOVILIDAD: Incluye traslados sugeridos usando las categorías de transporte del catálogo (Hype Go, Hype Confort o Hype by Pro para grupos/VIP).
4. CÁLCULO FINANCIERO: Suma los precios netos de los Aliados seleccionados y calcula exactamente el 15% adicional correspondiente a la gestión Concierge.
5. TRANSPARENCIA DE ESTADO: Indica siempre que el itinerario mostrado es un borrador sujeto a verificación final de disponibilidad por el equipo Concierge.
6. TONO: Sofisticado, cálido, experto local en Acapulco, claro y orientado a la acción.

### response_schema (salida JSON estructurada)

```json
{
  "type": "OBJECT",
  "properties": {
    "mensaje_conversacional": { "type": "STRING", "description": "Respuesta natural de Aura para mostrar en la burbuja de chat." },
    "estado_cotizacion": { "type": "STRING", "enum": ["recopilando_datos", "borrador_listo"] },
    "datos_cliente": {
      "type": "OBJECT",
      "properties": {
        "ocasion": { "type": "STRING" },
        "dias": { "type": "INTEGER" },
        "personas": { "type": "INTEGER" },
        "alergias_notas": { "type": "STRING" }
      }
    },
    "itinerario_propuesto": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "dia": { "type": "INTEGER" },
          "vertical": { "type": "STRING" },
          "ally_id": { "type": "STRING" },
          "servicio_nombre": { "type": "STRING" },
          "precio_neto_aliado": { "type": "NUMBER" },
          "notas_logisticas": { "type": "STRING" }
        },
        "required": ["dia", "vertical", "ally_id", "servicio_nombre", "precio_neto_aliado"]
      }
    },
    "resumen_financiero": {
      "type": "OBJECT",
      "properties": {
        "subtotal_aliados": { "type": "NUMBER" },
        "comision_concierge_15_pct": { "type": "NUMBER" },
        "total_cliente_mxn": { "type": "NUMBER" }
      }
    }
  },
  "required": ["mensaje_conversacional", "estado_cotizacion"]
}
```

## 11. Reseñas verificadas

1. **Solo reservas completadas:** únicamente un Explorador cuyo código QR fue escaneado o cuyo servicio figura como completado puede calificar (1.0 a 5.0 estrellas + comentario + fotos).
2. **Doble evaluación en transporte:** el Explorador califica al conductor/unidad y el conductor califica al pasajero.
3. **Paquetes Concierge:** se califica la experiencia global y cada servicio individual.
4. **Réplica del Aliado:** los Aliados pueden responder públicamente a las reseñas desde su panel.
5. El sistema de calificación de Hype es **estrellas 1.0–5.0** (el Maestro fija estrellas; el símbolo de fuego de borradores anteriores queda descartado).

## 12. TDD — criterios de aceptación y tests

Escribir el test en rojo antes del código, para cada flujo.

- T01 Registro único y cambio de modo: dado un registro nuevo, entonces existe una sola cuenta con interruptor Explorador/Aliado; dado un cambio de modo, entonces se muestra la pantalla de carga y el panel del modo elegido.
- T02 Concierge oculto: dado un usuario sin `concierge_access` que intenta entrar a Concierge, entonces se rechaza con error claro; dado One Xperience, entonces sí entra.
- T03 Onboarding por vertical: dado un aliado que elige Venues, entonces ve carta digital, selector de alergias, Bar 360 condicional y mesas/turnos; dado uno que elige Transporte, entonces se le piden las 4 fotos de verificación y el tier; dado uno que elige Alojamiento, entonces ve calendario de noches y tarifas dinámicas; dado uno que elige Tours, entonces ve muelles, bloques de tiempo y cupo por turno.
- T04 Puerta de publicación: dado un anuncio sin fechas con precio en su calendario, entonces no se publica y queda "En progreso" indicando lo que falta; dada una experiencia sin itinerario, entonces tampoco se publica; dado un anuncio completo, entonces se publica.
- T05 Editar Perfil y Oferta 24/7: dado un aliado que cambia su precio, menú o reglas, entonces el cambio se refleja de inmediato en su ficha y en las reservas nuevas.
- T06 Tarifa por fórmula: dado un viaje Costera Go de 6.5 km / 14 min, entonces la tarifa es $140 (35+78+28=141, redondeada a $5); dado un viaje Colosio Confort de 9 km / 18 min, entonces es $225 (179×1.25); dada la cotización, entonces se muestra el desglose antes de confirmar.
- T07 by Pro bloqueado: dado un explorador sin permiso Concierge que pide Hype by Pro, entonces se rechaza ("uso exclusivo del modo Concierge y traslados VIP").
- T08 Comisión por antigüedad: dado un aliado con 16 días de promoción, entonces su comisión es 5% (95% neto); dado un aliado con la promoción vencida, entonces es 10% (90% neto).
- T09 Paquete curado 15%: dado un borrador con subtotal neto $6,936, entonces la gestión Concierge es $1,040 y el total $7,976; dados los aliados, entonces cada uno recibe su precio neto íntegro.
- T10 Ticket final venue: dada una reserva de $580 con $200 de extras y $100 de propinas, entonces el ticket final es $780, la comisión es $78 (10%) y las propinas van íntegras al aliado.
- T11 Bolsa del conductor: dado un viaje en efectivo de $210 con un conductor al 5%, entonces se descuentan $10.50 de su bolsa; dada una bolsa por debajo de -$30, entonces el botón "En línea" se pausa.
- T12 Pagos híbridos y libro mayor: dado un pago mixto de $580 con $300 de Wallet, entonces la Wallet se descuenta $300, la tarjeta cubre $280 y el movimiento registra método, saldos antes y después.
- T13 Dispersión: dado un aliado con `spei_manual` y CLABE, entonces su saldo pendiente se acumula para el corte SPEI; dado uno con `stripe_connect`, entonces se dispersa automático tras validar QR o cerrar cuenta.
- T14 Reseñas verificadas: dada una reserva solo aceptada, entonces la reseña se rechaza; dada una reserva completada (QR escaneado), entonces se acepta con estrellas, comentario y fotos; dado un viaje completado, entonces explorador y conductor pueden calificarse entre sí; dada una reseña, entonces el aliado puede responderla públicamente.
- T15 Staff solo QR: dado un Staff que escanea un ticket de otro aliado, entonces se rechaza; dado un Staff que escanea un ticket de su propio aliado, entonces se completa; dado un Staff, entonces no ve finanzas ni edición.
- T16 Aura calificación: dada una petición abierta, entonces Aura hace máximo 2–3 preguntas breves en un solo mensaje; dado un borrador, entonces muestra el 15% y la marca "sujeto a verificación del Concierge".
- T17 Pipeline Aura→Concierge: dado un borrador confirmado, entonces entra a la bandeja como `draft_from_aura`; dado el Concierge que lo revisa y aprueba, entonces se libera el link de pago consolidado; dado el pago del link, entonces el estado pasa a `paid` y se crea una reserva aceptada por servicio.
- T18 Sub-reservas y cascada: dado un paquete reservado, entonces cada aliado recibe exactamente una sub-reserva directa; dada la cancelación del paquete antes de aceptar, entonces sus sub-reservas se cancelan también y se reembolsa el 100%.
- T19 Auto-reserva: dado un aliado que intenta reservar su propio anuncio o paquete, entonces se rechaza con error claro.
- T20 Alergias obligatorias: dada una reserva en un venue sin selector de alergias, entonces se rechaza; dada con "Sin alergias" o una alergia, entonces continúa y la alergia llega a cocina.
- T21 Chat de viaje y WhatsApp: dado un viaje aceptado, entonces aparece el chat del viaje (solo los dos participantes) y el enlace wa.me con solo ID, estado y ETA.
- T22 Saldo insuficiente: dado un explorador con saldo menor a la parte Wallet, entonces el pago se rechaza con "Saldo insuficiente".
- T23 Doble pago: dada una reserva ya pagada, entonces el segundo intento de pago se rechaza.
- T24 QR un solo uso: dado un ticket ya escaneado, entonces el segundo escaneo se rechaza.
- T25 Recibo digital: dado un pago, entonces se genera un recibo con los datos exactos, visible en Wallet y en Tickets > Recibos; dado un recibo de ejemplo, entonces lleva "EJEMPLO · DEMO" y "No es un comprobante fiscal".
- T26 Recarga automática (Fase 1): dado saldo bajo del mínimo con tope mensual disponible, entonces se recarga el monto elegido; dado tope mensual alcanzado, entonces no se recarga y se avisa.
- T27 Alerta de saldo bajo (Fase 1): dado saldo insuficiente para la próxima reserva, entonces se muestra la alerta con recarga en un toque.
- T28 Pre-trip preload (Fase 1): dado un itinerario con total estimado, entonces Aura sugiere ese monto y el explorador puede aceptarlo o cambiarlo.
- T29 OXXO (T-13b): dado un código generado y pagado en efectivo, entonces el saldo se acredita por el monto exacto; dado un código vencido, entonces no se acredita nada y se ofrece generar otro.
- T30 SPEI/CoDi (T-13b): dada una transferencia confirmada, entonces el saldo se acredita; dada una transferencia no confirmada, entonces la recarga queda pendiente, no disponible.
- T31 Tag de peaje (T-13c): dado saldo suficiente, entonces la recarga del tag se descuenta del Wallet y queda registrada.
- T32 Gasolina QR (T-13c): dado saldo suficiente, entonces el pago con QR se descuenta del Wallet y genera comprobante.
- T33 Hoja "?" opaca: dada una hoja de ayuda abierta, entonces no se ve ni se lee el contenido de detrás; los textos no se superponen.
- T34 Bienvenida: dado un explorador que inicia sesión, entonces ve "Bienvenido a la Saga del Sol" con su nombre y no aparece "MODO TURISTA" en ninguna pantalla.
- T35 Selector de fecha Liquid Glass: dado el selector de fecha abierto, entonces usa el diseño Liquid Glass de la app, no gris plano.
- T36 Taxis sin choferes predeterminados: dado el mapa de taxi sin choferes registrados en línea, entonces no se muestra ningún taxi y las 6 rutas se ven trazadas con líneas; dado un chofer registrado en línea, entonces aparece con su ubicación en tiempo real.
- T37 Explorar unificado: dado el explorador que abre Explorar, entonces ve el mapa y el calendario en la misma sección.
- T38 Botones flotantes: dados los botones Feed, Explorar, Tickets, Taxi y Wallet, entonces son independientes, en línea horizontal, y cada uno despliega su tarjeta flotante.
- T39 Cuentas solo para Hype: dado un explorador o un aliado, entonces no ve la sección Cuentas registradas; dado Pedro (Hype), entonces sí la ve.
- T40 Botones rojos y texto simétrico: dado cualquier botón de interacción, entonces es rojo #E62E3D y su texto va centrado y simétrico.
- T41 Pin junto a la dirección: dada una tarjeta de negocio con ubicación verificada, entonces el pin va al lado del nombre de la dirección/zona.
- T42 Términos y condiciones: dado un registro sin marcar la casilla de términos, entonces no se puede crear la cuenta; dada la casilla marcada, entonces el registro continúa.
- T43 Responsivo: dadas las pantallas de acceso en un celular chico, una tableta y una computadora, entonces el contenido se ve completo, centrado y sin desbordamiento ni elementos cortados.

## 13. ODD — observabilidad

Logs obligatorios:
- `wallet.recharge`, `wallet.payment`, `wallet.payment_rejected`, `wallet.mixed_payment`, `wallet.withdrawal`
- `wallet.autorecharge`, `wallet.autorecharge_blocked`, `wallet.low_balance_alert`, `wallet.preload_suggested` (Fase 1)
- `wallet.oxxo_code_generated`, `wallet.oxxo_paid`, `wallet.oxxo_expired`, `wallet.spei_pending`, `wallet.spei_confirmed`, `wallet.toll_topup`, `wallet.fuel_qr_paid` (Fase 2/3)
- `booking.created`, `booking.paid`, `booking.double_payment_blocked`, `booking.self_booking_blocked`, `booking.cancelled_cascade`
- `ticket.scanned`, `ticket.rejected`, `ticket.final_closed`, `ticket.tips_paid`
- `trip.requested`, `trip.accepted`, `trip.location_updated`, `trip.completed`, `trip.cancelled`, `trip.fare_quoted`
- `driver.pool_deducted`, `driver.online_paused`, `driver.pool_topped_up`
- `ally.created`, `ally.activated`, `ally.profile_updated`, `ally.payout_pending`
- `listing.created`, `listing.published`, `listing.publish_blocked`, `listing.draft_saved`
- `review.created`, `review.rejected_not_completed`, `review.reply_posted`
- `staff.created`, `staff.scan_rejected_wrong_ally`
- `aura.qualified`, `aura.draft_created`, `aura.no_service_found`, `aura.hallucination_blocked`
- `concierge.request_received`, `concierge.request_reviewed`, `concierge.request_approved`, `concierge.payment_link_sent`, `concierge.request_paid`
- `experience.created`, `experience.published`
- `subbooking.created`, `subbooking.cancelled_cascade`
- `guide.assigned`
- `concierge.pending_verification`, `concierge.action_approved`, `concierge.action_rejected`
- `allergy.flagged`
- `preorder.created`, `preorder.ready`
- `profile.theme_updated`, `auth.role_assigned`, `auth.login_failed`, `account.mode_switched`

Métricas:
- Reservas pagadas por día, por vertical.
- Pagos rechazados por saldo insuficiente.
- Tiempo de aceptación de viaje por conductor.
- Tickets escaneados vs emitidos.
- Errores de pago y de QR por hora.
- Borradores de Aura convertidos a pagados (tasa de conversión Concierge).
- Tiempo medio de aprobación de un borrador en la bandeja.

Alertas:
- Pago cobrado sin reserva.
- Retiro mayor al saldo.
- Caída de login con Facebook.
- Error de Concierge inventando un servicio.
- Bolsa de conductor por debajo de -$30.
- Anuncio publicado sin disponibilidad (no debe ocurrir; la puerta lo impide).

## 14. Teamwork — tareas

| ID | Tarea | Rama | Revisor |
|---|---|---|---|
| T-01 | Repo, Firebase, diseño base (tokens §4) | `setup/repo` | Código + UI |
| T-02 | Auth por modo + RBAC (Explorador/Aliado/Concierge por permiso) | `feat/auth-modes` | Seguridad |
| T-03 | Catálogo dinámico + onboarding por vertical + puerta de publicación | `feat/catalogo` | UX |
| T-04 | Explorador: descubrir, reservar, Tickets, pago híbrido | `feat/explorador` | UX + UI |
| T-05 | Wallet de créditos + libro mayor + dispersión SPEI/Stripe Connect | `feat/wallet` | Seguridad + Código |
| T-06 | Venue: carta, alergias, Bar 360, mesas/turnos, cierre de cuenta, Staff QR | `feat/venue` | Seguridad |
| T-07 | Taxi: fórmula de tarifa, tiers, bolsa del conductor, WhatsApp | `feat/taxi` | UX |
| T-08 | Calendario Feed + Perfil flotante + cambio de modo | `feat/calendario-perfil` | UI |
| T-09 | Aura (Gemini, system instruction + response_schema §10) solo con catálogo real | `feat/aura` | Seguridad + UX |
| T-10 | Concierge: bandeja de borradores, validación, link de pago consolidado | `feat/concierge` | Seguridad + UX |
| T-11 | Hype control: panel de mando, Armar Xperience, sub-reservas + cascada, guías, alergias y pre-pedido | `feat/hype-control` | Seguridad + UX |
| T-12 | Pantallas UI de la app sobre los servicios (demo `hype-xperience-v2` como referencia visual) | `feat/ui-screens` | UI + UX |
| T-13 | Wallet siempre cargado — Fase 1: recarga automática con tope, alertas de saldo bajo, precarga sugerida por Aura (F8, T26–T28) | `feat/wallet-topup` | Seguridad + Código |
| T-13b | Wallet — Fase 2: OXXO + SPEI/CoDi (T29–T30), después del lanzamiento | `feat/wallet-topup` | Seguridad + Código |
| T-13c | Wallet — Fase 3: tag de peaje + gasolina QR (T31–T32), 2027 | `feat/wallet-topup` | Seguridad + Código |

Cada tarea: una rama / worktree, tests en rojo primero, revisión en paralelo, merge solo con tests en verde. Pagos, auth y datos personales pasan por gatekeeper humano: Pedro.

**Nota de migración (2026-11-19):** el repo en GitHub (`es3373261-spec/hype-xperience-`) sigue en main con el commit 02a83037 (spec Borrador v1) y la T-11 en la rama local `feat/hype-control` (commit 5aa92769, sin subir). Antes de fusionar la T-11, el paso 0 del checklist cambia: se sube **este spec Borrador v3** a main (no el v2). La T-11 se re-verifica contra este spec (el modelo de roles del Borrador v2 queda sustituido). Nada se sube a GitHub sin la aprobación de Pedro de este borrador.

## 15. Decisiones de Pedro (resueltas y pendientes)

1. **Piso de tarifa mínima (DECIDIDO 2026-11-26):** **$100 MXN** exactos como tarifa mínima para viajes en Hype Go.
2. **Coordenadas de Mariscos Rulo's (CONFIRMADO):** verificadas 16.84911, -99.85405 (acceso CICI) vs Maestro 16.8492, -99.8511. Se conserva la verificada.
3. **Reparto y desglose en paquetes Concierge (DECIDIDO 2026-11-26):** cada aliado recibe su ganancia con el descuento de la comisión correspondiente, y la comisión de servicio se agrega al precio final que visualiza el cliente con un **desglose claro determinando la comisión por servicio**.
4. **Redondeo de la comisión Concierge por servicio (DECIDIDO 2026-11-26):** se redondea **cada servicio individualmente** (aunque la suma varíe $1–$2 respecto al 15% global del borrador).
5. **Etiqueta de tipo de viaje (DECIDIDO 2026-11-26):** mostrar siempre el **tier pedido** (`Hype Go` / `Hype Confort` / `Hype by Pro`), ya que se cobra por fórmula y no como colectivo.
6. **Bolsa del conductor y redondeo (DECIDIDO 2026-11-26):** se registra con **centavos exactos (2 decimales)** (ej. `-$10.50`) para evitar descuadres contables.
7. **Privacidad del chat de viaje (DECIDIDO 2026-11-26):** privado entre pasajero y conductor, pero **Hype/Concierge puede leerlo con auditoría** únicamente en caso de soporte o incidente.
8. **Precios de ejemplo en la demo (PENDIENTE):** los anuncios de ejemplo usan precios de referencia de las capturas de Airbnb (yate $1,043, picnic $604, catering $25/$40/$85 por persona, sesiones de fotos $2,413–$7,076). Para el primer despliegue piloto entran solo proveedores reales confirmados (**Mariscos Rulo's** y **One By Pro**); nuevos proveedores se cargan cuando Pedro confirme precios.
9. **Anomalía de Wallet $52,520 (Alejandro Valdés) (PENDIENTE):** se conserva visible como pendiente de aclarar; no se corrige sin instrucción de Pedro.
10. **Segundo video de Aura (CERRADO):** nunca llegó; Pedro confirmó el material completo el 2026-11-19. La barra se construyó con las 2 fotos + 1 video recibidos. Los chips de respuesta rápida van sin emojis, conforme a la regla del 2026-11-19.
11. **Infraestructura y alcance del primer despliegue (DECIDIDO 2026-11-26):** proyecto Firebase oficial **`onebypro-b0d7d`**. Primer release: **Piloto Móvil + Backend** (Firebase Functions, Firestore Rules/Indexes, Aura, Stripe sandbox + App Expo para TestFlight / Play Internal con Mariscos Rulo's y One By Pro). Panel Admin Web queda para la siguiente iteración.

## 16. Registro de verificación — demo `hype-xperience-v2` (2026-11-19)

Verificado end-to-end con sondas sobre la base durable (usuario de prueba "Sonda Maestro", id 10):

- Registro + Wallet: recarga $5,000 vía Stripe simulada; cambio Explorador ↔ Aliado; Concierge bloqueado sin permiso y permitido para One Xperience.
- Tarifa por fórmula: Costera Go $140 (35+78+28=141→$140); Colosio Confort $225 (179×1.25); regla cruzada disparó; by Pro bloqueado sin permiso Concierge.
- Guardia de auto-reserva y selector de alergias obligatorio en venues (errores claros).
- Reserva mixta Rulo's: $500 + $80 IVA = $580 ($300 Wallet + $280 tarjeta); al aceptar 90/10 ($522/$58); cierre de ticket $580 + $200 extras = $780 final, comisión $78, propinas $100 íntegras a Rulo's; libro mayor cuadra en todos los saldos.
- Cancelación en cascada: paquete HYPE-J85378 cancelado → sus 2 sub-reservas "cancelada" y reembolso 100% ($2,192 exactos).
- Aura → Concierge: borrador $6,936 + 15% ($1,040) = $7,976 → draft_from_aura → under_review → aprobado con link HYPE-PAY-3VLN2H → paid; 3 reservas por servicio (Lucía $4,350, Diego $2,086, Rulo's $500).
- Reseñas: rechazada antes de completar, aceptada tras escaneo QR; Staff solo escanea tickets de su propio aliado; doble evaluación en transporte; réplica pública del aliado.
- Bolsa del conductor: viaje en efectivo $210 → descuento 5% ($250 → $239).
- Puerta de publicación: anuncio sin disponibilidad rechazado ("Disponibilidad: al menos una fecha con precio en el calendario") y publicado al completarla.
- Anomalía $52,520 intacta. Proveedores reales: Mariscos Rulo's (menú real con IVA, 16.84911, -99.85405) y One By Pro (eventos 14–15 nov 2026 ya pasados, referencia de piloto).

## 17. Proveedores piloto y catálogo

- **Mariscos Rulo's (real):** restaurante bar en la playa, acceso CICI, Acapulco (16.84911, -99.85405). Menú real con IVA en `workspace/hype-xperience/providers/mariscos-rulos-menu.md`. Conga/Suero/Piña colada por confirmar. SPEI manual, CLABE guardada, beneficiario "Mariscos Rulos SA de CV". Comisión 10% (activado 2026-09-01, promoción vencida).
- **One By Pro (real):** productora de eventos de Hype. Sus eventos del sábado 14 de noviembre de 2026 en Tropic y domingo 15 en Ronin 22 ya pasaron; quedan como referencia del piloto. Precio: $350 cover.
- **El resto del catálogo es ejemplo marcado como tal** (precios de referencia del modelo Airbnb, ver §15.8). En producción solo entran proveedores y precios reales confirmados por Pedro.
- **Ubicaciones verificadas:** Mariscos Rulo's en 16.84911, -99.85405. Ronnie Acapulco: ubicación NO verificada — aproximado sobre la Av. Costera Miguel Alemán, zona Dorada, marcado como aproximado por confirmar.

## 18. Stack recomendado

- Móvil: Expo + React Native + TypeScript, un solo código iOS / Android.
- Backend: Firebase — Auth, Firestore, Storage, Functions (incluida `chatWithAura`), App Check.
- Login social: Firebase Auth con Facebook (Meta app Negocios). WhatsApp e Instagram son enlaces y, en producción, API de Meta con verificación de empresa.
- Mapas: Google Maps (tarifa por fórmula con Maps API).
- Pagos Wallet: recarga con Stripe en sandbox primero, luego producción. El saldo interno es ledger propio, con movimientos firmados. **Stripe sandbox (2026-11-09, Pedro):** la clave publicable de prueba va solo en el cliente (variable `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`); la clave secreta de prueba va SOLO en el servidor (config de Firebase Functions / `.env` del servidor), nunca en el repo, nunca en el spec y nunca en el chat. Las claves las emite Pedro desde su panel de Stripe; la secreta se rota si se expone.
- Aura: Gemini 2.5 Flash vía Cloud Function, Structured Outputs con el `response_schema` del §10.
- Repo: GitHub, monorepo `app/` móvil, `admin/` web, `functions/` backend. Ramas `main`, `dev`, una rama por tarea.
- Meta: app de Meta Developers tipo **Negocios**, no Consumidor. El tipo no se cambia después de crearla. ID y secreto de la app van en Firebase Auth > Facebook, nunca en el chat ni en el código. La URI de redirección OAuth de Firebase va en Meta > Facebook Login.
