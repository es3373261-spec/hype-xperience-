export const RECHARGE_CHIPS = [500, 1000, 2000, 5000] as const;

export interface Wallet {
  userId: string;
  saldoMXN: number;
}

export type WalletTxType = 'recarga' | 'pago' | 'comision_hype' | 'retiro';

export type WalletTxState = 'pendiente' | 'completada' | 'fallida';

export interface WalletTxDetails {
  montoBruto?: number;
  comisionHype?: number;
  netoPrestador?: number;
  stripePaymentIntentId?: string;
  clabeLast4?: string;
  titular?: string;
}

export interface WalletTx {
  id: string;
  fromUserId: string;
  toUserId: string;
  bookingId?: string;
  monto: number;
  tipo: WalletTxType;
  estado: WalletTxState;
  fecha: string;
  detalles?: WalletTxDetails;
}
