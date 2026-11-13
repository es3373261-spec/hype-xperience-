# Hype Xperience — Spec SDD / TDD / ODD
## Para Antigravity CLI / Teamwork

- **Fecha:** 2026-11-07 / 2026-11-08 / 2026-11-09 / 2026-11-13
- **Estado:** Borrador v1 para revisión de Pedro. No es código, es el plano.
- **Fuente:** 29 mockups de Pedro, demo interactiva en Muse (slug `hype-xperience`), y sus decisiones en chat.
- **Regla de oro para Antigravity:** seguir este spec al pie de la letra. No inventar funcionalidades fuera del alcance. Si algo del spec es ambiguo, preguntar a Pedro antes de programarlo.

## 1. Objetivo

App que gestiona y conecta todos los servicios turísticos de Acapulco en un solo lugar, en modo moderno, para lanzar en diciembre de 2026, la temporada más fuerte del año.

Problema principal que ataca: desconfianza en los pagos. Hay prestadores que brindaron el servicio y luego les cancelaron la transferencia. Por eso el pago es prepago con Wallet, no promesa de pago después.

## 2. Alcance

### MVP — diciembre 2026
- Registro y login separados: una puerta para Usuarios (turistas) y otra para Negocios (prestadores), con Firebase Auth. El turista no ve las categorías de negocio al registrarse.
- Turista: descubrir, Concierge, reservar tours / restaurantes / eventos, pedir taxi, Hype Ticket con QR, Wallet.
- Restaurante: dashboard, menú con fotos, reservas, reseñas.
- Club: reserva de mesa con botellas, mesa sin botella o solo entrada; staff con permiso limitado para escanear boletos y hostess; pedido de bebidas en mesa desde la carta precargada.
- Taxista individual (sin flota): recibir viajes, aceptar, seguimiento por WhatsApp.
- Wallet prepago + pago a prestador + retiro a banco.
- Wallet siempre cargado — Fase 1 (lanzamiento): recarga automática con mínimo y tope mensual elegidos por el turista, alertas de saldo bajo y sugerencia de precarga del Concierge antes del viaje. (F8, T-13; decidido 2026-11-13.)
- Calendario solo en Feed, vista semanal / mensual con un clic.
- Perfil arriba, tarjeta flotante con datos y roles. Barra inferior del turista: caja de texto del Concierge AI (los demás roles conservan su barra inferior flotante). Tema oscuro / claro editable en Perfil.
- Catálogo dinámico: una categoría sin proveedor activo no se muestra.
- Panel de mando Hype (Pedro): ve todos los usuarios que se van registrando, todos los negocios y todas las reservas/clientes; arma experiencias; asigna guías; da el visto bueno a las acciones del Concierge que queden pendientes de verificación.
- Experiencias Xperience armadas por Hype: paquetes con hotel, transporte, comida y actividades; al reservarse, cada negocio aliado recibe su sub-reserva en su panel.
- Alergias del turista visibles para el restaurante en reservas y pedidos; pre-pedido de comida junto con la reserva de mesa, para que esté listo al llegar.

### Fase 2 — después del lanzamiento
- Hotel: reserva de habitaciones.
- Playa / actividades: sillas, jetski, banana, buceo, paracaídas, con cupo por horario.
- Pedido en mesa completo con cocina / barra, analytics VIP, bodega, telemetría de chóferes.
- Split the Hype completo entre 4 personas.
- Wallet siempre cargado — Fase 2 (T-13b, después del lanzamiento): recarga en OXXO con código y carga por SPEI/CoDi. Fase 3 (T-13c, 2027): recarga de tag de peaje y pago de gasolina con QR.

### Fuera de alcance por ahora
- Pagos con tarjeta directa sin Wallet como método principal.
- Conexión real con Meta API / OAuth. En la demo es solo demo. En producción es trabajo aparte, con app de Negocios en Meta Developers.
- Publicación en tiendas hasta pasar el piloto cerrado.

## 3. Roles — la autenticación decide el dashboard

Son **5 roles** en total: el Turista más los 4 centros de consumo (2026-11-08, Pedro). Así se distribuyen:

| Rol | Ve | Puede hacer | No puede hacer |
|---|---|---|---|
| Turista | Feed, Explorar, Mapa, Concierge, Tickets, Wallet, Calendario | Registrarse, buscar, reservar, pagar con Wallet, pedir taxi (mapa tipo Uber, botón con la silueta del bocho), ver sus reservas y eventos | Ver dashboards de prestadores, ver finanzas de otros |
| Alimentos y bebidas | Panel, Reservas, Catálogo / Menú | Cargar platillos y bebidas con foto y precio, recibir reservas, ver reseñas (🔥) | Ver otros negocios, cobrar fuera de Wallet |
| Transportación | Viajes, Mapa, Wallet | Recibir y aceptar viajes, seguimiento por WhatsApp | Ver viajes de otros taxistas |
| Alojamiento | Panel, Reservas, Habitaciones | Cargar casas, hoteles y apartamentos, recibir reservas | — |
| Xperience (Hype / Pedro) | Panel de mando, Experiencias, Reservas, Clientes, Guías | Crear y vender experiencias completas (paquetes) combinando centros de consumo; ver todos los usuarios registrados, todos los negocios y todas las reservas/clientes; asignar guías de turistas; dar visto bueno a acciones del Concierge pendientes de verificación; productora de eventos (One By Pro); reserva de mesas y mapa de mesas editable | — |
| Staff de club (sub-rol de Alimentos y bebidas) | Escáner, Hostess | Escanear boletos, acreditar entrada, hostess | Ver pagos, menú, finanzas, crear staff |
| Guía de turistas (sub-rol de Xperience, asignado por Pedro) | Mis tours asignados | Ver sus tours asignados con clientes, horario y punto de encuentro; acompañar al grupo | Ver otros tours, finanzas, precios del paquete |
| Admin Hype | Todos los paneles | Onboarding de proveedores, encender / apagar categorías, soporte; es el mismo rol de mando que Xperience (Hype / Pedro) | Cobrar fuera de Wallet |

Los roles anteriores se agrupan en estos 5: restaurante y club → Alimentos y bebidas; taxista → Transportación; hotel → Alojamiento; playa/actividades y productora → Xperience. **Pedro es el operador Xperience (Hype): él arma y vende las experiencias completas.** Los negocios de actividades (centros de buceo, escuelas de surf, yates, pesca, clubes de playa) son aliados/proveedores de servicios dentro de los paquetes de Hype, no cuentas Xperience abiertas: ellos reciben sub-reservas de los paquetes, no crean sus propios tours. (2026-11-09, Pedro)

