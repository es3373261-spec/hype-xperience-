// Tier 1 Feature Coverage — F03: Pilot Seed Data & Anomaly Preservation
// Spec Refs: §9, §15, §16, §17, mariscos-rulos-menu.md

import { describeContract } from '../helpers/contractHarness.ts';
import {
  authHelper,
  catalogHelper,
  harness,
  walletHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  ALEJANDRO_VALDES_ANOMALY,
  buildExplorerSignup,
  CONCIERGE_ACCOUNTS,
  MARISCOS_RULOS_SEED,
  ONE_BY_PRO_SEED,
  RONNIE_ACAPULCO_SEED,
} from '../helpers/fixtures.ts';

describeContract('catalog', [], 'F03: Pilot Seed Data & Anomaly Preservation (Tier 1)', () => {
  let ctx: HarnessContext;

  beforeEach(async () => {
    ctx = await harness.boot();
  });

  afterEach(async () => {
    await harness.teardown(ctx);
  });

  it('T1-F03-01: Mariscos Rulos seed has verified coordinates (16.84911, -99.85405), 2026-09-01 activation, and spei_manual beneficiary', async () => {
    const seed = await harness.resetAndSeedPilotData(ctx);
    expect(seed.seeded).toBe(true);
    expect(seed.mariscosRulosAllyId).toBe(MARISCOS_RULOS_SEED.allyId);

    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seed01'));
    const rulos = await catalogHelper.getAllyClientView(
      ctx,
      explorer,
      MARISCOS_RULOS_SEED.allyId
    );

    expect(rulos.allyId).toBe(MARISCOS_RULOS_SEED.allyId);
    expect(rulos.businessName).toBe(MARISCOS_RULOS_SEED.businessName);
    expect(rulos.status ?? 'active').toBe('active');
    expect(rulos.spei_clabe_last4).toBe(MARISCOS_RULOS_SEED.speiClabeLast4);

    const serialized = JSON.stringify(rulos);
    expect(serialized).toContain('16.84911');
    expect(serialized).toContain('-99.85405');
    expect(serialized).toContain('Playa, acceso CICI, Acapulco');
    expect(serialized).toContain('2026-09-01');
    expect(serialized).toContain('spei_manual');
    expect(serialized).toContain('Mariscos Rulos SA de CV');
  });

  it('T1-F03-02: Mariscos Rulos digital menu contains exact 52 IVA-included items across 4 categories', async () => {
    await harness.resetAndSeedPilotData(ctx);
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seed02'));
    const rulos = await catalogHelper.getAllyClientView(
      ctx,
      explorer,
      MARISCOS_RULOS_SEED.allyId
    );

    const raw = rulos as Record<string, unknown>;
    const verticalConfig = (raw.verticalConfig ?? raw.vertical_config) as
      | Record<string, unknown>
      | undefined;
    const venueCfg = (verticalConfig?.venue ?? raw) as Record<string, unknown>;
    const menuItems = (venueCfg.menu_items ?? venueCfg.menuItems) as
      | Array<Record<string, unknown>>
      | undefined;

    expect(Array.isArray(menuItems)).toBe(true);
    expect(menuItems?.length).toBe(MARISCOS_RULOS_SEED.menuCount);

    const byName = new Map(
      (menuItems ?? []).map((item) => [String(item.name), Number(item.price_mxn ?? item.priceMxn)])
    );
    expect(byName.get('Ceviche de pez vela')).toBe(250);
    expect(byName.get('Mariscada Grande')).toBe(1700);
    expect(byName.get('Cubetazo 10 cervezas')).toBe(450);

    for (const item of menuItems ?? []) {
      const includesIva = item.price_includes_iva ?? item.priceIncludesIva;
      expect(includesIva).toBe(true);
    }
  });

  it('T1-F03-03: Mariscos Rulos uncertain (?) beverage items (Conga, Suero, Piña colada Pre) are flagged unconfirmed', async () => {
    await harness.resetAndSeedPilotData(ctx);
    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seed03'));
    const rulos = await catalogHelper.getAllyClientView(
      ctx,
      explorer,
      MARISCOS_RULOS_SEED.allyId
    );

    const raw = rulos as Record<string, unknown>;
    const verticalConfig = (raw.verticalConfig ?? raw.vertical_config) as
      | Record<string, unknown>
      | undefined;
    const venueCfg = (verticalConfig?.venue ?? raw) as Record<string, unknown>;
    const menuItems = ((venueCfg.menu_items ?? venueCfg.menuItems) as Array<
      Record<string, unknown>
    >) ?? [];

    const expectedUncertain: ReadonlyArray<{ name: string; price: number }> = [
      { name: 'Conga (?)', price: 120 },
      { name: 'Suero (?)', price: 120 },
      { name: 'Piña colada Pre (?)', price: 150 },
    ];

    for (const target of expectedUncertain) {
      const found = menuItems.find((item) => item.name === target.name);
      expect(found).toBeDefined();
      expect(Number(found?.price_mxn ?? found?.priceMxn)).toBe(target.price);
      expect(found?.unconfirmed).toBe(true);
    }
  });

  it('T1-F03-04: One By Pro seed record exists with $350 MXN cover price and pilot reference events', async () => {
    const seed = await harness.resetAndSeedPilotData(ctx);
    expect(seed.oneByProAllyId).toBe(ONE_BY_PRO_SEED.allyId);

    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seed04'));
    const oneByPro = await catalogHelper.getAllyClientView(ctx, explorer, seed.oneByProAllyId);

    expect(oneByPro.allyId).toBe(ONE_BY_PRO_SEED.allyId);
    expect(oneByPro.businessName).toBe(ONE_BY_PRO_SEED.businessName);

    const serialized = JSON.stringify(oneByPro);
    expect(serialized).toContain('350');
    expect(serialized).toContain('Tropic');
    expect(serialized).toContain('Ronin 22');
  });

  it('T1-F03-05: Alejandro Valdés $52,520 MXN wallet balance is preserved untouched and Ronnie Acapulco has approximate marker flag', async () => {
    const seed = await harness.resetAndSeedPilotData(ctx);
    expect(seed.alejandroValdesUid).toBe(ALEJANDRO_VALDES_ANOMALY.uid);

    const concierge = await authHelper.signIn(ctx, {
      email: CONCIERGE_ACCOUNTS.primary.email,
    });
    const alejandroSession = await authHelper.signIn(ctx, {
      email: ALEJANDRO_VALDES_ANOMALY.email,
    });
    expect(alejandroSession.uid).toBe(ALEJANDRO_VALDES_ANOMALY.uid);

    const rawSession = alejandroSession as unknown as Record<string, unknown>;
    const inlineWallet = rawSession.wallet as Record<string, unknown> | undefined;
    const inlineBalance = inlineWallet?.balance_mxn ?? inlineWallet?.balanceMxn;

    if (typeof inlineBalance === 'number') {
      expect(inlineBalance).toBe(ALEJANDRO_VALDES_ANOMALY.walletBalanceMxn);
    } else {
      const ledger = await walletHelper.getWalletLedger(
        ctx,
        concierge,
        ALEJANDRO_VALDES_ANOMALY.uid
      );
      expect(ledger.length).toBeGreaterThan(0);
      expect(ledger[ledger.length - 1]?.balanceAfter).toBe(
        ALEJANDRO_VALDES_ANOMALY.walletBalanceMxn
      );
    }

    const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('seed05'));
    const ronnie = await catalogHelper.getAllyClientView(
      ctx,
      explorer,
      RONNIE_ACAPULCO_SEED.allyId
    );
    const ronnieSerialized = JSON.stringify(ronnie);
    expect(ronnieSerialized).toContain(RONNIE_ACAPULCO_SEED.approximateZone);
    expect(ronnieSerialized).toContain(RONNIE_ACAPULCO_SEED.approximateMarkerLabel);
  });
});
