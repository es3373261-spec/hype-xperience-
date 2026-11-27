import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  calculateCommissionSplit,
  executeIdempotentBookingPayment,
  PaymentChannel,
} from './walletTransactions';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { calculateCommissionSplit, executeIdempotentBookingPayment };

/**
 * Callable transaccional para procesar pagos de reservas con idempotencia desde el cliente.
 */
export const processBookingPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para pagar una reserva.');
  }

  const data = request.data as {
    idempotencyKey?: string;
    providerUserId?: string;
    bookingId?: string;
    amountMXN?: number;
    channel?: PaymentChannel;
  };

  if (!data?.idempotencyKey || !data?.providerUserId || !data?.bookingId || typeof data?.amountMXN !== 'number') {
    throw new HttpsError('invalid-argument', 'Faltan parámetros requeridos para procesar el pago.');
  }

  try {
    return await executeIdempotentBookingPayment(admin.firestore(), {
      idempotencyKey: data.idempotencyKey,
      touristId: request.auth.uid,
      providerUserId: data.providerUserId,
      bookingId: data.bookingId,
      amountMXN: data.amountMXN,
      channel: data.channel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error procesando pago';
    throw new HttpsError('failed-precondition', message);
  }
});
