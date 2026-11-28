import { createHmac, timingSafeEqual } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { roundToCents } from './pricing';

function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300
): boolean {
  const parts = signatureHeader.split(',').map((part) => part.trim());
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't' && value) {
      timestamp = value;
    } else if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expectedSig = createHmac('sha256', webhookSecret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  return signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}

/**
 * Creates a Stripe PaymentIntent (sandbox/production via STRIPE_SECRET_KEY)
 * for closed-loop Hype Wallet credit top-ups (1 credit = $1 MXN).
 * Secret key lives ONLY in Cloud Functions environment, never in client or repo (§18).
 */
export const createWalletRechargeIntent = onCall({ secrets: ['STRIPE_SECRET_KEY'] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para recargar tu Wallet.');
  }

  const amountMxn = Number(request.data?.amountMxn);
  if (!Number.isFinite(amountMxn) || amountMxn < 50 || amountMxn > 50000) {
    throw new HttpsError(
      'invalid-argument',
      'El monto de recarga debe estar entre $50 y $50,000 MXN.'
    );
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new HttpsError(
      'failed-precondition',
      'STRIPE_SECRET_KEY no está configurada en el entorno de Cloud Functions.'
    );
  }

  const body = new URLSearchParams({
    amount: String(Math.round(amountMxn * 100)), // MXN centavos
    currency: 'mxn',
    'metadata[uid]': request.auth.uid,
    'metadata[type]': 'wallet_recharge',
    'metadata[amount_mxn]': String(roundToCents(amountMxn)),
  });

  const resp = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    throw new HttpsError('internal', `Error creando PaymentIntent en Stripe (${resp.status}).`);
  }

  const intent: any = await resp.json();
  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    amountMxn: roundToCents(amountMxn),
    currency: 'MXN',
  };
});

/**
 * Stripe Webhook receiver — atomically credits user's closed-loop wallet
 * and writes an immutable entry to wallet_transactions (idempotent by paymentIntentId).
 */
export const stripeWebhook = onRequest({ secrets: ['STRIPE_WEBHOOK_SECRET'] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sigHeader = req.headers['stripe-signature'];
    const rawBody = req.rawBody;
    if (
      typeof sigHeader !== 'string' ||
      !rawBody ||
      !verifyStripeSignature(rawBody, sigHeader, webhookSecret)
    ) {
      res.status(400).json({ error: 'Firma de Stripe inválida o ausente.' });
      return;
    }
  }

  const event = req.body;
  if (!event || event.type !== 'payment_intent.succeeded') {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const intent = event.data?.object;
  const uid = intent?.metadata?.uid;
  const amountMxn = Number(intent?.metadata?.amount_mxn || (intent?.amount || 0) / 100);
  const paymentIntentId = intent?.id;

  if (!uid || !paymentIntentId || !Number.isFinite(amountMxn) || amountMxn <= 0) {
    res.status(400).json({ error: 'Metadata de PaymentIntent incompleta' });
    return;
  }

  const db = getFirestore();
  const txRef = db.collection('wallet_transactions').doc(`stripe_${paymentIntentId}`);
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx: any) => {
    const existingTx = await tx.get(txRef);
    if (existingTx.exists) {
      return; // Idempotent guard against duplicate webhooks
    }

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new Error(`Usuario no encontrado: ${uid}`);
    }

    const currentBalance = Number(userSnap.data()?.wallet?.balance_mxn || 0);
    const newBalance = roundToCents(currentBalance + amountMxn);
    const now = new Date().toISOString();

    tx.update(userRef, {
      'wallet.balance_mxn': newBalance,
      'wallet.updated_at': now,
    });

    tx.set(txRef, {
      id: `stripe_${paymentIntentId}`,
      uid,
      type: 'topup',
      amount_mxn: roundToCents(amountMxn),
      balance_after_mxn: newBalance,
      stripe_payment_intent_id: paymentIntentId,
      is_closed_loop: true,
      created_at: now,
    });
  });

  res.status(200).json({ received: true, credited: true });
});
