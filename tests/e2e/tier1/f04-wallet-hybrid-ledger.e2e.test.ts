// Tier 1 Feature Coverage — F04: Closed-Loop Wallet & Hybrid Payments
// Spec Refs: T12, T22, T23, §6 F1–F2, §7 C, §9

import { describeContract } from '../helpers/contractHarness.ts';
import {
  authHelper,
  harness,
  oddHelper,
  venueHelper,
  walletHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  buildExplorerSignup,
  buildVenueBookingPayload,
  WALLET_TOPUP_CHIPS_MXN,
} from '../helpers/fixtures.ts';

describeContract('wallet', [], 'F04: Closed-Loop Wallet & Hybrid Payments (Tier 1)', () => {
  let ctx: HarnessContext;

  beforeEach(async () => {
    ctx = await harness.boot();
    await harness.resetAndSeedPilotData(ctx);
  });

  afterEach(async () => {
    await harness.teardown(ctx);
  });

  it('T1-F04-01: Stripe top-up credits Wallet 1:1 (500 + 1000 = 1500 MXN), appends ledger tx, and emits wallet.recharge', async () => {
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('w01'));

    const firstTopup = await walletHelper.topUpWalletStripe(ctx, explorer, {
      amountMxn: WALLET_TOPUP_CHIPS_MXN[0],
    });
    expect(firstTopup.balanceMxn).toBe(500);

    const secondTopup = await walletHelper.topUpWalletStripe(ctx, explorer, {
      amountMxn: WALLET_TOPUP_CHIPS_MXN[1],
    });
    expect(secondTopup.balanceMxn).toBe(1500);
    expect(typeof secondTopup.txId).toBe('string');

    const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
    const topupTx = ledger.find((tx) => tx.txId === secondTopup.txId);
    expect(topupTx).toBeDefined();
    expect(topupTx?.type).toBe('topup_stripe');
    expect(topupTx?.amountMxn).toBe(1000);
    expect(topupTx?.balanceBefore).toBe(500);
    expect(topupTx?.balanceAfter).toBe(1500);

    await oddHelper.assertOddSequence(ctx, ['wallet.recharge']);
  });

  it('T1-F04-02: 100% Wallet payment deducts exact booking total (1500 -> 920), issues ticketCode, and emits wallet.payment & booking.paid', async () => {
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('w02'));
    await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 1500 });

    const booking = await venueHelper.createVenueBookingWithPreOrder(
      ctx,
      explorer,
      buildVenueBookingPayload()
    );
    expect(booking.totalMxn).toBe(580);

    const payment = await walletHelper.payBooking(ctx, explorer, {
      bookingId: booking.bookingId,
      method: 'wallet_hype',
    });

    expect(payment.paid).toBe(true);
    expect(payment.method).toBe('wallet_hype');
    expect(payment.walletPartMxn).toBe(580);
    expect(payment.cardPartMxn).toBe(0);
    expect(payment.walletBalanceAfterMxn).toBe(920);
    expect(typeof payment.ticketCode).toBe('string');

    const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
    const payTx = ledger.find((tx) => tx.txId === payment.txId);
    expect(payTx).toBeDefined();
    expect(payTx?.amountMxn).toBe(-580);
    expect(payTx?.balanceBefore).toBe(1500);
    expect(payTx?.balanceAfter).toBe(920);
    expect(payTx?.paymentMethod).toBe('wallet_hype');

    await oddHelper.assertOddSequence(ctx, ['wallet.payment', 'booking.paid']);
  });

  it('T1-F04-03: mixed payment splits $580 booking into $300 Wallet (400 -> 100) + $280 Stripe card and emits wallet.mixed_payment', async () => {
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('w03'));
    await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 400 });

    const booking = await venueHelper.createVenueBookingWithPreOrder(
      ctx,
      explorer,
      buildVenueBookingPayload()
    );
    expect(booking.totalMxn).toBe(580);

    const payment = await walletHelper.payBooking(ctx, explorer, {
      bookingId: booking.bookingId,
      method: 'mixed',
      walletPartMxn: 300,
      cardPartMxn: 280,
    });

    expect(payment.paid).toBe(true);
    expect(payment.method).toBe('mixed');
    expect(payment.walletPartMxn).toBe(300);
    expect(payment.cardPartMxn).toBe(280);
    expect(payment.walletBalanceAfterMxn).toBe(100);

    const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
    const payTx = ledger.find((tx) => tx.txId === payment.txId);
    expect(payTx).toBeDefined();
    expect(payTx?.paymentMethod).toBe('mixed');
    expect(payTx?.balanceBefore).toBe(400);
    expect(payTx?.balanceAfter).toBe(100);
    expect(payTx?.amountMxn).toBe(-300);

    await oddHelper.assertOddSequence(ctx, ['wallet.mixed_payment', 'booking.paid']);
  });

  it('T1-F04-04: Stripe card payment inside hybrid checkout leaves existing Wallet balance untouched', async () => {
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('w04'));
    await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 500 });

    const booking = await venueHelper.createVenueBookingWithPreOrder(
      ctx,
      explorer,
      buildVenueBookingPayload()
    );

    const payment = await walletHelper.payBooking(ctx, explorer, {
      bookingId: booking.bookingId,
      method: 'stripe_card',
    });

    expect(payment.paid).toBe(true);
    expect(payment.method).toBe('stripe_card');
    expect(payment.walletPartMxn).toBe(0);
    expect(payment.cardPartMxn).toBe(580);
    expect(payment.walletBalanceAfterMxn).toBe(500);

    const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
    const cardTx = ledger.find((tx) => tx.txId === payment.txId);
    expect(cardTx).toBeDefined();
    expect(cardTx?.paymentMethod).toBe('stripe_card');

    await oddHelper.assertOddSequence(ctx, ['wallet.payment', 'booking.paid']);
  });

  it('T1-F04-05: immutable wallet_transactions ledger maintains exact arithmetic chain and non-null references across operations', async () => {
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('w05'));
    await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 1000 });

    const booking = await venueHelper.createVenueBookingWithPreOrder(
      ctx,
      explorer,
      buildVenueBookingPayload()
    );
    await walletHelper.payBooking(ctx, explorer, {
      bookingId: booking.bookingId,
      method: 'mixed',
      walletPartMxn: 300,
      cardPartMxn: 280,
    });
    await walletHelper.topUpWalletStripe(ctx, explorer, { amountMxn: 500 });

    const ledger = await walletHelper.getWalletLedger(ctx, explorer, explorer.uid);
    const explorerCredits = ledger.filter((tx) => tx.walletType === 'explorer_credits');
    expect(explorerCredits.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < explorerCredits.length; i += 1) {
      const tx = explorerCredits[i];
      expect(typeof tx.referenceId).toBe('string');
      expect(tx.referenceId.length).toBeGreaterThan(0);
      expect(typeof tx.paymentMethod).toBe('string');
      expect(tx.paymentMethod.length).toBeGreaterThan(0);
      expect(tx.balanceAfter).toBe(tx.balanceBefore + tx.amountMxn);
      if (i > 0) {
        expect(tx.balanceBefore).toBe(explorerCredits[i - 1].balanceAfter);
      }
    }
    expect(explorerCredits[explorerCredits.length - 1]?.balanceAfter).toBe(1200);
  });
});
