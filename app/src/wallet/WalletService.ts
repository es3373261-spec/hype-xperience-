import { User } from '../types/user';
import { Booking } from '../types/booking';
import {
  Wallet,
  WalletTx,
  RECHARGE_CHIPS,
  WalletTxDetails,
} from '../types/wallet';
import { emitOddLog } from '../observability/oddLogger';
import { getFirebaseInstance } from '../firebase/config';

export { RECHARGE_CHIPS };

export class WalletService {
  private balances: Map<string, number> = new Map();
  private transactions: Map<string, WalletTx> = new Map();
  private userTxMap: Map<string, string[]> = new Map();
  private paidBookings: Set<string> = new Set();
  private nextId = 1;

  getBalance(userId: string): number {
    return this.balances.get(userId) || 0;
  }

  setBalance(userId: string, balance: number): void {
    this.balances.set(userId, Math.max(0, balance));
  }

  getHypeRevenueBalance(): number {
    return this.getBalance('admin_hype');
  }

  getUserTransactions(userId: string): WalletTx[] {
    const txIds = this.userTxMap.get(userId) || [];
    return txIds
      .map((id) => this.transactions.get(id))
      .filter((t): t is WalletTx => t !== undefined);
  }

  private recordTransaction(tx: WalletTx, affectedUserIds: string[]) {
    this.transactions.set(tx.id, tx);
    for (const uid of affectedUserIds) {
      const existing = this.userTxMap.get(uid) || [];
      existing.push(tx.id);
      this.userTxMap.set(uid, existing);
    }

    const fb = getFirebaseInstance();
    fb.firestore.collection('wallet_txs').doc(tx.id).set(tx);
  }

  // 1. Recarga de Wallet con Stripe Sandbox (spec §4 F2, §9, §11, §14 Q1)
  async rechargeWithStripe(
    user: User,
    montoMXN: number,
    _stripePaymentMethodId?: string
  ): Promise<{ success: boolean; saldoNuevo: number; tx: WalletTx }> {
    if (montoMXN <= 0 || isNaN(montoMXN)) {
      throw new Error('Monto de recarga inválido: debe ser mayor a 0 MXN');
    }

    const stripePaymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nuevoSaldo = this.getBalance(user.id) + montoMXN;
    this.setBalance(user.id, nuevoSaldo);

    const txId = `tx_rec_${Date.now()}_${this.nextId++}`;
    const tx: WalletTx = {
      id: txId,
      fromUserId: 'stripe_sandbox',
      toUserId: user.id,
      monto: montoMXN,
      tipo: 'recarga',
      estado: 'completada',
      fecha: new Date().toISOString(),
      detalles: {
        stripePaymentIntentId,
      },
    };

    this.recordTransaction(tx, [user.id]);

    // ODD Observabilidad (§11)
    emitOddLog('wallet.recharge', {
      userId: user.id,
      monto: montoMXN,
      stripePaymentIntentId,
      saldoNuevo: nuevoSaldo,
    });

    return {
      success: true,
      saldoNuevo: nuevoSaldo,
      tx,
    };
  }

