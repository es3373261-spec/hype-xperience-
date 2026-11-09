# Hype Xperience — Spec SDD / TDD / ODD
## Para Antigravity CLI / Teamwork

- **Fecha:** 2026-11-07 / 2026-11-08
- **Estado:** Borrador v1 para revisión de Pedro. No es código, es el plano.
- **Fuente:** 29 mockups de Pedro, demo interactiva en Muse (slug `hype-xperience`), y sus decisiones en chat.
- **Regla de oro para Antigravity:** seguir este spec al pie de la letra. No inventar funcionalidades fuera del alcance. Si algo del spec es ambiguo, preguntar a Pedro antes de programarlo.

## 1. Objetivo

App que gestiona y conecta todos los servicios turísticos de Acapulco en un solo lugar, en modo moderno, para lanzar en diciembre de 2026, la temporada más fuerte del año.

Problema principal que ataca: desconfianza en los pagos. Hay prestadores que brindaron el servicio y luego les cancelaron la transferencia. Por eso el pago es prepago con Wallet, no promesa de pago después.

## 2. Alcance

### MVP — diciembre 2026
- Registro y login por rol, con Firebase Auth.
- Turista: descubrir, Concierge, reservar tours / restaurantes / eventos, pedir taxi, Hype Ticket con QR, Wallet.
- Restaurante: dashboard, menú con fotos, reservas, reseñas.
- Club: reserva de mesa con botellas, mesa sin botella o solo entrada; staff con permiso limitado para escanear boletos y hostess; pedido de bebidas en mesa desde la carta precargada.
- Taxista individual (sin flota): recibir viajes, aceptar, seguimiento por WhatsApp.
- Wallet prepago + pago a prestador + retiro a banco.
- Calendario solo en Feed, vista semanal / mensual con un clic.
- Perfil arriba, tarjeta flotante con datos y roles. Barra inferior del turista: caja de texto del Concierge AI (los demás roles conservan su barra inferior flotante). Tema oscuro / claro editable en Perfil.
- Catálogo dinámico: una categoría sin proveedor activo no se muestra.

### Fase 2 — después del lanzamiento
- Hotel: reserva de habitaciones.
- Playa / actividades: sillas, jetski, banana, buceo, paracaídas, con cupo por horario.
- Pedido en mesa completo con cocina / barra, analytics VIP, bodega, telemetría de chóferes.
- Split the Hype completo entre 4 personas.

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
| Xperience | Panel, Reservas, Eventos, Catálogo | Crear tours, paseos, festivales y eventos especiales; armar paquetes combinando centros de consumo; productora de eventos (One By Pro); reserva de mesas y mapa de mesas editable | — |
| Staff de club (sub-rol de Alimentos y bebidas) | Escáner, Hostess | Escanear boletos, acreditar entrada, hostess | Ver pagos, menú, finanzas, crear staff |
| Admin Hype | Todos los paneles | Onboarding de proveedores, encender / apagar categorías, soporte | Cobrar fuera de Wallet |

Los roles anteriores se agrupan en estos 5: restaurante y club → Alimentos y bebidas; taxista → Transportación; hotel → Alojamiento; playa/actividades y productora → Xperience. Pedro es un proveedor Xperience.

**Taxi tipo Uber:** al pedir el taxi se usa el mapa tipo Uber (punto de recogida, el bocho moviéndose y el destino); el botón de taxi y el marcador del taxi en el mapa son la silueta del bocho de Acapulco blanco y azul (`icon/bocho-taxi-silhouette.png`, PNG con fondo transparente).

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

### F5. Concierge Aura
- Chat que solo recomienda servicios reales del catálogo activo.
- Usa datos del perfil y requerimientos del turista.
- No inventa servicios, precios ni disponibilidad. Si no hay servicio, lo dice y escala a host humano.

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

**Pedro es un proveedor Xperience:** no solo hace eventos en antro, también actividades de jetski, etc. Su cuenta es de tipo Xperience entre los distintos tipos de centro de consumo.

## 5c. Navegación del turista — Concierge, Wallet, Taxi y calendario flotantes (2026-11-08)

Solo para el rol Turista, la barra de navegación inferior se sustituye por una caja de texto para hablar con el Concierge AI. En la parte superior derecha de la caja van los botones del Wallet: al tocarlos, el Wallet se despliega sobre el Feed en una tarjeta flotante con su información (no cambia de pantalla). En fila horizontal va el botón del Taxi para pedir taxi. El calendario ya no va incrustado en el Feed: pasa a ser un botón que se despliega flotante. Al desplegar la caja de texto, el Concierge se posiciona sobre el Feed; todos los botones reaccionan flotando sobre el Feed. Los demás roles conservan su navegación actual.

