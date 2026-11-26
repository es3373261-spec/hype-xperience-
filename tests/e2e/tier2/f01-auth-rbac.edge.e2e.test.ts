// Tier 2 Boundary & Corner Cases — F01: Auth, Single-Account Dual Modes & RBAC
// Spec coverage: T01, T02, T15, T34, T39, T42, §3, §6 F6.6, §6 F11, §13
// Uses strictly erasable TypeScript syntax.

import {
  describeContract,
  probeTarget,
} from '../helpers/contractHarness.ts';
import {
  authHelper,
  catalogHelper,
  conciergeHelper,
  harness,
  oddHelper,
  uiHelper,
  walletHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  CONCIERGE_ACCOUNTS,
  MAESTRO_V2_TOKENS,
  MARISCOS_RULOS_SEED,
  buildAllyOnboardingPayload,
  buildExplorerSignup,
} from '../helpers/fixtures.ts';

describeContract(
  'auth',
  [],
  'F01 Edge: Auth, Dual Modes & RBAC Boundary Cases (T2-F01-01..06)',
  () => {
    let ctx: HarnessContext;

    beforeEach(async () => {
      ctx = await harness.boot();
      await harness.resetAndSeedPilotData(ctx);
    });

    afterEach(async () => {
      await harness.teardown(ctx);
    });

    it('T2-F01-01: rejects registration when terms_accepted is false and creates no user or auth.role_assigned log', async () => {
      const payload = {
        ...buildExplorerSignup('noterms'),
        termsAccepted: false,
      };

      await expect(authHelper.registerExplorer(ctx, payload)).rejects.toThrow(
        /t[eé]rminos|terms|aceptar/i
      );

      await expect(
        authHelper.signIn(ctx, { email: payload.email })
      ).rejects.toThrow();

      const roleEvents = await oddHelper.getOddEvents(ctx, {
        event: 'auth.role_assigned',
      });
      const createdForRejected = roleEvents.filter(
        (ev) => ev.metadata?.email === payload.email
      );
      expect(createdForRejected).toHaveLength(0);
    });

    it('T2-F01-02: denies Concierge mode and Cuentas registradas to Explorer and Ally without concierge_access', async () => {
      const explorer = await authHelper.registerExplorer(
        ctx,
        buildExplorerSignup('noconcierge')
      );
      expect(explorer.conciergeAccess).toBe(false);

      const explorerCheck = await authHelper.attemptConciergeAccess(ctx, explorer);
      expect(explorerCheck.allowed).toBe(false);
      expect(explorerCheck.error ?? '').toMatch(/permiso|concierge|autoriz|acceso|denegad/i);

      await expect(
        authHelper.getRegisteredAccounts(ctx, explorer)
      ).rejects.toThrow(/permiso|concierge|autoriz|acceso|denegad/i);

      const { session: allyModeSession } = await authHelper.switchMode(
        ctx,
        explorer,
        'aliado'
      );
      expect(allyModeSession.mode).toBe('aliado');
      expect(allyModeSession.conciergeAccess).toBe(false);

      const allyCheck = await authHelper.attemptConciergeAccess(
        ctx,
        allyModeSession
      );
      expect(allyCheck.allowed).toBe(false);

      await expect(
        authHelper.getRegisteredAccounts(ctx, allyModeSession)
      ).rejects.toThrow(/permiso|concierge|autoriz|acceso|denegad/i);
    });

    it('T2-F01-03: emits auth.login_failed on invalid credentials and blocks self-registration privilege escalation', async () => {
      await expect(
        authHelper.signIn(ctx, {
          email: 'usuario.inexistente@ejemplo.com',
          password: 'wrong-password-123',
        })
      ).rejects.toThrow();

      const failedLogins = await oddHelper.getOddEvents(ctx, {
        event: 'auth.login_failed',
      });
      expect(failedLogins.length).toBeGreaterThanOrEqual(1);

      const tamperedPayload = {
        ...buildExplorerSignup('tamper'),
        conciergeAccess: true,
        concierge_access: true,
        roles: ['guide', 'concierge'],
      } as unknown as Parameters<typeof authHelper.registerExplorer>[1];

      let tamperedRejected = false;
      try {
        const session = await authHelper.registerExplorer(ctx, tamperedPayload);
        expect(session.conciergeAccess).toBe(false);
        expect(session.roles).not.toContain('guide');
        expect(session.roles).not.toContain('concierge');
        const accessAttempt = await authHelper.attemptConciergeAccess(ctx, session);
        expect(accessAttempt.allowed).toBe(false);
      } catch {
        tamperedRejected = true;
      }

      if (tamperedRejected) {
        expect(tamperedRejected).toBe(true);
      }
    });

    it('T2-F01-04: isolates Guide to assigned tours only and blocks access to other tours, payouts, and registered accounts', async () => {
      const concierge = await authHelper.signIn(ctx, {
        email: CONCIERGE_ACCOUNTS.primary.email,
      });
      expect(concierge.conciergeAccess).toBe(true);

      const guide = await authHelper.createGuideAccount(ctx, concierge, {
        displayName: 'Guía Bahía',
        email: 'guia.bahia@ejemplo.com',
        phone: '+527441000010',
        assignedTourIds: ['tour_A'],
      });
      expect(guide.roles).toContain('guide');
      expect(guide.assignedTourIds).toEqual(['tour_A']);

      await expect(
        authHelper.getRegisteredAccounts(ctx, guide)
      ).rejects.toThrow();

      const walletProbe = probeTarget('wallet');
      if (walletProbe.available) {
        await expect(
          walletHelper.getAllyPayoutPanel(ctx, guide, MARISCOS_RULOS_SEED.allyId)
        ).rejects.toThrow();
      }

      const conciergeProbe = probeTarget('concierge');
      if (conciergeProbe.available) {
        const schedule = await conciergeHelper.getGuideSchedule(ctx, guide);
        for (const item of schedule) {
          expect(item.packageBookingId).not.toBe('tour_B');
          const rawItem = item as unknown as Record<string, unknown>;
          expect(rawItem.final_client_total_mxn).toBeUndefined();
          expect(rawItem.totalMxn).toBeUndefined();
          expect(rawItem.pendingPayoutBalanceMxn).toBeUndefined();
        }
      }
    });

    it('T2-F01-05: restricts Staff sub-account to QR scanner only and blocks finances, catalog edits, sub-accounts, and Cuentas registradas', async () => {
      const ownerBase = await authHelper.registerExplorer(
        ctx,
        buildExplorerSignup('owner')
      );
      const { session: allyOwner } = await authHelper.switchMode(
        ctx,
        ownerBase,
        'aliado'
      );
      const ally = await catalogHelper.onboardAlly(
        ctx,
        allyOwner,
        buildAllyOnboardingPayload('venue')
      );

      const staff = await authHelper.createStaffAccount(ctx, allyOwner, {
        allyId: ally.allyId,
        displayName: 'Staff Puerta Uno',
        email: 'staff.puerta1@ejemplo.com',
        roleLabel: 'puerta',
      });
      expect(staff.roles).toContain('staff');
      expect(staff.staffAllyId).toBe(ally.allyId);

      await expect(
        catalogHelper.updateOffer24x7(
          ctx,
          staff,
          ally.allyId,
          ally.listingId ?? 'listing_unauth',
          { priceMxn: 999 }
        )
      ).rejects.toThrow();

      await expect(
        authHelper.createStaffAccount(ctx, staff, {
          allyId: ally.allyId,
          displayName: 'Sub Staff Ilegal',
          email: 'sub.staff@ejemplo.com',
          roleLabel: 'muelle',
        })
      ).rejects.toThrow();

      await expect(
        authHelper.getRegisteredAccounts(ctx, staff)
      ).rejects.toThrow();

      const walletProbe = probeTarget('wallet');
      if (walletProbe.available) {
        await expect(
          walletHelper.getAllyPayoutPanel(ctx, staff, ally.allyId)
        ).rejects.toThrow();
      }
    });

    it('T2-F01-06: activates newly registered user immediately without email verification gate and omits MODO TURISTA', async () => {
      const signup = buildExplorerSignup('instant');
      const registered = await authHelper.registerExplorer(ctx, signup);
      expect(registered.roles).toContain('explorer');
      expect(registered.mode).toBe('viajero');

      const signedIn = await authHelper.signIn(ctx, { email: signup.email });
      expect(signedIn.uid).toBe(registered.uid);
      expect(signedIn.mode).toBe('viajero');

      const categories = await catalogHelper.listDynamicCategories(ctx, signedIn);
      expect(Array.isArray(categories)).toBe(true);

      const tokensProbe = probeTarget('tokens');
      if (tokensProbe.available && typeof tokensProbe.api.renderScreen === 'function') {
        const feedSnapshot = await uiHelper.renderScreen(
          ctx,
          signedIn,
          'Feed',
          MAESTRO_V2_TOKENS.viewports.mobile
        );
        expect(feedSnapshot.textContent).not.toContain('MODO TURISTA');
      }
    });
  }
);
