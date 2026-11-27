export type PaymentChannel = 'direct_intro' | 'direct_standard' | 'concierge_package';

export interface CommissionSplit {
  grossMXN: number;
  platformFeeMXN: number;
  providerNetMXN: number;
  rateApplied: number;
}

const CHANNEL_RATES: Record<PaymentChannel, number> = {
  direct_intro: 0.05,
  direct_standard: 0.1,
  concierge_package: 0.15,
};

/**
 * Calcula el reparto de comisión en backend de forma determinista y sin errores de punto flotante.
 * - Primeros 30 días (direct_intro): 5% plataforma / 95% aliado
 * - Estándar (direct_standard): 10% plataforma / 90% aliado
 * - Paquete Concierge (concierge_package): 15% plataforma / 85% aliado
 */
export function calculateCommissionSplit(
  grossMXN: number,
  channel: PaymentChannel = 'direct_standard'
): CommissionSplit {
  if (!Number.isFinite(grossMXN) || grossMXN <= 0) {
    throw new Error('El monto bruto debe ser un número positivo');
  }

  const rate = CHANNEL_RATES[channel];
  const platformFeeMXN = Math.round(grossMXN * rate * 100) / 100;
  const providerNetMXN = Math.round((grossMXN - platformFeeMXN) * 100) / 100;

  return {
    grossMXN,
    platformFeeMXN,
    providerNetMXN,
    rateApplied: rate,
  };
}

export interface IdempotentWalletInput {
  idempotencyKey: string;
  touristId: string;
  providerUserId: string;
  bookingId: string;
  amountMXN: number;
  channel?: PaymentChannel;
}

export interface IdempotentWalletResult {
  replayed: boolean;
  txId: string;
  split: CommissionSplit;
}

/**
 * Ejecuta un pago de reserva en una transacción de Firestore garantizando idempotencia.
 * Si `idempotencyKey` ya fue procesada, retorna el resultado previo sin volver a debitar.
 */
export async function executeIdempotentBookingPayment(
  db: FirebaseFirestore.Firestore,
  input: IdempotentWalletInput
): Promise<IdempotentWalletResult> {
  if (!input.idempotencyKey || input.idempotencyKey.trim().length < 8) {
    throw new Error('idempotencyKey inválida (mínimo 8 caracteres)');
  }

  const split = calculateCommissionSplit(input.amountMXN, input.channel ?? 'direct_standard');
  const idemRef = db.collection('idempotency_keys').doc(input.idempotencyKey);
  const touristWalletRef = db.collection('wallets').doc(input.touristId);
  const providerWalletRef = db.collection('wallets').doc(input.providerUserId);
  const hypeWalletRef = db.collection('wallets').doc('admin_hype');

  return db.runTransaction(async (tx) => {
    const existingIdem = await tx.get(idemRef);
    if (existingIdem.exists) {
      const prev = existingIdem.data() as { txId: string; split: CommissionSplit };
      return {
        replayed: true,
        txId: prev.txId,
        split: prev.split,
      };
    }

    const touristSnap = await tx.get(touristWalletRef);
    const currentBalance = (touristSnap.data()?.balance as number | undefined) ?? 0;
    if (currentBalance < input.amountMXN) {
      throw new Error('Saldo insuficiente en Wallet');
    }

    const providerSnap = await tx.get(providerWalletRef);
    const providerBalance = (providerSnap.data()?.balance as number | undefined) ?? 0;
    const hypeSnap = await tx.get(hypeWalletRef);
    const hypeBalance = (hypeSnap.data()?.balance as number | undefined) ?? 0;

    const txId = `tx_bk_${input.bookingId}`;
    const now = new Date().toISOString();

    tx.set(touristWalletRef, { balance: currentBalance - input.amountMXN, updatedAt: now }, { merge: true });
    tx.set(providerWalletRef, { balance: providerBalance + split.providerNetMXN, updatedAt: now }, { merge: true });
    tx.set(hypeWalletRef, { balance: hypeBalance + split.platformFeeMXN, updatedAt: now }, { merge: true });

    tx.set(db.collection('wallet_txs').doc(txId), {
      id: txId,
      bookingId: input.bookingId,
      fromUserId: input.touristId,
      toUserId: input.providerUserId,
      monto: input.amountMXN,
      netoPrestador: split.providerNetMXN,
      comisionHype: split.platformFeeMXN,
      tipo: 'pago_reserva',
      estado: 'completada',
      idempotencyKey: input.idempotencyKey,
      fecha: now,
    });

    tx.set(idemRef, {
      txId,
      split,
      createdAt: now,
    });

    return {
      replayed: false,
      txId,
      split,
    };
  });
}