**Taxi tipo Uber:** al pedir el taxi se usa el mapa tipo Uber (punto de recogida, el bocho moviéndose y el destino); el botón de taxi y el marcador del taxi en el mapa son la silueta del bocho de Acapulco blanco y azul (`icon/bocho-taxi-silhouette.png`, PNG con fondo transparente).

**Taxis azules y amarillos (2026-11-09, Pedro):** los azules dan servicio privado (el usuario pide un viaje y el taxi lo lleva a su destino); los amarillos son colectivos con ruta fija. En el mapa tipo Uber el avatar del taxi (silueta de bocho) se mueve en vivo y es azul o amarillo según el tipo. El radar identifica el taxi azul más cercano al usuario (solo azules). Los amarillos reportan su ubicación actual todo el tiempo y corren 6 rutas: Zapata, Vacacional, Rena (Renacimiento), Coloso, Colosio y Costera; el usuario ve qué taxi viene, de qué ruta y en cuánto llega. Pasaje del colectivo amarillo: $25 MXN por viaje en todas las rutas. Regla cruzada: si se pide servicio privado y el amarillo más cercano está más cerca que el azul más cercano, el amarillo es notificado y puede aceptar el viaje privado si no lleva pasaje (vacío).

**Autenticación separada (2026-11-10, Pedro):** dos puertas — Usuarios y Negocios. La puerta de Usuarios registra solo turistas (nombre, correo, contraseña, alergias opcionales) y no muestra las categorías de negocio. La puerta de Negocios registra prestadores: datos del negocio + su categoría (uno de los 4 centros de consumo) + verificación y alta por Admin Hype (T-03). Un correo es una sola cuenta en Firebase Auth: quien quiera ser turista Y negocio necesita otro correo (o un futuro "agregar perfil de negocio").

Regla: un usuario tiene un rol principal. Cambiar de rol en la demo es solo para probar; en producción el cambio de rol requiere registro / verificación por rol.

## 4. Flujos principales

### F1. Turista reserva
1. Se registra como Turista.
2. Explora Feed / Explorar, con filtros Todo, Beach Clubs, Pozolerías, Taxis.
3. Abre un servicio, ve precio, reseñas y disponibilidad.
4. Reserva. Si no tiene saldo en Wallet, el pago se rechaza con "Saldo insuficiente — agrega dinero en tu Wallet".
5. Paga con Wallet antes del servicio. Recibe Hype Ticket con código.
6. Ve su reserva en Tickets y en el Calendario del Feed: dorado = tus reservas, azul = eventos próximos.

### F2. Wallet
1. Turista recarga en Perfil > Wallet: chips $500, $1,000, $2,000, $5,000 o monto libre.
2. Al pagar, se descuenta de su Wallet y se reparte al instante: 90% a la Wallet del prestador y 10% de comisión para Hype, con movimiento en ambos lados.
3. No se puede pagar dos veces la misma reserva.
4. Prestador retira a su banco: primero guarda CLABE, últimos 4 dígitos y titular. Aviso: 1–2 días hábiles.

### F3. Club, staff y pedido en mesa
1. Club carga su carta de bebidas con precio.
2. Turista dentro del club pide desde la app.
3. Staff escanea el Hype Ticket en puerta. Ticket válido = "Acceso autorizado". Ticket ya usado = rechazado.
4. Staff no ve pagos ni finanzas.

### F4. Taxi
1. Turista pide taxi con origen y destino.
2. Taxista disponible recibe el viaje y lo acepta.
3. Seguimiento por WhatsApp con enlace y mensaje listo, usando el número guardado en Perfil.
4. Viaje se paga con Wallet antes o al confirmar, según la regla de pago prepago.

### F4b. Taxis azules (privado) y amarillos (colectivos) — 2026-11-09
1. El turista abre el mapa de taxi tipo Uber: los taxis se mueven en vivo; el avatar es azul o amarillo según el tipo seleccionado.
2. Servicio privado (azul): el radar identifica el taxi azul más cercano al usuario, con distancia y tiempo estimado de llegada; ese taxi recibe el viaje.
3. Colectivo (amarillo): el usuario ve en el mapa los amarillos en su ruta fija, con nombre de ruta (Zapata, Vacacional, Rena, Coloso, Colosio, Costera), ubicación actual y tiempo de llegada a su punto. Pasaje $25 MXN por viaje en todas las rutas.
4. Regla cruzada: si se pide servicio privado y el amarillo más cercano está más cerca que el azul más cercano, el amarillo es notificado y puede aceptar el viaje privado si no lleva pasaje (vacío); si lleva pasaje o no acepta, el viaje lo toma el azul más cercano.
5. Al tocar un taxi se ven sus datos: nombre, edad, teléfono, número de taxi, ruta (amarillo), pasajeros a bordo (amarillo) y disponibilidad.

### F5. Concierge Aura
- Chat que solo recomienda servicios reales del catálogo activo.
- Usa datos del perfil y requerimientos del turista.
- No inventa servicios, precios ni disponibilidad. Si no hay servicio, lo dice y escala a host humano.
- **Concierge con visto bueno de Pedro (2026-11-09):** cuando Pedro no está viendo la app, el Concierge puede responder y gestionar (responder dudas, proponer itinerarios y paquetes). Pero toda acción que comprometa algo —reservar, cambiar una reserva, prometer disponibilidad o precio— queda en estado **pendiente de verificación** y NO se ejecuta hasta que Pedro le da el visto bueno. Pedro ve esas acciones pendientes en su panel de mando y las aprueba o rechaza.

### F6. Paquete Xperience y sub-reservas (2026-11-09)
1. Pedro abre **Armar una nueva experiencia** en su panel de mando: elige hotel, transporte, comida y actividades día por día (por ejemplo, una semana en un hotel con taxi y actividades acuáticas).
2. Publica la experiencia como un solo producto reservable, con precio total real (suma de los servicios reales).
3. El turista reserva el paquete con Pedro y paga una sola vez por adelantado con Wallet.
4. Al pagarse, la app genera una **sub-reserva por cada negocio aliado** del paquete, que cae en el panel de ese negocio con fecha, hora, número de personas, servicio y punto de encuentro — aunque el turista no reservó directo con ellos. Las sub-reservas llegan **directas, sin que el aliado tenga que confirmarlas** (decidido 2026-11-13): si un aliado tiene un conflicto, lo avisa a Pedro/Hype y se reasigna, pero la reserva ya pagada no queda esperando confirmación.
5. Cada negocio ve solo su sub-reserva, no el precio total del paquete ni a los otros negocios.
6. Pedro asigna al guía de turistas del paquete (o por día); el guía ve su tour, sus clientes, horario y punto de encuentro.
7. El pago se reparte por servicio: 90% al negocio aliado, 10% a Hype, en el momento del pago.

