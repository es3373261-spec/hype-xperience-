# Hype Xperience

App que gestiona y conecta todos los servicios turísticos de Acapulco en un solo lugar: tours, restaurantes, eventos, taxi y más. Lanzamiento: diciembre de 2026.

## El plano

Toda la app se construye siguiendo `spec.md` al pie de la letra (SDD / TDD / ODD). No se inventan funcionalidades fuera del alcance. Si algo del spec es ambiguo, se pregunta a Pedro antes de programarlo.

## Stack

- Móvil: Expo + React Native + TypeScript — `app/`
- Backend: Firebase — Auth, Firestore, Storage, Functions, App Check — `functions/`
- Admin web: `admin/`
- Diseño: fondo negro, acento dorado / ámbar, tarjetas redondeadas, barra inferior flotante. Referencia única: imagen `341266_0_8jhd.jpg` (3 pantallas móviles).

## Lo que resuelve

Desconfianza en los pagos: hay prestadores a los que les cancelaron la transferencia después de dar el servicio. Por eso el pago es **prepago con Wallet**: el turista recarga, paga antes del servicio y el dinero cae a la Wallet del prestador, que luego lo retira a su banco.

## Roles

Turista, Restaurante, Playa / actividades, Club (+ staff con permiso limitado), Hotel, Taxista individual, Admin Hype. La autenticación decide el dashboard.

## Estado

Borrador v1 del spec. Tarea actual: T-01 — repo, Firebase, diseño base.

Preguntas abiertas (no programar hasta resolverlas): proveedor de recarga (Stripe / Mercado Pago), lista real de proveedores piloto, precios reales, comisión de Hype, y si Hotel entra en MVP o Fase 2. Ver `spec.md` §14.
