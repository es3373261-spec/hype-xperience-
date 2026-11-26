// Tier 2 Boundary & Corner Cases — F04: Closed-Loop Wallet & Hybrid Payments
// Spec coverage: T12, T22, T23, §2, §6 F1.5, §6 F2, §7 C, §9, §13
// Uses strictly erasable TypeScript syntax.

import {
  describeContract,
  probeTarget,
  requireContract,
} from '../helpers/contractHarness.ts';
import {
  authHelper,
  harness,
  oddHelper,
  venueHelper,
  walletHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  WALLET_MESSAGES,
  buildExplorerSignup,
  buildVenueBookingPayload,
} from '../helpers/fixtures.ts';

describeContract(
  'wallet',
  [],
  'F04 Edge: Closed-Loop Wallet & Hybrid Payment Boundary Cases (T2-F04-01..05)',
  () => {
    let ctx: HarnessContext;

    beforeEach(async () => {
      ctx = await harness.boot();
      await harness.resetAndSeedPilotData(ctx);
    });

    afterEach(async () => {
      await harness.teardown(ctx);
    });

    it('T2-F04-01: rejects 100% Wallet and mixed payment with "Saldo insuficiente" without mutating balance and emits wallet.payment_rejected', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('f04_01'));
      await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 100 });

      const booking = await venueHelper.createVenueBookingWithPreOrder(
        ctx,
        explorer,
        buildVenueBookingPayload()
      );
      expect(booking.totalMxn).toBe(580);

      await expect(
        walletHelper.payBooking(ctx, explorer, {
          bookingId: booking.bookingId,
          method: 'wallet_hype',
        })
      ).rejects.toThrow(new RegExp(WALLET_MESSAGES.insufficientBalanceShort, 'i'));

      await expect(
        walletHelper.payBooking(ctx, explorer, {
          bookingId: booking.bookingId,
          method: 'mixed',
          walletPartMxn: 300,
          cardPartMxn: 280,
        })
      ).rejects.toThrow(new RegExp(WALLET_MESSAGES.insufficientBalanceShort, 'i'));

      const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
      expect(ledger[ledger.length - 1]?.balanceAfter).toBe(100);

      const rejectedLogs = await oddHelper.getOddEvents(ctx, {
        event: 'wallet.payment_rejected',
      });
      expect(rejectedLogs.length).toBeGreaterThanOrEqual(2);
    });

    it('T2-F04-02: blocks double payment on an already paid booking without charging Wallet or Stripe and emits booking.double_payment_blocked', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('f04_02'));
      await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 1000 });

      const booking = await venueHelper.createVenueBookingWithPreOrder(
        ctx,
        explorer,
        buildVenueBookingPayload()
      );
      const firstPay = await walletHelper.payBooking(ctx, explorer, {
        bookingId: booking.bookingId,
        method: 'wallet_hype',
      });
      expect(firstPay.paid).toBe(true);
      expect(firstPay.walletBalanceAfterMxn).toBe(420);

      await expect(
        walletHelper.payBooking(ctx, explorer, {
          bookingId: booking.bookingId,
          method: 'wallet_hype',
        })
      ).rejects.toThrow(/doble|pagad|already|paid|bloquead/i);

      await expect(
        walletHelper.payBooking(ctx, explorer, {
          bookingId: booking.bookingId,
          method: 'stripe_card',
        })
      ).rejects.toThrow(/doble|pagad|already|paid|bloquead/i);

      const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
      expect(ledger[ledger.length - 1]?.balanceAfter).toBe(420);

      const doublePayLogs = await oddHelper.getOddEvents(ctx, {
        event: 'booking.double_payment_blocked',
      });
      expect(doublePayLogs.length).toBeGreaterThanOrEqual(1);
    });

    it('T2-F04-03: enforces closed-loop Wallet (blocks bank withdrawals and peer transfers) and alerts on withdrawal > balance', async () => {
      const explorerA = await authHelper.registerExplorer(ctx, buildExplorerSignup('f04_03a'));
      const explorerB = await authHelper.registerExplorer(ctx, buildExplorerSignup('f04_03b'));
      await walletHelper.topUpWalletStripe(ctx, explorerA, { amountMxn: 500 });

      await expect(
        walletHelper.attemptWalletWithdrawalOrTransfer(ctx, explorerA, {
          kind: 'withdraw',
          amountMxn: 200,
        })
      ).rejects.toThrow(/circuito cerrado|no retirable|retiro|closed/i);

      await expect(
        walletHelper.attemptWalletWithdrawalOrTransfer(ctx, explorerA, {
          kind: 'transfer',
          amountMxn: 200,
          targetUid: explorerB.uid,
        })
      ).rejects.toThrow(/circuito cerrado|no transferible|transfer/i);

      await expect(
        walletHelper.attemptWalletWithdrawalOrTransfer(ctx, explorerA, {
          kind: 'withdraw',
          amountMxn: 600,
        })
      ).rejects.toThrow();

      const withdrawalLogs = await oddHelper.getOddEvents(ctx, {
        event: 'wallet.withdrawal',
      });
      expect(withdrawalLogs.length).toBeGreaterThanOrEqual(1);

      const alerts = await oddHelper.getActiveOddAlerts(ctx);
      const overdrawAlert = alerts.find(
        (a) => a.key === 'withdrawal_exceeds_balance' && a.active
      );
      expect(overdrawAlert).toBeDefined();
    });

    it('T2-F04-04: enforces append-only immutability on wallet_transactions ledger entries', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('f04_04'));
      const topUp = await walletHelper.topUpWalletStripe(ctx, explorer, {
        amountMxn: 500,
      });

      const ledgerBefore = await walletHelper.getWalletLedger(
        ctx,
        explorer,
        explorer.uid
      );
      expect(ledgerBefore.some((tx) => tx.txId === topUp.txId)).toBe(true);

      const walletApi = requireContract('wallet', []);
      if (typeof walletApi.updateWalletTransaction === 'function') {
        await expect(
          (walletApi.updateWalletTransaction as (p: unknown) => Promise<unknown>)({
            txId: topUp.txId,
            amountMxn: 9999,
            actorUid: explorer.uid,
          })
        ).rejects.toThrow(/inmutable|immutable|denied|permit|prohib/i);
      }
      if (typeof walletApi.deleteWalletTransaction === 'function') {
        await expect(
          (walletApi.deleteWalletTransaction as (p: unknown) => Promise<unknown>)({
            txId: topUp.txId,
            actorUid: explorer.uid,
          })
        ).rejects.toThrow(/inmutable|immutable|denied|permit|prohib/i);
      }

      const rulesProbe = probeTarget('rules');
      if (rulesProbe.available && typeof rulesProbe.api.rulesText === 'string') {
        expect(rulesProbe.api.rulesText).toMatch(/wallet_transactions/);
        expect(rulesProbe.api.rulesText).toMatch(
          /allow\s+(?:update|delete|write|update,\s*delete)\s*:\s*if\s+false/
        );
      }
    });

    it('T2-F04-05: rejects mismatched mixed splits and non-positive top-up amounts before mutating balance', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('f04_05'));
      await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 500 });

      await expect(
        walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 0 })
      ).rejects.toThrow();

      await expect(
        walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: -100 })
      ).rejects.toThrow();

      const booking = await venueHelper.createVenueBookingWithPreOrder(
        ctx,
        explorer,
        buildVenueBookingPayload()
      );
      expect(booking.totalMxn).toBe(580);

      await expect(
        walletHelper.payBooking(ctx, explorer, {
          bookingId: booking.bookingId,
          method: 'mixed',
          walletPartMxn: 200,
          cardPartMxn: 200,
        })
      ).rejects.toThrow(/total|suma|split|monto|coincid|mismatch/i);

      const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
      expect(ledger).toHaveLength(1);
      expect(ledger[0]?.balanceAfter).toBe(500);
    });
  }
);