### F7. Alergias y pre-pedido en restaurante (2026-11-09)
1. El turista registra sus **alergias** en su Perfil (por ejemplo, mariscos, gluten, nueces).
2. Al reservar mesa o pedir, las alergias se muestran al restaurante en la reserva y en el pedido, para que la cocina las tenga en cuenta.
3. Con la reserva de mesa, el turista puede **pre-ordenar su comida**: elige los platillos del menú al reservar y paga por adelantado con Wallet.
4. El restaurante recibe el pre-pedido junto con la reserva y lo va preparando, para que esté listo cuando el turista llegue.
5. Al llegar, el turista solo confirma; no vuelve a pedir desde cero.

### F8. Wallet siempre cargado — Fase 1, lanzamiento diciembre 2026 (2026-11-13)

Contexto: Ley de Economía Digital para Pagos Digitales y Electrónicos (DOF 4 nov 2026, en vigor 5 nov 2026). Art. 10: los tres órdenes de gobierno deben aceptar pagos digitales en trámites y servicios. Art. 13: la SHCP define en 15 días hábiles los sectores donde lo digital será el único medio; gasolineras y casetas van primero. La lista sale alrededor del 25–27 de noviembre (aproximado, no fecha segura) y sus reglas después, por eso la Fase 3 no entra en el lanzamiento. **Regla de Pedro: en Hype se ofrece, nunca se impone** — todo es opt-in; el Wallet es una opción para que el turista siempre traiga saldo, no una obligación.

1. **F8.1 Recarga automática:** el turista elige un saldo mínimo y un monto de recarga; cuando el saldo baja del mínimo, el Wallet recarga solo con la tarjeta guardada en Stripe. Tope mensual elegido por el turista; sin tope no hay recarga automática. Se puede apagar en un toque.
2. **F8.2 Alertas de saldo bajo:** aviso cuando el saldo no alcanza la próxima reserva del itinerario, con recarga en un toque.
3. **F8.3 Recarga antes del viaje:** al armar un itinerario, el Concierge sugiere cuánto cargar según el total de reservas y traslados previstos. Solo sugiere; el turista decide el monto.

**Fase 2 (T-13b, después del lanzamiento):** recarga en efectivo en OXXO con código (vigencia y monto exacto; si vence, se genera otro) y carga por SPEI o CoDi. El saldo se acredita solo cuando el pago se confirma; antes queda "pendiente", nunca disponible.
**Fase 3 (T-13c, 2027):** recarga del tag de peaje (TeleVía / IAVE / PASE) desde el Wallet y pago de gasolina con QR con saldo ya cargado. La tarjeta virtual del Wallet queda como futuro, fuera de T-13.

## 5. Catálogo dinámico

- Cada categoría (Tours, Restaurantes, Eventos, Taxi, Playa, Club, Hotel) tiene un interruptor: activa / en prospección / oculta.
- Si no hay proveedor activo en Hoteles, la categoría Hoteles no se muestra al turista.
- La opción de prospectar hoteles sí queda en Admin, para cerrar el trato.
- Encender una categoría sin proveedores activos está prohibido por test.

## 5b. Centros de consumo — taxonomía (2026-11-08, definida con Pedro)

El Feed del turista presenta los servicios en tarjetas por centro de consumo, en 4 categorías:

1. **Alimentos y bebidas:** bares, antros, restaurantes.
2. **Transportación:** taxis, transporte especial.
3. **Alojamiento:** casas, hoteles, apartamentos.
4. **Xperience:** tours, paseos, festivales o eventos especiales.

**Regla de clasificación (ayuda a definirla Pedro, 2026-11-08):** un servicio es Xperience cuando es un evento/tour especial **o** cuando combina dos o más tipos de centro de consumo en una experiencia completa (por ejemplo hospedaje + transporte + comida + actividad), armada con el Concierge. Si es un solo servicio de un solo tipo, va en esa categoría: si es solo alimento y bebida, es bar o restaurante; si es solo un traslado, es transportación. Xperience puede ser un servicio individual o un paquete con agregados de varios centros de consumo.

**Reseñas:** se miden con un símbolo de fuego (🔥), no con estrellas.

**Pedro es el operador Xperience (Hype):** no solo hace eventos en antro, también actividades de jetski, etc. Él arma y vende las experiencias completas; los negocios de actividades son sus aliados (ver §3 y F6).

## 5c. Navegación del turista — Concierge, Wallet, Taxi y calendario flotantes (2026-11-08)

Solo para el rol Turista, la barra de navegación inferior se sustituye por una caja de texto para hablar con el Concierge AI. En la parte superior derecha de la caja van los botones del Wallet: al tocarlos, el Wallet se despliega sobre el Feed en una tarjeta flotante con su información (no cambia de pantalla). En fila horizontal va el botón del Taxi para pedir taxi. El calendario ya no va incrustado en el Feed: pasa a ser un botón que se despliega flotante. Al desplegar la caja de texto, el Concierge se posiciona sobre el Feed; todos los botones reaccionan flotando sobre el Feed. Los demás roles conservan su navegación actual.

## 5d. Productora de eventos — One By Pro (2026-11-08)

- **Productora:** la cuenta One By Pro (productora de eventos de Hype Xperience).
- **Eventos:** sábado **14 de noviembre de 2026** en Tropic y domingo **15 de noviembre de 2026** en Ronin 22. Precio: **$350 cover**.
- **Flyer:** foto limpia sin letras en `marketing/flyer-ronnie-onebypro.png` (original con texto en `user/files/341632_0_s3io.jpg`). Al tocar el evento se muestran las dos fechas y el precio.
- **La reserva se refleja en la productora (One By Pro)**, aunque el evento sea en otro lugar que también tiene cuenta en Hype Xperience (Tropic / Ronin 22).
- **Reserva de mesas y mapa de mesas editable:** además de la opción de usuario, se puede hacer reserva de mesas y diseñar un mapa de mesas editable. Toda la información es editable hasta un día antes del evento.
- **Confirmado por Pedro (2026-11-10):** sábado 14 en Tropic (Av. Costera Miguel Alemán 20, Costa Azul, 16.8456399, -99.8487483) y domingo 15 en Ronin 22 (Escénica 22, Guitarrón, 16.8320406, -99.853315). Ronnie queda fuera de estas dos fechas. Pendiente menor: si Tropic es Ronnie con su nombre anterior o una sede distinta (sin verificar).

