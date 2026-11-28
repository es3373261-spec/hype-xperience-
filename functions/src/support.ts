import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Audited Support Access to Private Trip Chat (spec.md §15.7 — decided 2026-11-26):
 * Trip messages are private between passenger and driver.
 * Concierge / Hype Support can read them ONLY through this function, which requires
 * concierge_access === true and records an immutable audit entry in support_audit_logs.
 */
export const readTripChatForSupport = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const tripId = String(request.data?.tripId || '').trim();
  const reason = String(request.data?.reason || '').trim();

  if (!tripId || reason.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'Se requiere tripId y un motivo de soporte/incidente (mínimo 5 caracteres).'
    );
  }

  const db = getFirestore();
  const callerSnap = await db.collection('users').doc(request.auth.uid).get();
  if (!callerSnap.exists || callerSnap.data()?.concierge_access !== true) {
    throw new HttpsError(
      'permission-denied',
      'No autorizado: solo Concierge puede auditar chats de viaje por soporte.'
    );
  }

  const now = new Date().toISOString();
  await db.collection('support_audit_logs').add({
    action: 'trip_chat.support_read',
    actor_uid: request.auth.uid,
    trip_id: tripId,
    reason,
    created_at: now,
  });

  const messagesSnap = await db
    .collection('trips')
    .doc(tripId)
    .collection('messages')
    .orderBy('created_at', 'asc')
    .get();

  return {
    tripId,
    auditedAt: now,
    messages: messagesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
  };
});