  // 2. Pago de Reserva con Reparto 90% Prestador / 10% Hype (§4 F2, §8, §10 T03-T05, §14 Q4)
  processBookingPayment(
    touristUser: User,
    providerUserId: string,
    booking: Booking
  ): {
    success: boolean;
    netoPrestador: number;
    comisionHype: number;
    txId: string;
  } {
    // Regla de oro (§8, §10 T05): Doble pago de la misma reserva está prohibido
    if (booking.estado === 'pagada' || this.paidBookings.has(booking.id)) {
      emitOddLog('booking.double_payment_blocked', {
        bookingId: booking.id,
        userId: touristUser.id,
      });
      throw new Error('Doble pago rechazado: la reserva ya fue pagada');
    }

    const currentBalance = this.getBalance(touristUser.id);

    // Regla de oro (§4 F1, §8, §10 T03): Sin saldo, no hay reserva
    if (currentBalance < booking.monto) {
      emitOddLog('wallet.payment_rejected', {
        userId: touristUser.id,
        bookingId: booking.id,
        monto: booking.monto,
        saldoActual: currentBalance,
      });
      throw new Error('Saldo insuficiente — agrega dinero en tu Wallet');
    }

    // Cálculo del reparto (§8, §10 T04, §14 Q4):
    // Comisión Hype: 10%. Prestador recibe 90%.
    const comisionHype = Math.round(booking.monto * 0.1 * 100) / 100;
    const netoPrestador = Math.round(booking.monto * 0.9 * 100) / 100;

    // Débito al turista
    this.setBalance(touristUser.id, currentBalance - booking.monto);

    // Crédito al prestador (90%)
    const prestadorSaldoAnterior = this.getBalance(providerUserId);
    this.setBalance(providerUserId, prestadorSaldoAnterior + netoPrestador);

    // Crédito a Hype (10%)
    const hypeSaldoAnterior = this.getBalance('admin_hype');
    this.setBalance('admin_hype', hypeSaldoAnterior + comisionHype);

    // Marcar reserva como pagada
    this.paidBookings.add(booking.id);
    booking.estado = 'pagada';

    // 1. Transacción débito del turista (monto total)
    const txIdTourist = `tx_pay_debit_${Date.now()}_${this.nextId++}`;
    const txTourist: WalletTx = {
      id: txIdTourist,
      fromUserId: touristUser.id,
      toUserId: providerUserId,
      bookingId: booking.id,
      monto: booking.monto,
      tipo: 'pago',
      estado: 'completada',
      fecha: new Date().toISOString(),
      detalles: {
        montoBruto: booking.monto,
        netoPrestador,
        comisionHype,
      },
    };
    this.recordTransaction(txTourist, [touristUser.id]);

    // 2. Transacción crédito al prestador (90% neto)
    const txIdProvider = `tx_pay_credit_${Date.now()}_${this.nextId++}`;
    const txProvider: WalletTx = {
      id: txIdProvider,
      fromUserId: touristUser.id,
      toUserId: providerUserId,
      bookingId: booking.id,
      monto: netoPrestador,
      tipo: 'pago',
      estado: 'completada',
      fecha: new Date().toISOString(),
      detalles: {
        montoBruto: booking.monto,
        netoPrestador,
        comisionHype,
      },
    };
    this.recordTransaction(txProvider, [providerUserId]);

    // 3. Transacción comisión Hype (10%)
    const txIdHype = `tx_comm_${Date.now()}_${this.nextId++}`;
    const txHype: WalletTx = {
      id: txIdHype,
      fromUserId: touristUser.id,
      toUserId: 'admin_hype',
      bookingId: booking.id,
      monto: comisionHype,
      tipo: 'comision_hype',
      estado: 'completada',
      fecha: new Date().toISOString(),
      detalles: {
        montoBruto: booking.monto,
        netoPrestador,
        comisionHype,
      },
    };
    this.recordTransaction(txHype, ['admin_hype']);

    // ODD Observabilidad (§11)
    emitOddLog('wallet.payment', {
      bookingId: booking.id,
      touristId: touristUser.id,
      providerId: providerUserId,
      montoTotal: booking.monto,
      netoPrestador,
      comisionHype,
    });

    return {
      success: true,
      netoPrestador,
      comisionHype,
      txId: txIdTourist,
    };
  }

  // 3. Retiro a Banco del Prestador (spec §4 F2 paso 4, §8, §10 T06, §11)
  requestWithdrawal(
    providerUser: User,
    montoMXN: number
  ): {
    success: boolean;
    saldoRestante: number;
    tx: WalletTx;
    aviso: string;
  } {
    // Regla de oro (§8, §10 T06): Retiro solo con CLABE guardada
    if (!providerUser.bank?.clabeLast4 || !providerUser.bank?.titular) {
      throw new Error('Retiro rechazado: debes registrar tu CLABE y titular antes de retirar');
    }

    const currentBalance = this.getBalance(providerUser.id);
    if (montoMXN <= 0 || isNaN(montoMXN)) {
      throw new Error('Monto de retiro inválido');
    }

    if (currentBalance < montoMXN) {
      throw new Error('Saldo insuficiente para el retiro');
    }

    const saldoRestante = currentBalance - montoMXN;
    this.setBalance(providerUser.id, saldoRestante);

    const txId = `tx_wit_${Date.now()}_${this.nextId++}`;
    const tx: WalletTx = {
      id: txId,
      fromUserId: providerUser.id,
      toUserId: 'banco',
      monto: montoMXN,
      tipo: 'retiro',
      estado: 'pendiente',
      fecha: new Date().toISOString(),
      detalles: {
        clabeLast4: providerUser.bank.clabeLast4,
        titular: providerUser.bank.titular,
      },
    };

    this.recordTransaction(tx, [providerUser.id]);

    // ODD Observabilidad (§11)
    emitOddLog('wallet.withdrawal', {
      userId: providerUser.id,
      monto: montoMXN,
      clabeLast4: providerUser.bank.clabeLast4,
      titular: providerUser.bank.titular,
    });

    return {
      success: true,
      saldoRestante,
      tx,
      aviso: 'Tu retiro se reflejará en tu banco en 1 a 2 días hábiles',
    };
  }
}