## 5e. Mapa de lugares (2026-11-08)

- Vista de Mapa con todos los lugares de Hype Xperience marcados con pines por categoría (Alimentos y bebidas, Transportación, Alojamiento, Xperience, eventos), sobre un mapa real de Acapulco centrado en la bahía. Al tocar un pin se muestra la tarjeta del lugar con su información, reseñas en 🔥 y acciones (reservar, pedir taxi hasta ahí, ver menú o evento). Se abre desde Explorar (vista Lista/Mapa) y con un botón de Mapa en la barra del turista.
- **Ubicaciones verificadas:** Mariscos Rulo's en 16.84911, -99.85405 (Privada Fragata Endeveur, Fracc. Costa Azul, playa, acceso CICI Acapulco).
- **Ronnie Acapulco: ubicación NO verificada** — colocar aproximado sobre la Av. Costera Miguel Alemán, zona Dorada, marcado como aproximado por confirmar (Pedro debe confirmar el punto exacto).

## 6. Diseño — imagen de referencia + sistema "Hype Night"

Referencia única: `341266_0_8jhd.jpg` — composite de 3 pantallas móviles: Discover & Concierge AI, Social Feed & Eventos, Mi Hype Ticket / Reserva.

Sistema completo: `design-system.md` ("Hype Night" v1, 2026-11-08). Resumen obligatorio:

