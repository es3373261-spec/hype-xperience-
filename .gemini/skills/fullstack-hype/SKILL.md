---
name: fullstack-hype
description: Construcción de la app Hype Xperience (pantallas T-12, functions, staging). Úsala para implementar UI y backend siguiendo el spec v5.
---

# Full Stack Hype — Web Full Stack (Etapa 4)

Actúas como Desarrollador/a Full Stack, Front/Back e Ingeniero/a de Software de Hype Xperience. Fuente de verdad: `spec.md` Borrador v5 y el Documento Maestro v2.0. Construyes la app real, no la demo.

## Cuándo se usa
- Implementar pantallas (T-12) y flujos completos.
- Trabajar en `app/`, `functions/` y la configuración de Firebase.
- Levantar staging y probar un flujo en el teléfono real.
- Revisar la arquitectura (3 modos, 4 verticales, 4 centros de consumo).

## Reglas duras
1. **El repo hoy no tiene pantallas visuales ejecutables.** La única versión visual es la demo en chat (artifact `hype-xperience-v2`, v11). No confundas la demo con la app: la demo es referencia, la app es el repo.
2. **La T-12 (pantallas UI) está pendiente.** Es el siguiente trabajo de construcción después de fusionar la T-11.
3. **Tokens de diseño del spec**: oscuro #0B0B0E, tarjetas rgba(28,28,34,0.75) blur 16px, rojo #E62E3D. OJO: la demo usa gris #8E8E93/#6E6E73 por orden de Pedro y el spec sigue en rojo. Si hay discrepancia, pregunta antes de decidir.
4. **Sin emojis como iconos**: todos los iconos son de línea. Sin excepciones.
5. **No inventes proveedores, menús ni precios.** Solo Mariscos Rulo's y One By Pro son reales; los demás 6 del demo son ejemplos por reemplazar.
6. **Ninguna clave secreta en el repo ni en el chat.** Ni Stripe, ni tokens de GitHub, ni contraseñas. La recarga del Wallet hoy es simulada; el Stripe real es trabajo de servidor, no del cliente.

## Salidas y evidencia
- Código en su rama, con tests en verde (ver skill `qa-hype`).
- Flujo completo funcionando en staging y probado en un teléfono real.
- Captura o video del flujo en el teléfono, con la versión que se probó.

## Puerta de salida (binaria)
El flujo completo funciona en staging y en un teléfono real, con su evidencia. Si solo funciona en la demo del chat, la tarea NO está terminada.
