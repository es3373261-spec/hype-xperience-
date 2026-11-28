import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { calculateTaxiFare, TransportTier } from './pricing';

if (!getApps().length) {
  initializeApp();
}

export { chatWithAura } from './aura';
export { createWalletRechargeIntent, stripeWebhook } from './wallet';
export { readTripChatForSupport } from './support';

export const calculateTaxiFareFn = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para cotizar un viaje.');
  }

  const distanceKm = Number(request.data?.distanceKm);
  const durationMin = Number(request.data?.durationMin);
  const tier = String(request.data?.tier || 'hype_go') as TransportTier;

  if (!Number.isFinite(distanceKm) || !Number.isFinite(durationMin)) {
    throw new HttpsError('invalid-argument', 'distanceKm y durationMin deben ser numéricos.');
  }

  const userSnap = await getFirestore().collection('users').doc(request.auth.uid).get();
  const userData = userSnap.data() || {};
  const hasConciergeOrVip = userData.concierge_access === true || userData.is_vip === true;

  try {
    return calculateTaxiFare({
      distanceKm,
      durationMin,
      tier,
      hasConciergeOrVip,
    });
  } catch (err: any) {
    throw new HttpsError('permission-denied', err.message || 'No se pudo cotizar el viaje.');
  }
});
