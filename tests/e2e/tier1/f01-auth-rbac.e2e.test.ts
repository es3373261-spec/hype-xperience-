// Tier 1 Feature Coverage — F01: Auth, Single-Account Dual Modes, Hidden Concierge, Guide & Staff RBAC
// Spec Refs: T01, T02, T15, T39, T42, §3, §6 F6.6, F11

import { describeContract } from '../helpers/contractHarness.ts';
import {
  authHelper,
  harness,
  oddHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  CONCIERGE_ACCOUNTS,
  MAESTRO_V2_TOKENS,
} from '../helpers/fixtures.ts';

describeContract('auth', [], 'F01: Auth, Modes & RBAC (Tier 1)', () => {
  let ctx: HarnessContext;

  beforeEach(async () => {
    ctx = await harness.boot();
  });

  afterEach(async () => {
    await harness.teardown(ctx);
  });

  it('T1-F01-01: minimalist signup creates an immediately active Explorer account without email verification and emits auth.role_assigned', async () => {
    const sofia = await authHelper.registerExplorer(ctx, {
      displayName: 'Sofía',
      email: 'sofia@ejemplo.com',
      phone: '+527441000001',
      termsAccepted: true,
      allergies: ['nueces'],
    });

    expect(typeof sofia.uid).toBe('string');
    expect(sofia.uid.length).toBeGreaterThan(0);
    expect(sofia.displayName).toBe('Sofía');
    expect(sofia.email).toBe('sofia@ejemplo.com');
    expect(sofia.roles).toContain('explorer');
    expect(sofia.mode).toBe('viajero');
    expect(sofia.conciergeAccess).toBe(false);

    // Account is active immediately (no email verification gate blocking sign-in)
    const signedIn = await authHelper.signIn(ctx, { email: 'sofia@ejemplo.com' });
    expect(signedIn.uid).toBe(sofia.uid);
    expect(signedIn.mode).toBe('viajero');

    await oddHelper.assertOddSequence(ctx, ['auth.role_assigned']);
    const events = await oddHelper.getOddEvents(ctx, {
      event: 'auth.role_assigned',
      actorUid: sofia.uid,
    });
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('T1-F01-02: single account toggles between Explorador (viajero) and Aliado (aliado) with 900ms splash and emits account.mode_switched', async () => {
    const sofia = await authHelper.registerExplorer(ctx, {
      displayName: 'Sofía',
      email: 'sofia.toggle@ejemplo.com',
      phone: '+527441000002',
      termsAccepted: true,
    });

    expect(sofia.mode).toBe('viajero');

    const toAliado = await authHelper.switchMode(ctx, sofia, 'aliado');
    expect(toAliado.session.uid).toBe(sofia.uid);
    expect(toAliado.session.mode).toBe('aliado');
    expect(toAliado.splashDurationMs).toBe(MAESTRO_V2_TOKENS.splash.modeSwitchDurationMs);

    const toViajero = await authHelper.switchMode(ctx, toAliado.session, 'viajero');
    expect(toViajero.session.uid).toBe(sofia.uid);
    expect(toViajero.session.mode).toBe('viajero');
    expect(toViajero.splashDurationMs).toBe(MAESTRO_V2_TOKENS.splash.modeSwitchDurationMs);

    await oddHelper.assertOddSequence(ctx, ['account.mode_switched']);
    const modeEvents = await oddHelper.getOddEvents(ctx, {
      event: 'account.mode_switched',
      actorUid: sofia.uid,
    });
    expect(modeEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('T1-F01-03: DB-gated concierge_access grants Hype Control and Cuentas registradas access to primary and legacy admin accounts', async () => {
    await harness.resetAndSeedPilotData(ctx);

    const primaryAdmin = await authHelper.signIn(ctx, {
      email: CONCIERGE_ACCOUNTS.primary.email,
    });
    expect(primaryAdmin.conciergeAccess).toBe(true);

    const primaryCheck = await authHelper.attemptConciergeAccess(ctx, primaryAdmin);
    expect(primaryCheck.allowed).toBe(true);

    const registeredAccounts = await authHelper.getRegisteredAccounts(ctx, primaryAdmin);
    expect(Array.isArray(registeredAccounts)).toBe(true);
    expect(registeredAccounts.length).toBeGreaterThanOrEqual(2);
    expect(
      registeredAccounts.some((acc) => acc.email === CONCIERGE_ACCOUNTS.primary.email)
    ).toBe(true);

    const legacyAdmin = await authHelper.signIn(ctx, {
      email: CONCIERGE_ACCOUNTS.legacy.email,
    });
    expect(legacyAdmin.conciergeAccess).toBe(true);

    const legacyCheck = await authHelper.attemptConciergeAccess(ctx, legacyAdmin);
    expect(legacyCheck.allowed).toBe(true);
  });

  it('T1-F01-04: Concierge creates a Guide account scoped exclusively to assigned_tour_ids without concierge access', async () => {
    await harness.resetAndSeedPilotData(ctx);
    const concierge = await authHelper.signIn(ctx, {
      email: CONCIERGE_ACCOUNTS.primary.email,
    });

    const guide = await authHelper.createGuideAccount(ctx, concierge, {
      displayName: 'Carlos Guía',
      email: 'carlos.guia@ejemplo.com',
      phone: '+527441000099',
      assignedTourIds: ['tour_bahia_1'],
    });

    expect(guide.roles).toContain('guide');
    expect(guide.conciergeAccess).toBe(false);
    expect(guide.assignedTourIds).toEqual(['tour_bahia_1']);

    const signedInGuide = await authHelper.signIn(ctx, {
      email: 'carlos.guia@ejemplo.com',
    });
    expect(signedInGuide.uid).toBe(guide.uid);
    expect(signedInGuide.assignedTourIds).toEqual(['tour_bahia_1']);

    const conciergeAttempt = await authHelper.attemptConciergeAccess(ctx, signedInGuide);
    expect(conciergeAttempt.allowed).toBe(false);

    await oddHelper.assertOddSequence(ctx, ['auth.role_assigned']);
  });

  it('T1-F01-05: Ally owner creates a Staff sub-account scoped to staff_ally_id and emits staff.created', async () => {
    const owner = await authHelper.registerExplorer(ctx, {
      displayName: 'Dueño Rulos',
      email: 'dueno.rulos@ejemplo.com',
      phone: '+527441000050',
      termsAccepted: true,
    });
    const allyOwner = (await authHelper.switchMode(ctx, owner, 'aliado')).session;

    const staff = await authHelper.createStaffAccount(ctx, allyOwner, {
      allyId: 'ally_mariscos_rulos',
      displayName: 'Staff Puerta 1',
      email: 'staff.puerta1@ejemplo.com',
      roleLabel: 'puerta',
    });

    expect(staff.roles).toContain('staff');
    expect(staff.staffAllyId).toBe('ally_mariscos_rulos');
    expect(staff.conciergeAccess).toBe(false);

    const signedInStaff = await authHelper.signIn(ctx, {
      email: 'staff.puerta1@ejemplo.com',
    });
    expect(signedInStaff.uid).toBe(staff.uid);
    expect(signedInStaff.staffAllyId).toBe('ally_mariscos_rulos');

    const conciergeAttempt = await authHelper.attemptConciergeAccess(ctx, signedInStaff);
    expect(conciergeAttempt.allowed).toBe(false);

    await oddHelper.assertOddSequence(ctx, ['staff.created']);
  });
});
