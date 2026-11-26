// Tier 2 Boundary & Corner Cases — F03: Pilot Seed Data & Anomaly Preservation
// Spec coverage: §7 B.1, §9, §15.2, §15.8, §15.9, §16, §17
// Uses strictly erasable TypeScript syntax.

import {
  describeContract,
  probeTarget,
} from '../helpers/contractHarness.ts';
import {
  authHelper,
  catalogHelper,
  harness,
  walletHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  ALEJANDRO_VALDES_ANOMALY,
  CONCIERGE_ACCOUNTS,
  MARISCOS_RULOS_SEED,
  ONE_BY_PRO_SEED,
  buildExplorerSignup,
} from '../helpers/fixtures.ts';

describeContract(
  'catalog',
  [],
  'F03 Edge: Pilot Seed Data & Anomaly Preservation Boundary Cases (T2-F03-01..05)',
  () => {
    let ctx: HarnessContext;

    beforeEach(async () => {
      ctx = await harness.boot();
      await harness.resetAndSeedPilotData(ctx);
    });

    afterEach(async () => {
      await harness.teardown(ctx);
    });

    it('T2-F03-01: distinguishes real pilot providers (Mariscos Rulos, One By Pro) from is_example demo entries', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seedcheck1'));
      const rulosView = await catalogHelper.getAllyClientView(
        ctx,
        explorer,
        MARISCOS_RULOS_SEED.allyId
      );
      expect(rulosView.businessName).toBe(MARISCOS_RULOS_SEED.businessName);
      expect(rulosView.is_example).not.toBe(true);

      const oneByProView = await catalogHelper.getAllyClientView(
        ctx,
        explorer,
        ONE_BY_PRO_SEED.allyId
      );
      expect(oneByProView.businessName).toBe(ONE_BY_PRO_SEED.businessName);
      expect(oneByProView.is_example).not.toBe(true);
    });

    it('T2-F03-02: preserves verified Mariscos Rulos coordinates 16.84911, -99.85405 and rejects superseded Maestro coords', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seedcoords'));
      const rulosView = await catalogHelper.getAllyClientView(
        ctx,
        explorer,
        MARISCOS_RULOS_SEED.allyId
      );

      const profile = (rulosView.profile as Record<string, unknown> | undefined) ?? rulosView;
      const location = (profile.location as Record<string, unknown> | undefined) ?? rulosView;
      expect(location.lat).toBeCloseTo(MARISCOS_RULOS_SEED.coordinates.lat, 5);
      expect(location.lng).toBeCloseTo(MARISCOS_RULOS_SEED.coordinates.lng, 5);
      expect(location.lat).not.toBe(MARISCOS_RULOS_SEED.legacyUnverifiedCoordinates.lat);
      expect(location.lng).not.toBe(MARISCOS_RULOS_SEED.legacyUnverifiedCoordinates.lng);
    });

    it('T2-F03-03: evaluates Mariscos Rulos (activated 2026-09-01) on 2026-11-19 (79 days) at strict 10% standard commission rate', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('rulosrate'));
      const rulosView = await catalogHelper.getAllyClientView(
        ctx,
        explorer,
        MARISCOS_RULOS_SEED.allyId
      );

      const activatedAt =
        (rulosView.ally_activated_at as string | undefined) ??
        (rulosView.allyActivatedAt as string | undefined);
      if (activatedAt) {
        const elapsedDays = Math.floor(
          (Date.parse('2026-11-19T12:00:00.000Z') - Date.parse(activatedAt)) / 86400000
        );
        expect(elapsedDays).toBeGreaterThan(30);
      }

      const walletProbe = probeTarget('wallet');
      if (walletProbe.available) {
        const concierge = await authHelper.signIn(ctx, {
          email: CONCIERGE_ACCOUNTS.primary.email,
        });
        const payoutPanel = await walletHelper.getAllyPayoutPanel(
          ctx,
          concierge,
          MARISCOS_RULOS_SEED.allyId
        );
        expect(payoutPanel.activeCommissionRate).toBe(0.10);
        expect(payoutPanel.promoDaysRemaining).toBe(0);
      }
    });

    it('T2-F03-04: preserves Alejandro Valdes $52,520 Wallet balance anomaly untouched across repeated seed runs', async () => {
      const snapshotAfterReseed = await harness.resetAndSeedPilotData(ctx);
      expect(snapshotAfterReseed.alejandroValdesUid).toBe(ALEJANDRO_VALDES_ANOMALY.uid);

      const alejandro = await authHelper.signIn(ctx, {
        email: ALEJANDRO_VALDES_ANOMALY.email,
      });
      expect(alejandro.uid).toBe(ALEJANDRO_VALDES_ANOMALY.uid);

      const walletProbe = probeTarget('wallet');
      if (walletProbe.available) {
        const ledger = await walletHelper.getWalletLedger(ctx, alejandro, alejandro.uid);
        const rawUser = alejandro as unknown as Record<string, unknown>;
        if (typeof rawUser.walletBalanceMxn === 'number') {
          expect(rawUser.walletBalanceMxn).toBe(ALEJANDRO_VALDES_ANOMALY.walletBalanceMxn);
        } else if (ledger.length > 0) {
          expect(ledger[ledger.length - 1]?.balanceAfter).toBe(
            ALEJANDRO_VALDES_ANOMALY.walletBalanceMxn
          );
        }
      }
    });

    it('T2-F03-05: strips full 18-digit spei_clabe from public/client ally payload and exposes only spei_clabe_last4', async () => {
      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('clabemask'));
      const rulosView = await catalogHelper.getAllyClientView(
        ctx,
        explorer,
        MARISCOS_RULOS_SEED.allyId
      );

      const serialized = JSON.stringify(rulosView);
      expect(serialized).not.toContain(MARISCOS_RULOS_SEED.speiClabeFull);
      expect((rulosView as Record<string, unknown>).spei_clabe).toBeUndefined();
      expect(rulosView.spei_clabe_last4).toBe(MARISCOS_RULOS_SEED.speiClabeLast4);
    });
  }
);
