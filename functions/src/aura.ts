import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { calculateConciergePackageBreakdown } from './pricing';
import {
  ActiveCatalogEntry,
  AURA_RESPONSE_SCHEMA,
  AuraStructuredResponse,
  buildAuraSystemInstruction,
  validateAuraDraftAgainstCatalog,
} from './auraLogic';

export {
  ActiveCatalogEntry,
  AURA_RESPONSE_SCHEMA,
  AuraStructuredResponse,
  buildAuraSystemInstruction,
  validateAuraDraftAgainstCatalog,
} from './auraLogic';

export const chatWithAura = onCall({ secrets: ['GEMINI_API_KEY'] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para conversar con Aura.');
  }

  const userMessage = String(request.data?.message || '').trim();
  if (!userMessage) {
    throw new HttpsError('invalid-argument', 'El mensaje no puede estar vacío.');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new HttpsError(
      'failed-precondition',
      'GEMINI_API_KEY no está configurada en el entorno de Cloud Functions.'
    );
  }

  const db = getFirestore();
  const alliesSnap = await db.collection('allies').where('status', '==', 'active').get();
  const activeCatalog: ActiveCatalogEntry[] = alliesSnap.docs.map((doc: any) => {
    const data = doc.data();
    return {
      ally_id: doc.id,
      business_name: data.profile?.business_name || 'Aliado',
      vertical: data.ally_category || 'venue',
      subcategory: data.ally_subcategory || '',
      price_mxn: data.vertical_config?.accommodation?.price_per_night_mxn || 350,
      location: data.profile?.location?.address || 'Acapulco',
    };
  });

  const systemInstruction = buildAuraSystemInstruction(activeCatalog);
  const isVertexExpressKey = geminiApiKey.startsWith('AQ.');
  const endpoint = isVertexExpressKey
    ? `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        geminiApiKey
      )}`
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        geminiApiKey
      )}`;

  const apiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: AURA_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!apiResponse.ok) {
    throw new HttpsError('internal', `Error al consultar Gemini API (${apiResponse.status}).`);
  }

  const payload: any = await apiResponse.json();
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new HttpsError('internal', 'Aura no devolvió una respuesta estructurada válida.');
  }

  const parsed: AuraStructuredResponse = JSON.parse(rawText);
  const validation = validateAuraDraftAgainstCatalog(parsed, activeCatalog);

  if (!validation.valid) {
    throw new HttpsError(
      'failed-precondition',
      `Guardrail anti-alucinación activado: aliados inexistentes (${validation.invalidAllyIds.join(', ')}).`
    );
  }

  // Recompute financial summary deterministically per §15.3 / §15.4
  if (parsed.itinerario_propuesto && parsed.itinerario_propuesto.length > 0) {
    const breakdown = calculateConciergePackageBreakdown(
      parsed.itinerario_propuesto.map((item) => ({
        allyId: item.ally_id,
        serviceName: item.servicio_nombre,
        basePriceMxn: item.precio_neto_aliado,
      }))
    );
    parsed.resumen_financiero = {
      subtotal_aliados: breakdown.subtotalServicesMxn,
      comision_concierge_15_pct: breakdown.totalConciergeCommissionMxn,
      total_cliente_mxn: breakdown.totalClientPriceMxn,
    };

    if (parsed.estado_cotizacion === 'borrador_listo') {
      await db.collection('concierge_requests').add({
        explorer_uid: request.auth.uid,
        status: 'draft_from_aura',
        datos_cliente: parsed.datos_cliente || {},
        itinerario_propuesto: parsed.itinerario_propuesto,
        resumen_financiero: parsed.resumen_financiero,
        breakdown_items: breakdown.items,
        created_at: new Date().toISOString(),
      });
    }
  }

  return parsed;
});