## 5d. Productora de eventos — One By Pro (2026-11-08)

- **Productora:** la cuenta One By Pro (productora de eventos de Hype Xperience).
- **Eventos:** dos eventos la próxima semana en **Ronnie Acapulco** (donde era Believe y Tropic): sábado **14 de noviembre de 2026** y domingo **15 de noviembre de 2026**. Precio: **$350 cover**.
- **Flyer:** foto limpia sin letras en `marketing/flyer-ronnie-onebypro.png` (original con texto en `user/files/341632_0_s3io.jpg`). Al tocar el evento se muestran las dos fechas y el precio.
- **La reserva se refleja en la productora (One By Pro)**, aunque el evento sea en otro lugar que también tiene cuenta en Hype Xperience (Ronnie).
- **Reserva de mesas y mapa de mesas editable:** además de la opción de usuario, se puede hacer reserva de mesas y diseñar un mapa de mesas editable. Toda la información es editable hasta un día antes del evento.

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
- **Autenticación (2026-11-08, referencia `user/files/341627_1_ka8w.jpg`):** después de la carga viene la pantalla de autenticación como la imagen: fondo negro, logo centrado, HYPE en negrita, XPERIENCE fina con espaciado, LOG IN, campos NAME / EMAIL y PASSWORD en tarjeta oscura, botón blanco LOG IN, FORGOT PASSWORD?; antes de los datos hay una pantalla de elección Registro o Inicio de sesión (ahí también se muestra la maleta con parches); al ir a Inicio de sesión se despliegan las opciones de roles. Tipografía de esa imagen (HYPE negrita, XPERIENCE fina con espaciado, etiquetas en mayúsculas con espaciado), sustituyendo el hexágono dorado por la maleta.
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

- `User`: id, nombre, email, teléfono, rol, tema (oscuro / claro), socialLinks (whatsapp, facebook, instagram), bank (CLABE últimos 4, titular).
- `Provider`: id, userId, tipo, nombre, descripción, fotos, activo.
- `Service`: id, providerId, categoría, título, precio MXN, cupo, horario, fotos, activo.
- `Booking`: id, userId, serviceId, fecha, estado (pendiente / pagada / completada / cancelada), ticketCode, walletTxId.
- `Wallet`: userId, saldo MXN.
- `WalletTx`: id, fromUserId, toUserId, bookingId, monto, tipo (recarga / pago / retiro), estado, fecha.
- `Trip`: id, touristId, driverId, origen, destino, estado, precio, whatsappThread.
- `Order`: id, bookingId, clubId, items, total, estado.
- `Review`: id, serviceId, userId, rating, texto, fecha.

Reglas de seguridad: un usuario solo lee / escribe sus propios datos y los de su negocio. Staff solo lee tickets. Nadie lee CLABE completa, solo últimos 4.

## 8. Reglas de negocio

- Pago prepago con Wallet es obligatorio para reservar. Sin saldo, no hay reserva.
- Si un viaje se cancela antes de ser aceptado por un taxista, se reembolsa el 100% a la Wallet del turista (T-07).
- Comisión Hype: 10% por cada reserva pagada. De cada pago, 90% va a la Wallet del prestador y 10% queda para Hype. Ejemplo: reserva de $1,000 → prestador $900, Hype $100. La comisión se descuenta en el momento del pago, no en el retiro.
- Doble pago de la misma reserva está prohibido.
- Retiro solo con CLABE guardada.
- Ticket QR: un solo uso válido por entrada, salvo que el servicio diga lo contrario.
- Precios en MXN, netos, con lo incluido explícito.
- Datos de ejemplo en la demo no son datos reales: La Quebrada $700, Baby'O VIP $14,500, etc., son de los mockups. En producción solo entran proveedores y precios reales confirmados por Pedro.
- Meta: app de Meta Developers tipo **Negocios**, no Consumidor. El tipo no se cambia después de crearla. ID y secreto de la app van en Firebase Auth > Facebook, nunca en el chat ni en el código. La URI de redirección OAuth de Firebase va en Meta > Facebook Login.

## 9. Stack recomendado

