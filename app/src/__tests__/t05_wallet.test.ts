import { WalletService, RECHARGE_CHIPS } from '../wallet/WalletService';
import { CatalogManager } from '../catalog/CatalogManager';
import { TouristService } from '../tourist/TouristService';
import { User } from '../types/user';
import { Booking } from '../types/booking';
import { Wallet, WalletTx } from '../types/wallet';
import { getOddLogs, clearOddLogs } from '../observability/oddLogger';
import { initializeFirebase } from '../firebase/config';

describe('T-05: Wallet — recarga con Stripe, pago, retiro y reparto 90%/10% (spec §4 F2, §7, §8, §10 T03-T06, §11, §14 Q1, Q4)', () => {
  let walletService: WalletService;
  let catalog: CatalogManager;
  let touristService: TouristService;

  const touristUser: User = {
    id: 'u-tourist-01',
    nombre: 'Ana Turista',
    email: 'ana@hype.com',
    telefono: '7441112233',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '1234', titular: 'Ana Turista' },
  };

  const providerUser: User = {
    id: 'u-rulos',
    nombre: "Raul Rulo's",
    email: 'rulos@acapulco.com',
    telefono: '7442223344',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '5678', titular: 'Raul Rulos' },
  };

  const providerNoClabeUser: User = {
    id: 'u-prestador-sin-clabe',
    nombre: 'Prestador Sin Banco',
    email: 'sinbanco@hype.com',
    telefono: '7443334455',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '', titular: '' },
  };

  const oneByProUser: User = {
    id: 'u-onebypro',
    nombre: 'Pedro One By Pro',
    email: 'onebypro@hype.com',
    telefono: '7449998877',
    rol: 'xperience',
    tema: 'oscuro',
    bank: { clabeLast4: '9999', titular: 'Pedro Xperience' },
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    catalog = new CatalogManager();
    catalog.seedPilotProviders({
      rulosUserId: providerUser.id,
      oneByProUserId: oneByProUser.id,
    });
    walletService = new WalletService();
    touristService = new TouristService(catalog, walletService);
  });

  describe('1. Recarga de Wallet con Stripe Sandbox (spec §4 F2, §9, §11, §14 Q1)', () => {
    it('ofrece chips de recarga rápida de $500, $1,000, $2,000, $5,000 y monto libre', () => {
      expect(RECHARGE_CHIPS).toEqual([500, 1000, 2000, 5000]);
    });

    it('recarga saldo en sandbox de Stripe, genera transacción y emite log ODD wallet.recharge', async () => {
      const result = await walletService.rechargeWithStripe(touristUser, 1000);

      expect(result.success).toBe(true);
      expect(result.saldoNuevo).toBe(1000);
      expect(walletService.getBalance(touristUser.id)).toBe(1000);

      // Transacción en ledger
      const tx = result.tx;
      expect(tx.tipo).toBe('recarga');
      expect(tx.monto).toBe(1000);
      expect(tx.estado).toBe('completada');
      expect(tx.detalles?.stripePaymentIntentId).toMatch(/^pi_test_/);

      // Log ODD obligatorio (§11)
      const logs = getOddLogs('wallet.recharge');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].payload).toMatchObject({
        userId: touristUser.id,
        monto: 1000,
      });
    });

    it('rechaza recargas con monto inválido (<= 0)', async () => {
      await expect(walletService.rechargeWithStripe(touristUser, 0)).rejects.toThrow(
        /monto de recarga inválido/i
      );
      await expect(walletService.rechargeWithStripe(touristUser, -500)).rejects.toThrow(
        /monto de recarga inválido/i
      );
    });
  });

  describe('2. Pago de Reserva y Reparto 90% / 10% (spec §4 F2, §8, §10 T03-T05, §14 Q4)', () => {
    it('T03: dado turista con $0 y reserva de $700, el pago se rechaza con "Saldo insuficiente"', () => {
      const booking: Booking = {
        id: 'b-700-0',
        userId: touristUser.id,
        serviceId: 'serv-demo',
        fecha: '2026-11-20T14:00:00Z',
        estado: 'pendiente',
        monto: 700,
      };

      expect(() => {
        walletService.processBookingPayment(touristUser, providerUser.id, booking);
      }).toThrow(/Saldo insuficiente — agrega dinero en tu Wallet/i);

      // Log ODD de rechazo (§11)
      const rejectedLogs = getOddLogs('wallet.payment_rejected');
      expect(rejectedLogs.length).toBeGreaterThan(0);
      expect(rejectedLogs[0].payload).toMatchObject({
        userId: touristUser.id,
        monto: 700,
      });
    });

    it('T04 & §14 Q4: dado turista con $2,000 y reserva de $700, saldo queda $1,300, prestador recibe $630 (90%) y Hype $70 (10%)', async () => {
      // Recarga de $2,000
      await walletService.rechargeWithStripe(touristUser, 2000);
      expect(walletService.getBalance(touristUser.id)).toBe(2000);

      const booking: Booking = {
        id: 'b-700-1',
        userId: touristUser.id,
        serviceId: 'serv-demo',
        fecha: '2026-11-20T14:00:00Z',
        estado: 'pendiente',
        monto: 700,
      };

      const result = walletService.processBookingPayment(touristUser, providerUser.id, booking);

      expect(result.success).toBe(true);
      // Saldo del turista: $2,000 - $700 = $1,300
      expect(walletService.getBalance(touristUser.id)).toBe(1300);

      // Saldo del prestador: recibe $630 (90%)
      expect(walletService.getBalance(providerUser.id)).toBe(630);

      // Saldo de Hype (comisión 10%): $70
      expect(walletService.getHypeRevenueBalance()).toBe(70);

      // Movimiento en ambos lados en el ledger (§4 F2 paso 2)
      const touristTx = walletService.getUserTransactions(touristUser.id);
      expect(touristTx.some((t) => t.tipo === 'pago' && t.monto === 700)).toBe(true);

      const providerTx = walletService.getUserTransactions(providerUser.id);
      expect(
        providerTx.some(
          (t) => t.tipo === 'pago' && t.monto === 630 && t.detalles?.comisionHype === 70
        )
      ).toBe(true);

      // Log ODD obligatorio (§11)
      const paymentLogs = getOddLogs('wallet.payment');
      expect(paymentLogs.length).toBeGreaterThan(0);
      expect(paymentLogs[0].payload).toMatchObject({
        bookingId: booking.id,
        montoTotal: 700,
        netoPrestador: 630,
        comisionHype: 70,
      });
    });

    it('T05: Doble pago rechazado si la reserva ya está pagada', async () => {
      await walletService.rechargeWithStripe(touristUser, 2000);

      const booking: Booking = {
        id: 'b-700-double',
        userId: touristUser.id,
        serviceId: 'serv-demo',
        fecha: '2026-11-20T14:00:00Z',
        estado: 'pendiente',
        monto: 700,
      };

      walletService.processBookingPayment(touristUser, providerUser.id, booking);

      // Segundo intento de pago
      expect(() => {
        walletService.processBookingPayment(touristUser, providerUser.id, booking);
      }).toThrow(/Doble pago rechazado: la reserva ya fue pagada/i);

      const blockedLogs = getOddLogs('booking.double_payment_blocked');
      expect(blockedLogs.length).toBeGreaterThan(0);
    });

    it('Integra el reparto 90%/10% directamente al pagar desde TouristService', async () => {
      // Flujo completo a través de TouristService
      const allFeed = touristService.exploreFeed();
      const rulosService = allFeed.find((s) => s.service.título === 'Mariscada Grande')!.service;
      // Mariscada Grande cuesta $1,700
      expect(rulosService.precioMXN).toBe(1700);

      await walletService.rechargeWithStripe(touristUser, 3000);

      const booking = touristService.createBooking(
        touristUser,
        rulosService.id,
        '2026-11-20T14:00:00Z'
      );

      const payResult = touristService.payBookingWithWallet(touristUser, booking.id);
      expect(payResult.success).toBe(true);

      // Turista: $3,000 - $1,700 = $1,300
      expect(walletService.getBalance(touristUser.id)).toBe(1300);

      // Prestador (Raul Rulos): 90% de $1,700 = $1,530
      expect(walletService.getBalance(providerUser.id)).toBe(1530);

      // Hype: 10% de $1,700 = $170
      expect(walletService.getHypeRevenueBalance()).toBe(170);
    });
  });

  describe('3. Retiro a Banco del Prestador (spec §4 F2, §8, §10 T06, §11)', () => {
    it('T06: dado prestador sin CLABE, el retiro exige registrarla primero', () => {
      // Prestador con saldo pero sin CLABE
      walletService.setBalance(providerNoClabeUser.id, 5000);

      expect(() => {
        walletService.requestWithdrawal(providerNoClabeUser, 1000);
      }).toThrow(/Retiro rechazado: debes registrar tu CLABE y titular antes de retirar/i);
    });

    it('con CLABE registrada, realiza el retiro, debita el saldo y avisa 1-2 días hábiles (§4 F2 paso 4)', () => {
      walletService.setBalance(providerUser.id, 2000);

      const withdrawal = walletService.requestWithdrawal(providerUser, 1500);

      expect(withdrawal.success).toBe(true);
      expect(withdrawal.saldoRestante).toBe(500);
      expect(walletService.getBalance(providerUser.id)).toBe(500);
      expect(withdrawal.aviso).toMatch(/1.*2.*días.*hábiles/i);
      expect(withdrawal.tx.tipo).toBe('retiro');
      expect(withdrawal.tx.detalles?.clabeLast4).toBe('5678');
      expect(withdrawal.tx.detalles?.titular).toBe('Raul Rulos');

      // Jamás expone CLABE completa (§7)
      expect(withdrawal.tx.detalles).not.toHaveProperty('clabeFull');

      // Log ODD obligatorio (§11)
      const withdrawalLogs = getOddLogs('wallet.withdrawal');
      expect(withdrawalLogs.length).toBeGreaterThan(0);
      expect(withdrawalLogs[0].payload).toMatchObject({
        userId: providerUser.id,
        monto: 1500,
        clabeLast4: '5678',
      });
    });

    it('rechaza retiro si el monto solicitado excede el saldo disponible', () => {
      walletService.setBalance(providerUser.id, 500);

      expect(() => {
        walletService.requestWithdrawal(providerUser, 1000);
      }).toThrow(/Saldo insuficiente para el retiro/i);
    });
  });
});