- **Logo oficial:** la maleta azul sola, sin objetos, con la costura horizontal que divide la solapa del cuerpo, con HYPE y XPERIENCE juntos en el centro (HYPE en una línea, XPERIENCE en la otra, bordados en blanco con contorno negro en la costura) y alrededor los demás parches (`icon/hype-maleta-parches.png`): pirámide maya, Ángel, "Who's Crazy?", La Quebrada (parche circular con la silueta del clavadista saltando de cabeza sobre el precipicio al agua, sin aletas en los pies, fiel a la imagen de referencia que mandó Pedro), la Banana de Acapulco bordada sin círculo, un jetski bordado sin círculo, un sol con rayos y un trueno (rayo amarillo bordado), un bocho de taxi azul de Acapulco (Volkswagen Beetle azul con blanco y letrero TAXI). El logo de Afterlife Zamna fue quitado de la maleta el 2026-11-08 por pedido de Pedro. Secundario: H dorada (`icon/hype-xperience-icon-1024.png`) para icono del sistema.
- **La maleta con parches en la app:** solo en la pantalla de carga, en el icono de la app y en la pantalla de elección Registro / Inicio de sesión. No en el encabezado ni en Perfil. La pantalla de carga no muestra nada más que solo la maleta con parches: sin barra de carga y sin letras (2026-11-08). La pantalla de carga se muestra cada vez que se cambia el rol de usuario, y la maleta va un poco más grande (2026-11-08).
- **Tipografía (2026-11-08):** todas las letras de la app usan la tipografía del título de la app en la parte superior izquierda del encabezado — esa es la tipografía que quiere Pedro.
- **Tema oscuro tipo Super AMOLED (2026-11-08):** fondo negro puro #000000, superficies en negro muy oscuro, texto blanco, acentos dorados intactos. El tema claro no cambia.
- **Autenticación (2026-11-08, referencia `user/files/341627_1_ka8w.jpg`; separada en dos puertas 2026-11-10, Pedro):** después de la carga viene la pantalla de autenticación como la imagen: fondo negro, logo centrado, HYPE en negrita, XPERIENCE fina con espaciado, LOG IN, campos NAME / EMAIL y PASSWORD en tarjeta oscura, botón blanco LOG IN, FORGOT PASSWORD?; antes de los datos hay una pantalla de elección Registro o Inicio de sesión (ahí también se muestra la maleta con parches) y de puerta: **Usuarios** o **Negocios**. En la puerta de Usuarios solo se registra o inicia sesión como turista, sin ver las categorías de negocio; en la puerta de Negocios se elige la categoría del negocio (uno de los 4 centros) y se piden los datos del negocio. Tipografía de esa imagen (HYPE negrita, XPERIENCE fina con espaciado, etiquetas en mayúsculas con espaciado), sustituyendo el hexágono dorado por la maleta.
- **Calendario simplificado (Feed, 2026-11-08):** sin botones de Mes y Semana; botones circulares con flechas (⬆️ para pasar de mes a semana y viceversa, ⬅️ ➡️ para moverse entre periodos); en semana solo se muestra el día y el mes; en mes, solo el mes actual cambiando, sin rango "semana de tal a tal"; sin leyenda de "vista compartida".
- **Tipografía:** Montserrat para todo el texto de la app: títulos, cuerpo, botones, etiquetas, códigos Hype Ticket, montos del Wallet y fechas (en el editor, JetBrains Mono solo para código fuente).
- **Los parches son solo el logo:** cada parche representa una categoría (La Quebrada = Experiencias/Tours, Pirámide = Cultura, Ángel = Perfil VIP/Hype Black, Who's Crazy? = Vida nocturna/Clubes, ONE BY PRO = Deportes/Actividades pro), pero la sección "La maleta es el flujo" fue quitada de la app el 2026-11-08 por pedido de Pedro: ya no hay riel de parches en el Feed ni "Explorar por parche".

Tokens:
- Fondo: negro oscuro.
- Acento: dorado / ámbar.
- Texto: blanco, gris claro para secundario.
- Tarjetas: redondeadas, con foto hero arriba.
- Botón principal: dorado, texto oscuro.
- Barra inferior del turista: caja de texto del Concierge AI (Feed/Explorar/Tickets/Calendario a su izquierda, Taxi y Wallet a la derecha). Los demás roles conservan su barra inferior flotante. Perfil está arriba a la derecha, con avatar y rol, y abre tarjeta flotante.
- Calendario: solo en Feed, botones circulares con flechas (sin botones de Mes y Semana); en semana solo se muestra el día y el mes; en mes, solo el mes actual.

Todos los demás mockups son contenido a re-diseñar con este sistema, no estilo a copiar.

## 7. Datos — entidades

- `User`: id, nombre, email, teléfono, rol, tema (oscuro / claro), socialLinks (whatsapp, facebook, instagram), bank (CLABE últimos 4, titular), allergies (lista de alergias, visible para restaurantes en reservas y pedidos).
- `Provider`: id, userId, tipo, nombre, descripción, fotos, activo.
- `Service`: id, providerId, categoría, título, precio MXN, cupo, horario, fotos, activo.
- `Booking`: id, userId, serviceId, fecha, estado (pendiente / pagada / completada / cancelada), ticketCode, walletTxId, packageId (nulo si no es parte de un paquete), allergies (copia de las alergias del turista al momento de reservar).
- `Experience` (paquete Xperience, creado por Hype/Pedro): id, hypeUserId, título, días/itinerario (lista de servicios con día y hora), precio total MXN, activo.
- `SubBooking` (sub-reserva de un paquete para un negocio aliado): id, packageBookingId, providerId, serviceId, fecha, hora, personas, estado (pendiente / confirmada / completada / cancelada), punto de encuentro.
- `Guide` (guía de turistas): id, userId, nombre, teléfono, tours asignados (experienceIds con fecha).
- `ConciergeAction`: id, tipo (reserva / cambio / propuesta), detalle, estado (pendiente de verificación / aprobado / rechazado), creado por Concierge, aprobado por (Pedro).
- `Wallet`: userId, saldo MXN.
- `WalletTx`: id, fromUserId, toUserId, bookingId, monto, tipo (recarga / pago / retiro), estado, fecha.
- `Trip`: id, touristId, driverId, origen, destino, estado, precio, whatsappThread.
- `Order`: id, bookingId, clubId, items, total, estado (pendiente / preparando / lista / entregada), preorder (true si se pidió junto con la reserva de mesa para que esté listo al llegar), allergyNotes.
- `Review`: id, serviceId, userId, rating, texto, fecha.

Reglas de seguridad: un usuario solo lee / escribe sus propios datos y los de su negocio. Staff solo lee tickets. Nadie lee CLABE completa, solo últimos 4.

## 8. Reglas de negocio

- Pago prepago con Wallet es obligatorio para reservar. Sin saldo, no hay reserva.
- Si un viaje se cancela antes de ser aceptado por un taxista, se reembolsa el 100% a la Wallet del turista (T-07).
- Taxis amarillos: pasaje $25 MXN por viaje en todas sus rutas (Zapata, Vacacional, Rena, Coloso, Colosio, Costera); reportan su ubicación en vivo siempre.
- Regla cruzada azul/amarillo: un amarillo vacío y más cercano que el azul más cercano puede aceptar un viaje privado cuando se le notifica.
- Alimentos y bebidas puede crear eventos propios aparte de Xperience (opción de carga de evento en su panel).
- El menú/catálogo de cada negocio tiene opción de carga de imágenes del dueño (fotos del lugar y de sus platillos/servicios).
- Comisión Hype: 10% por cada reserva pagada. De cada pago, 90% va a la Wallet del prestador y 10% queda para Hype. Ejemplo: reserva de $1,000 → prestador $900, Hype $100. La comisión se descuenta en el momento del pago, no en el retiro.
- Wallet siempre cargado (2026-11-13): todo opt-in; ninguna recarga automática sin que el turista la active y fije su tope. La recarga no tiene comisión de Hype. Hype ofrece, nunca impone.
- Doble pago de la misma reserva está prohibido.
- Retiro solo con CLABE guardada.
- Ticket QR: un solo uso válido por entrada, salvo que el servicio diga lo contrario.
- Precios en MXN, netos, con lo incluido explícito.
- Datos de ejemplo en la demo no son datos reales: La Quebrada $700, Baby'O VIP $14,500, etc., son de los mockups. En producción solo entran proveedores y precios reales confirmados por Pedro.
- Reserva de paquete genera sub-reservas: cada negocio aliado recibe la suya en su panel y ve solo su servicio, nunca el precio total del paquete ni a los otros negocios.
- Sub-reservas directas (2026-11-13): la sub-reserva llega al aliado sin que tenga que confirmarla; si hay conflicto, lo avisa a Pedro/Hype y se reasigna.
- Guías con cuenta propia (2026-11-13): la cuenta del guía la crea Pedro/Hype, sin auto-registro; el guía ve solo sus tours asignados.
- Alergias: el turista las registra en Perfil y se muestran al restaurante en cada reserva y pedido.
- Pre-pedido: pedir la comida junto con la reserva de mesa se paga por adelantado con Wallet; el restaurante la prepara para la llegada del turista.
- Concierge: puede responder y gestionar cuando Pedro no está, pero ninguna acción que comprometa reserva, precio o disponibilidad se ejecuta sin el visto bueno de Pedro (estado pendiente de verificación).
- Meta: app de Meta Developers tipo **Negocios**, no Consumidor. El tipo no se cambia después de crearla. ID y secreto de la app van en Firebase Auth > Facebook, nunca en el chat ni en el código. La URI de redirección OAuth de Firebase va en Meta > Facebook Login.

## 9. Stack recomendado

- Móvil: Expo + React Native + TypeScript, un solo código iOS / Android.
- Backend: Firebase — Auth, Firestore, Storage, Functions, App Check.
- Login social: Firebase Auth con Facebook (Meta app Negocios). WhatsApp e Instagram son enlaces y, en producción, API de Meta con verificación de empresa.
- Mapas: Google Maps.
- Pagos Wallet: recarga con Stripe en sandbox primero, luego producción. El saldo interno es ledger propio, con movimientos firmados. **Stripe sandbox (2026-11-09, Pedro):** la clave publicable de prueba va solo en el cliente (variable `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`); la clave secreta de prueba va SOLO en el servidor (config de Firebase Functions / `.env` del servidor), nunca en el repo, nunca en el spec y nunca en el chat. Las claves las emite Pedro desde su panel de Stripe; la secreta se rota si se expone.
- Repo: GitHub, monorepo `app/` móvil, `admin/` web, `functions/` backend. Ramas `main`, `dev`, una rama por tarea.

## 10. TDD — criterios de aceptación y tests

Escribir el test en rojo antes del código, para cada flujo.

- T01 Registro por rol: dado un registro como Restaurante, entonces su dashboard es el de restaurante y no ve el de turista.
- T02 Catálogo dinámico: dada categoría Hotel sin proveedor activo, entonces no aparece en Feed del turista.
- T03 Wallet sin saldo: dado turista con $0 y reserva de $700, entonces el pago se rechaza con "Saldo insuficiente".
- T04 Wallet con saldo: dado turista con $2,000 y reserva de $700, entonces saldo queda $1,300, prestador recibe $630 (90%) y Hype $70 (10% de comisión).
- T05 Doble pago: dado reserva ya pagada, entonces el segundo intento de pago se rechaza.
- T06 Retiro sin CLABE: dado prestador sin CLABE, entonces el retiro exige guardarla primero.
- T07 QR: dado ticket ya escaneado, entonces el segundo escaneo se rechaza.
- T08 Staff: dado staff de club, entonces no puede ver pagos ni finanzas.
- T09 Concierge: dado catálogo sin hotel, entonces Aura no recomienda hoteles.
- T10 Calendario: dado turista con reserva y evento, entonces en Feed la reserva se ve dorada y el evento azul; fuera de Feed no hay calendario.
- T11 Tema: dado cambio a claro en Perfil, entonces el tema persiste al reabrir.
- T12 Taxi: dado viaje aceptado, entonces aparece el enlace de seguimiento por WhatsApp.
- T13 Paquete y sub-reservas: dado un turista que reserva un paquete de Hype con 3 servicios de aliados, entonces cada aliado recibe exactamente una sub-reserva con fecha, hora, personas y servicio.
- T14 Aislamiento del aliado: dada una sub-reserva, entonces el negocio ve solo su servicio y no el precio total del paquete ni a los otros negocios.
- T15 Armar experiencia: dado Pedro que arma una experiencia con hotel + transporte + comida + actividad, entonces se publica como un solo producto reservable con el precio total real (suma de los servicios).
- T16 Guía asignado: dado Pedro que asigna un guía a un paquete, entonces el guía ve su tour, sus clientes, horario y punto de encuentro; otros guías no lo ven.
- T17 Concierge pendiente de verificación: dado el Concierge que propone una reserva mientras Pedro no está, entonces la acción queda pendiente de verificación y no se ejecuta hasta que Pedro la aprueba.
- T18 Alergias: dado un turista con alergia registrada que reserva en un restaurante, entonces el restaurante ve la alergia en la reserva y en el pedido.
- T19 Pre-pedido: dado un turista que reserva mesa y pre-ordena platillos, entonces el restaurante recibe el pedido junto con la reserva en estado preparando y el pago ya está hecho por adelantado con Wallet.
- T20 Panel de mando Hype: dado el rol Hype de Pedro, entonces ve todos los usuarios registrados, todos los negocios y todas las reservas/clientes; dado un proveedor, entonces ve solo su negocio.
- T21 Radar azul: dado un turista que pide taxi privado, entonces el radar marca el taxi azul más cercano con distancia y ETA.
- T22 Colectivo amarillo: dado un usuario que consulta amarillos, entonces ve la ruta, la ubicación en vivo, el tiempo de llegada y el pasaje $25 en todas las rutas.
- T23 Regla cruzada: dado un pedido privado donde el amarillo más cercano está más cerca que el azul más cercano y va vacío, entonces el amarillo es notificado y puede aceptar el viaje como privado.
- T24 Carga de imágenes y eventos: dado un negocio de Alimentos y bebidas, entonces puede cargar imágenes a su menú y crear un evento propio visible en el Feed; Xperience sigue siendo solo de Pedro.
- T25 Autenticación separada: dado un turista que se registra por la puerta de Usuarios, entonces no ve las categorías de negocio; dado un negocio que se registra por la puerta de Negocios, entonces elige su categoría (uno de los 4 centros) y su dashboard es el de esa categoría.
- T26 Recarga automática (T-13 Fase 1): dado saldo bajo del mínimo con tope mensual disponible, entonces se recarga el monto elegido; dado tope mensual alcanzado, entonces no se recarga y se avisa.
- T27 Alerta de saldo bajo (T-13 Fase 1): dado saldo insuficiente para la próxima reserva, entonces se muestra la alerta con recarga en un toque.
- T28 Pre-trip preload (T-13 Fase 1): dado un itinerario con total estimado, entonces el Concierge sugiere ese monto y el turista puede aceptarlo o cambiarlo.
- T29 OXXO (T-13b): dado un código generado y pagado en efectivo, entonces el saldo se acredita por el monto exacto; dado un código vencido, entonces no se acredita nada y se ofrece generar otro.
- T30 SPEI/CoDi (T-13b): dada una transferencia confirmada, entonces el saldo se acredita; dada una transferencia no confirmada, entonces la recarga queda pendiente, no disponible.
- T31 Tag de peaje (T-13c): dado saldo suficiente, entonces la recarga del tag se descuenta del Wallet y queda registrada.
- T32 Gasolina QR (T-13c): dado saldo suficiente, entonces el pago con QR se descuenta del Wallet y genera comprobante.

## 11. ODD — observabilidad

Logs obligatorios:
- `wallet.recharge`, `wallet.payment`, `wallet.payment_rejected`, `wallet.withdrawal`
- `wallet.autorecharge`, `wallet.autorecharge_blocked`, `wallet.low_balance_alert`, `wallet.preload_suggested` (recarga automática y precarga, T-13 Fase 1)
- `wallet.oxxo_code_generated`, `wallet.oxxo_paid`, `wallet.oxxo_expired`, `wallet.spei_pending`, `wallet.spei_confirmed`, `wallet.toll_topup`, `wallet.fuel_qr_paid` (T-13b/T-13c)
- `booking.created`, `booking.paid`, `booking.double_payment_blocked`
- `ticket.scanned`, `ticket.rejected`
- `order.created`, `order.paid` (pedido en mesa, T-06)
- `trip.requested`, `trip.accepted`, `trip.location_updated`, `trip.completed`, `trip.cancelled` (viaje de taxi, T-07)
- `profile.theme_updated` (cambio de tema en Perfil, T-08)
- `concierge.no_service_found`, `concierge.hallucination_blocked` (Concierge sin servicio / anti-alucinación, T-09)
- `experience.created`, `experience.published` (experiencia armada por Hype, T-11)
- `subbooking.created`, `subbooking.confirmed` (sub-reserva de paquete para un aliado, T-11)
- `guide.assigned` (guía asignado a un paquete, T-11)
- `concierge.pending_verification`, `concierge.action_approved`, `concierge.action_rejected` (Concierge con visto bueno de Pedro, T-11)
- `allergy.flagged` (alergia mostrada al restaurante, T-11)
- `preorder.created`, `preorder.ready` (pre-pedido con reserva de mesa, T-11)
- `auth.role_assigned`, `auth.login_failed`

Métricas:
- Reservas pagadas por día, por categoría.
- Pagos rechazados por saldo insuficiente.
- Tiempo de aceptación de viaje por taxista.
- Tickets escaneados vs emitidos.
- Errores de pago y de QR por hora.

Alertas:
- Pago cobrado sin reserva.
- Retiro mayor al saldo.
- Caída de login con Facebook.
- Error de Concierge inventando un servicio.

## 12. Teamwork — tareas

| ID | Tarea | Rama | Revisor |
|---|---|---|---|
| T-01 | Repo, Firebase, diseño base imagen 0 | `setup/repo` | Código + UI |
| T-02 | Auth por rol + RBAC | `feat/auth-roles` | Seguridad |
| T-03 | Catálogo dinámico + onboarding proveedor | `feat/catalogo` | UX |
| T-04 | Turista: descubrir, reservar, Tickets | `feat/turista` | UX + UI |
| T-05 | Wallet: recarga, pago, retiro | `feat/wallet` | Seguridad + Código |
| T-06 | Club: staff, escáner QR, pedido en mesa | `feat/club` | Seguridad |
| T-07 | Taxi: viaje + WhatsApp | `feat/taxi` | UX |
| T-08 | Calendario Feed semanal / mensual + Perfil flotante | `feat/calendario-perfil` | UI |
| T-09 | Concierge Aura solo con catálogo real | `feat/concierge` | Seguridad + UX |
| T-10 | QA, TestFlight / Play Internal, piloto cerrado | `release/piloto` | Todos |
| T-11 | Hype control: panel de mando (todos los usuarios y negocios), Armar una nueva experiencia, sub-reservas a aliados, guías de turistas, Concierge con visto bueno (pendiente de verificación), alergias y pre-pedido en restaurante | `feat/hype-control` | Seguridad + UX |
| T-12 | Pantallas UI de la app sobre los servicios (detalle en §12b) | `feat/ui-screens` | UI + UX |
| T-13 | Wallet siempre cargado — Fase 1: recarga automática con tope, alertas de saldo bajo, precarga sugerida por Concierge (F8, T26–T28) | `feat/wallet-topup` | Seguridad + Código |
| T-13b | Wallet — Fase 2: OXXO + SPEI/CoDi (F8.4–F8.5, T29–T30), después del lanzamiento | `feat/wallet-topup` | Seguridad + Código |
| T-13c | Wallet — Fase 3: tag de peaje + gasolina QR (F8.6–F8.7, T31–T32), 2027 | `feat/wallet-topup` | Seguridad + Código |

Cada tarea: una rama / worktree, tests en rojo primero, revisión en paralelo, merge solo con tests en verde. Pagos, auth y datos personales pasan por gatekeeper humano: Pedro.

### 12b. T-12 — Pantallas UI: alcance detallado (2026-11-09)

**Objetivo:** construir las pantallas reales y visibles de la app sobre los servicios ya hechos en T-01–T-10, usando el demo de Muse (slug `hype-xperience`, v37) como referencia visual. Replicar su comportamiento, no copiar su código. No reescribir la lógica de servicios, Wallet, QR ni Concierge: las pantallas consumen los servicios existentes.

**Pantallas:**
- Comunes: Splash (solo la maleta con parches, sin barra ni letras; fondo según el tema); Autenticación separada en dos puertas — Usuarios (solo turista, sin ver categorías de negocio) y Negocios (elige su categoría de los 4 centros + datos del negocio); Perfil flotante (datos, roles, tema oscuro/claro persistido).
- Turista: Feed por 4 centros de consumo con reseñas 🔥, búsqueda por plan/destino/fecha/personas y modo invitado; Explorar Lista/Mapa con filtros (zona, precio máx., orden, solo favoritos); ficha de servicio (galería, anfitrión, qué incluye, sello de proveedor verificado solo en cuentas reales, precio desglosado, disponibilidad, política de cancelación, cancelar con reembolso, reseñas solo de reservas pagadas, favoritos, chat dentro de la app); Tickets (QR de un solo uso, ubicación del lugar con Agendar viaje y Cómo llegar); Wallet (recarga, saldo, retiro con CLABE últimos 4); Calendario solo en Feed (dorado reservas, azul eventos, navegación simplificada); Concierge Aura (solo catálogo real, nunca inventa, escala a humano; acciones que comprometen quedan pendientes de verificación de Pedro); Taxi (mapa tipo Uber con bocho azul/blanco, radar del azul más cercano con distancia y ETA, amarillos en vivo por sus 6 rutas con pasaje $25, regla cruzada amarillo-vacío-más-cercano, ficha del taxista).
- Paneles de negocio: Alimentos y bebidas (menú con fotos y carga de imágenes, reservas, alergias, pre-pedido, crear evento propio); Transportación (viajes, mapa, Wallet); Alojamiento (habitaciones); Xperience / Hype (panel de mando: todos los usuarios, negocios, reservas y clientes; Armar una nueva experiencia; sub-reservas; asignar guías; aprobar/rechazar acciones del Concierge); Staff de club (escáner QR, hostess); Guía (solo sus tours asignados).

**Diseño:** sistema "Hype Night" (`design-system.md`): Super AMOLED, Montserrat, dorado #d4af37, Liquid Glass translúcido en ambos temas; el demo es la referencia visual exacta.

**Reglas:** TDD con tests en rojo primero por pantalla (navegación, render, gating por rol y autenticación separada T25); ODD con los logs de §11; piloto cerrado (TestFlight + Play Internal, sin publicación pública); Pedro es gatekeeper humano de pagos, auth y datos personales. Las 40 cuentas del demo son datos de demostración (reales con ubicación verificada + ejemplos); en producción el alta de proveedores la hace Admin Hype, y los accesos demo (`@hypexperience.demo`) no existen en producción.

## 13. Prompts para Antigravity

Prompt base, para cada tarea:

> Sigue este spec.md al pie de la letra. No inventes funcionalidades fuera del alcance. Si algo del spec es ambiguo, pregúntame antes de programarlo. Primero escribe el test en rojo, luego el código mínimo para pasarlo, luego refactoriza.

Prompt T-01:

> Crea el repo y el scaffold con Expo + React Native + TypeScript y Firebase. Aplica el diseño de la imagen 0: fondo negro, dorado, tarjetas redondeadas, barra flotante. Sin datos inventados, solo el scaffold y la pantalla de registro por rol.

Prompt T-05:

> Implementa la Wallet según la sección 4 F2 y los tests T03-T06. Recarga, pago prepago, rechazo por saldo insuficiente, rechazo por doble pago, y retiro solo con CLABE guardada. Sin pagos reales todavía, usa sandbox.

## 14. Preguntas abiertas — no programar hasta que Pedro responda

1. Proveedor de recarga: Stripe o Mercado Pago, o los dos. **Decidido por Pedro 2026-11-08: Stripe.** Claves de prueba (sandbox) entregadas por Pedro 2026-11-09 — los valores NO se guardan en el spec: la publicable va en el cliente, la secreta solo en el servidor (ver §8).
2. Lista real de proveedores para el piloto: nombre, categoría, contacto. **Primer piloto confirmado 2026-11-08: Mariscos Rulo's, Restaurante Bar, en la playa en el acceso del CICI Acapulco, categoría Alimentos y bebidas; menú completo con precios reales en `providers/mariscos-rulos-menu.md`.** Productora de eventos: One By Pro (sábado 14 nov 2026 en Tropic, domingo 15 nov 2026 en Ronin 22, $350 cover). Pedro es proveedor Xperience (eventos + jetski). **Cuentas registradas en la demo 2026-11-08 (al menos 2 por categoría; reales: Rulo's y One By Pro; las demás son de ejemplo para sustituir por proveedores reales):** Alimentos y bebidas — Mariscos Rulo's y Ronnie Acapulco (bar/antro); Transportación — Mario Torres (taxista, bocho azul) y Costa Azul Shuttle (van); Alojamiento — Hotel Emporio Acapulco y Casa Las Brisas; Xperience — One By Pro y Aqua Xperience (jetski, banana, buceo, lancha).
3. Precios reales por servicio, o se usan los de los mockups solo como ejemplo.
4. Comisión de Hype por reserva, o el prestador recibe el 100%. **Decidido por Pedro 2026-11-08: 10% por reserva. Hype retiene 10%, el prestador recibe 90%.** **Decidido por Pedro 2026-11-08: 10% por reserva. Hype retiene 10%, el prestador recibe 90%.**
5. ¿Hotel entra en MVP o queda en Fase 2, como está en este spec? **Aclarado por Pedro 2026-11-08: la opción del hotel era solo un ejemplo de los roles de usuario en general — no es una decisión pendiente. El rol Alojamiento existe como categoría (casas, hoteles, apartamentos) y los proveedores concretos se dan de alta cuando lleguen.**
6. ¿Los negocios aliados confirman cada sub-reserva que les cae de un paquete, o les llega directa y ya está? **Decidido por Pedro 2026-11-13: les llega directa, sin confirmar.** Si un aliado tiene un conflicto, lo avisa a Pedro/Hype y se reasigna, pero la reserva ya pagada no queda esperando confirmación.
7. ¿Los guías de turistas necesitan cuenta propia en la app, o Pedro los asigna y les avisa por fuera? **Decidido por Pedro 2026-11-13: tienen su propia cuenta**, creada por Pedro/Hype (sin auto-registro), y ven solo sus tours asignados con sus clientes, horario y punto de encuentro.
8. Eventos One By Pro 14–15 nov: ¿sábado 14 en Tropic y domingo 15 en Ronin 22? ¿Ronnie queda fuera, o Tropic es Ronnie con su nombre anterior? **Decidido por Pedro 2026-11-10: sábado 14 en Tropic, domingo 15 en Ronin 22; Ronnie queda fuera de estas dos fechas.** (Si Tropic es Ronnie con su nombre anterior, sin verificar.)
9. Palao Island Club: ¿Xperience o Alimentos y bebidas? (Propuesta 2026-11-09: Xperience, como aliado de playa + restaurante + actividades; pendiente de Pedro.)
10. Lugares candidatos a proveedores reales (19 enlaces verificados en Google Maps, 2026-11-09; clasificación propuesta pendiente de Pedro): Alimentos y bebidas — Tropic, Ronin 22, Rompe Olas, Meztizza, El Caldero Wizard's Coffee, Pozolería Lulú, Rudy's Grill, Club La Concha, Muna Acapulco, Surf Tako; Alojamiento — Banyan Tree Cabo Marqués; Xperience (aliados) — Palao Island Club, Swiss Divers Association, Yates Fiesta & Bonanza, Blue Water Sport Fishing, Yates y Lanchas Fondo de Cristal, Ohana Surf Club, Bonfil Surf School & Shop; Transportación — ninguno aún; Playa Mimosa es playa pública (punto de interés, sin rol de negocio). **Registrados en la demo v33 (2026-11-09) como 16 cuentas (18 reales en total con Rulo's y One By Pro); Playa Mimosa confirmada por Pedro como NO negocio — solo lugar en el mapa, no se cuenta.**
11. Taxis amarillos: pasaje $25 MXN por viaje en todas las rutas y regla cruzada con los azules. **Decidido por Pedro 2026-11-09.**
12. Alimentos y bebidas crea eventos propios aparte de Xperience. **Decidido por Pedro 2026-11-09.**
13. Wallet siempre cargado (T-13): ¿qué fases van para el lanzamiento de diciembre? **Decidido por Pedro 2026-11-13: Fase 1 sola para diciembre** (recarga automática con tope, alertas, precarga). Fase 2 (OXXO + SPEI/CoDi) como T-13b después del lanzamiento; Fase 3 (tag de peaje + gasolina QR) como T-13c en 2027, cuando salgan la lista de la SHCP (alrededor del 25–27 nov, aprox.) y sus reglas.

## 15. Demo de referencia

Demo en Muse, slug `hype-xperience`, con registro por rol, Wallet, calendario en Feed, Perfil flotante arriba, tema oscuro / claro, y Meta a nivel demo (enlaces guardados, sin API real). Replicar su comportamiento, no copiar su código. La demo no es la app de producción.
