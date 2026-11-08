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
- Perfil arriba, tarjeta flotante con datos y roles. Barra inferior flotante, 4 botones. Tema oscuro / claro editable en Perfil.
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

| Rol | Ve | Puede hacer | No puede hacer |
|---|---|---|---|
| Turista | Feed, Explorar, Concierge, Tickets, Wallet, Calendario | Registrarse, buscar, reservar, pagar con Wallet, pedir taxi, ver sus reservas y eventos | Ver dashboards de prestadores, ver finanzas de otros |
| Restaurante | Panel, Reservas, Catálogo / Menú | Cargar platillos con foto y precio, recibir reservas, ver reseñas | Ver otros negocios, cobrar fuera de Wallet |
| Playa / actividades | Panel, Reservas, Catálogo | Cargar sillas y actividades con cupo y horario | — |
| Club | Panel, Reservas, Escáner, Catálogo / Carta | Crear staff, recibir reservas de mesa o entrada, carta de bebidas | Ver finanzas de otros clubes |
| Staff de club (sub-rol) | Escáner, Hostess | Escanear boletos, acreditar entrada, hostess | Ver pagos, menú, finanzas, crear staff |
| Hotel | Panel, Reservas, Habitaciones | Cargar habitaciones, recibir reservas | — |
| Taxista | Viajes, Mapa, Wallet | Recibir y aceptar viajes, seguimiento por WhatsApp | Ver viajes de otros taxistas |
| Admin Hype | Todos los paneles | Onboarding de proveedores, encender / apagar categorías, soporte | Cobrar fuera de Wallet |

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
2. Al pagar, se descuenta de su Wallet y cae al instante en la Wallet del prestador, con movimiento en ambos lados.
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

## 6. Diseño — imagen de referencia

Referencia única: `341266_0_8jhd.jpg` — composite de 3 pantallas móviles: Discover & Concierge AI, Social Feed & Eventos, Mi Hype Ticket / Reserva.

Tokens:
- Fondo: negro oscuro.
- Acento: dorado / ámbar.
- Texto: blanco, gris claro para secundario.
- Tarjetas: redondeadas, con foto hero arriba.
- Botón principal: dorado, texto oscuro.
- Bottom nav flotante: 4 botones, sin Perfil. Perfil está arriba a la derecha, con avatar y rol, y abre tarjeta flotante.
- Calendario: solo en Feed, vista semanal compacta por defecto, cambio a mensual con un clic.

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
- T04 Wallet con saldo: dado turista con $2,000 y reserva de $700, entonces saldo queda $1,300 y prestador recibe $700.
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

1. Proveedor de recarga: Stripe o Mercado Pago, o los dos.
2. Lista real de proveedores para el piloto: nombre, categoría, contacto.
3. Precios reales por servicio, o se usan los de los mockups solo como ejemplo.
4. Comisión de Hype por reserva, o el prestador recibe el 100%.
5. ¿Hotel entra en MVP o queda en Fase 2, como está en este spec?

## 15. Demo de referencia

Demo en Muse, slug `hype-xperience`, con registro por rol, Wallet, calendario en Feed, Perfil flotante arriba, tema oscuro / claro, y Meta a nivel demo (enlaces guardados, sin API real). Replicar su comportamiento, no copiar su código. La demo no es la app de producción.