- Móvil: Expo + React Native + TypeScript, un solo código iOS / Android.
- Backend: Firebase — Auth, Firestore, Storage, Functions, App Check.
- Login social: Firebase Auth con Facebook (Meta app Negocios). WhatsApp e Instagram son enlaces y, en producción, API de Meta con verificación de empresa.
- Mapas: Google Maps.
- Pagos Wallet: recarga con Stripe / Mercado Pago en sandbox primero, luego producción. El saldo interno es ledger propio, con movimientos firmados.
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

## 11. ODD — observabilidad

Logs obligatorios:
- `wallet.recharge`, `wallet.payment`, `wallet.payment_rejected`, `wallet.withdrawal`
- `booking.created`, `booking.paid`, `booking.double_payment_blocked`
- `ticket.scanned`, `ticket.rejected`
- `order.created`, `order.paid` (pedido en mesa, T-06)
- `trip.requested`, `trip.accepted`, `trip.location_updated`, `trip.completed`, `trip.cancelled` (viaje de taxi, T-07)
- `auth.role_assigned`, `auth.login_failed`
- `concierge.no_service_found`

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

Cada tarea: una rama / worktree, tests en rojo primero, revisión en paralelo, merge solo con tests en verde. Pagos, auth y datos personales pasan por gatekeeper humano: Pedro.

## 13. Prompts para Antigravity

Prompt base, para cada tarea:

> Sigue este spec.md al pie de la letra. No inventes funcionalidades fuera del alcance. Si algo del spec es ambiguo, pregúntame antes de programarlo. Primero escribe el test en rojo, luego el código mínimo para pasarlo, luego refactoriza.

Prompt T-01:

> Crea el repo y el scaffold con Expo + React Native + TypeScript y Firebase. Aplica el diseño de la imagen 0: fondo negro, dorado, tarjetas redondeadas, barra flotante. Sin datos inventados, solo el scaffold y la pantalla de registro por rol.

Prompt T-05:

> Implementa la Wallet según la sección 4 F2 y los tests T03-T06. Recarga, pago prepago, rechazo por saldo insuficiente, rechazo por doble pago, y retiro solo con CLABE guardada. Sin pagos reales todavía, usa sandbox.

## 14. Preguntas abiertas — no programar hasta que Pedro responda

1. Proveedor de recarga: Stripe o Mercado Pago, o los dos. **Decidido por Pedro 2026-11-08: Stripe.**
2. Lista real de proveedores para el piloto: nombre, categoría, contacto. **Primer piloto confirmado 2026-11-08: Mariscos Rulo's, Restaurante Bar, en la playa en el acceso del CICI Acapulco, categoría Alimentos y bebidas; menú completo con precios reales en `providers/mariscos-rulos-menu.md`.** Productora de eventos: One By Pro (eventos 14 y 15 nov 2026 en Ronnie Acapulco, $350 cover). Pedro es proveedor Xperience (eventos + jetski). **Cuentas registradas en la demo 2026-11-08 (al menos 2 por categoría; reales: Rulo's y One By Pro; las demás son de ejemplo para sustituir por proveedores reales):** Alimentos y bebidas — Mariscos Rulo's y Ronnie Acapulco (bar/antro); Transportación — Mario Torres (taxista, bocho azul) y Costa Azul Shuttle (van); Alojamiento — Hotel Emporio Acapulco y Casa Las Brisas; Xperience — One By Pro y Aqua Xperience (jetski, banana, buceo, lancha).
3. Precios reales por servicio, o se usan los de los mockups solo como ejemplo.
4. Comisión de Hype por reserva, o el prestador recibe el 100%. **Decidido por Pedro 2026-11-08: 10% por reserva. Hype retiene 10%, el prestador recibe 90%.** **Decidido por Pedro 2026-11-08: 10% por reserva. Hype retiene 10%, el prestador recibe 90%.**
5. ¿Hotel entra en MVP o queda en Fase 2, como está en este spec? **Aclarado por Pedro 2026-11-08: la opción del hotel era solo un ejemplo de los roles de usuario en general — no es una decisión pendiente. El rol Alojamiento existe como categoría (casas, hoteles, apartamentos) y los proveedores concretos se dan de alta cuando lleguen.**

## 15. Demo de referencia

Demo en Muse, slug `hype-xperience`, con registro por rol, Wallet, calendario en Feed, Perfil flotante arriba, tema oscuro / claro, y Meta a nivel demo (enlaces guardados, sin API real). Replicar su comportamiento, no copiar su código. La demo no es la app de producción.
