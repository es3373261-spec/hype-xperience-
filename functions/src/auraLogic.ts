export interface ActiveCatalogEntry {
  ally_id: string;
  business_name: string;
  vertical: string;
  subcategory: string;
  price_mxn: number;
  location: string;
}

export interface AuraProposedItem {
  dia: number;
  vertical: string;
  ally_id: string;
  servicio_nombre: string;
  precio_neto_aliado: number;
  notas_logisticas?: string;
}

export interface AuraStructuredResponse {
  mensaje_conversacional: string;
  estado_cotizacion: 'recopilando_datos' | 'borrador_listo';
  datos_cliente?: {
    ocasion?: string;
    dias?: number;
    personas?: number;
    alergias_notas?: string;
  };
  itinerario_propuesto?: AuraProposedItem[];
  resumen_financiero?: {
    subtotal_aliados: number;
    comision_concierge_15_pct: number;
    total_cliente_mxn: number;
  };
}

/**
 * Exact Gemini Structured Output response_schema from spec.md §10
 */
export const AURA_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    mensaje_conversacional: {
      type: 'STRING',
      description: 'Respuesta natural de Aura para mostrar en la burbuja de chat.',
    },
    estado_cotizacion: {
      type: 'STRING',
      enum: ['recopilando_datos', 'borrador_listo'],
    },
    datos_cliente: {
      type: 'OBJECT',
      properties: {
        ocasion: { type: 'STRING' },
        dias: { type: 'INTEGER' },
        personas: { type: 'INTEGER' },
        alergias_notas: { type: 'STRING' },
      },
    },
    itinerario_propuesto: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          dia: { type: 'INTEGER' },
          vertical: { type: 'STRING' },
          ally_id: { type: 'STRING' },
          servicio_nombre: { type: 'STRING' },
          precio_neto_aliado: { type: 'NUMBER' },
          notas_logisticas: { type: 'STRING' },
        },
        required: ['dia', 'vertical', 'ally_id', 'servicio_nombre', 'precio_neto_aliado'],
      },
    },
    resumen_financiero: {
      type: 'OBJECT',
      properties: {
        subtotal_aliados: { type: 'NUMBER' },
        comision_concierge_15_pct: { type: 'NUMBER' },
        total_cliente_mxn: { type: 'NUMBER' },
      },
    },
  },
  required: ['mensaje_conversacional', 'estado_cotizacion'],
} as const;

export function buildAuraSystemInstruction(activeCatalog: ActiveCatalogEntry[]): string {
  return [
    'Eres Aura, la concierge digital experta de Hype Xperience en Acapulco, Guerrero.',
    'Tu objetivo es escuchar la intención del usuario y construir un borrador de Xperience utilizando ÚNICAMENTE los servicios reales proporcionados en el CATÁLOGO ACTIVO adjunto.',
    'REGLAS OPERATIVAS ESTRICTAS:',
    '1. CERO ALUCINACIONES: Jamás inventes precios, nombres de embarcaciones, restaurantes, horarios ni disponibilidad fuera del JSON del catálogo activo. Si falta algún servicio solicitado, indícalo con transparencia y sugiere la mejor alternativa real disponible.',
    '2. CALIFICACIÓN EFICIENTE: Si la petición es abierta, realiza máximo 2 o 3 preguntas breves en un solo mensaje para obtener: fechas exactas y duración en días; número de personas; alergias alimentarias o restricciones médicas/dietéticas (obligatorio si el plan incluye restaurantes, catering o actividades físicas).',
    '3. INTEGRACIÓN DE MOVILIDAD: Incluye traslados sugeridos usando Hype Go, Hype Confort o Hype by Pro (solo grupos/VIP).',
    '4. CÁLCULO FINANCIERO: Suma los precios de los Aliados seleccionados y calcula el 15% adicional redondeado por servicio correspondiente a la gestión Concierge.',
    '5. TRANSPARENCIA DE ESTADO: Indica siempre que el itinerario mostrado es un borrador sujeto a verificación final de disponibilidad por el equipo Concierge.',
    '6. TONO: Sofisticado, cálido, experto local en Acapulco, claro y orientado a la acción. Sin emojis como iconos.',
    '',
    'CATÁLOGO ACTIVO (JSON):',
    JSON.stringify(activeCatalog),
  ].join('\n');
}

/**
 * Anti-hallucination guardrail (§10, §13):
 * Verifies every ally_id in Aura's proposed itinerary exists in the active catalog.
 */
export function validateAuraDraftAgainstCatalog(
  draft: AuraStructuredResponse,
  activeCatalog: ActiveCatalogEntry[]
): { valid: boolean; invalidAllyIds: string[] } {
  const activeIds = new Set(activeCatalog.map((c) => c.ally_id));
  const invalidAllyIds: string[] = [];

  for (const item of draft.itinerario_propuesto || []) {
    if (!activeIds.has(item.ally_id)) {
      invalidAllyIds.push(item.ally_id);
    }
  }

  return {
    valid: invalidAllyIds.length === 0,
    invalidAllyIds,
  };
}
