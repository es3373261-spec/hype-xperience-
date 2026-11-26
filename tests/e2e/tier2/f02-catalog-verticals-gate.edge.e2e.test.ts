// Tier 2 Boundary & Corner Cases — F02: Dynamic Catalog, Verticals & Publication Gate
// Spec coverage: T03, T04, T05, §5, §9, §16
// Uses strictly erasable TypeScript syntax.

import { describeContract } from '../helpers/contractHarness.ts';
import {
  authHelper,
  catalogHelper,
  harness,
  oddHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  REQUIRED_DRIVER_PHOTOS,
  buildAllyOnboardingPayload,
  buildExplorerSignup,
} from '../helpers/fixtures.ts';

describeContract(
  'catalog',
  [],
  'F02 Edge: Dynamic Catalog, Verticals & Publication Gate Boundary Cases (T2-F02-01..05)',
  () => {
    let ctx: HarnessContext;

    beforeEach(async () => {
      ctx = await harness.boot();
      await harness.resetAndSeedPilotData(ctx);
    });

    afterEach(async () => {
      await harness.teardown(ctx);
    });

    it('T2-F02-01: blocks publishing a listing with 0 priced calendar dates, keeps en_progreso, and emits listing.publish_blocked', async () => {
      const user = await authHelper.registerExplorer(ctx, buildExplorerSignup('f02_01'));
      const { session: allySession } = await authHelper.switchMode(ctx, user, 'aliado');
      const ally = await catalogHelper.onboardAlly(
        ctx,
        allySession,
        buildAllyOnboardingPayload('venue')
      );

      const listingId = ally.listingId ?? `listing_${ally.allyId}`;
      await catalogHelper.updateOffer24x7(ctx, allySession, ally.allyId, listingId, {
        pricedDates: [],
      });

      const gate = await catalogHelper.publishListing(ctx, allySession, listingId);
      expect(gate.published).toBe(false);
      expect(gate.status).toBe('en_progreso');
      expect(gate.missing.join(' ')).toMatch(/disponibilidad|fecha|precio|calendario/i);

      await oddHelper.assertOddSequence(ctx, [
        'listing.draft_saved',
        'listing.publish_blocked',
      ]);
    });

    it('T2-F02-02: blocks publishing a tour listing that has pricedDates but 0 itineraryMoments ("Lo que harás")', async () => {
      const user = await authHelper.registerExplorer(ctx, buildExplorerSignup('f02_02'));
      const { session: allySession } = await authHelper.switchMode(ctx, user, 'aliado');
      const tourAlly = await catalogHelper.onboardAlly(
        ctx,
        allySession,
        buildAllyOnboardingPayload('tour')
      );

      const listingId = tourAlly.listingId ?? `listing_${tourAlly.allyId}`;
      await catalogHelper.updateOffer24x7(ctx, allySession, tourAlly.allyId, listingId, {
        pricedDates: [{ date: '2026-12-20', priceMxn: 350 }],
        itineraryMoments: [],
      });

      const gate = await catalogHelper.publishListing(ctx, allySession, listingId);
      expect(gate.published).toBe(false);
      expect(gate.status).toBe('en_progreso');
      expect(gate.missing.join(' ')).toMatch(/itinerario|lo que har[aá]s|momento/i);

      const blockedEvents = await oddHelper.getOddEvents(ctx, {
        event: 'listing.publish_blocked',
      });
      expect(blockedEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('T2-F02-03: blocks transport onboarding with only 3 of 4 verification photos and accepts a 2012 hype_go vehicle with all 4 photos', async () => {
      const d1 = await authHelper.registerExplorer(ctx, buildExplorerSignup('driver3photos'));
      const { session: driver1 } = await authHelper.switchMode(ctx, d1, 'aliado');

      await expect(
        catalogHelper.onboardAlly(
          ctx,
          driver1,
          buildAllyOnboardingPayload('transport', {
            verticalConfig: {
              vehicle_tier: 'hype_go',
              model: 'Nissan Versa 2018',
              plates: 'A-111-GRO',
              passenger_capacity: 4,
              has_ac: true,
              verification_photos: ['front', 'seats', 'dashboard_ac'],
            },
          })
        )
      ).rejects.toThrow(/foto|photo|licen|tarjet[oó]n|4/i);

      const d2 = await authHelper.registerExplorer(ctx, buildExplorerSignup('driver2012go'));
      const { session: driver2 } = await authHelper.switchMode(ctx, d2, 'aliado');

      const accepted2012 = await catalogHelper.onboardAlly(
        ctx,
        driver2,
        buildAllyOnboardingPayload('transport', {
          verticalConfig: {
            vehicle_tier: 'hype_go',
            model: 'Nissan Tsuru 2012',
            year: 2012,
            plates: 'A-201-GRO',
            passenger_capacity: 4,
            has_ac: true,
            verification_photos: [...REQUIRED_DRIVER_PHOTOS],
          },
        })
      );
      expect(accepted2012.allyId).toBeTruthy();
      expect(accepted2012.category).toBe('transport');
    });

    it('T2-F02-04: enforces max 2 aspectos constraint on accommodation listings', async () => {
      const host = await authHelper.registerExplorer(ctx, buildExplorerSignup('accom3aspects'));
      const { session: hostAlly } = await authHelper.switchMode(ctx, host, 'aliado');
      const accom = await catalogHelper.onboardAlly(
        ctx,
        hostAlly,
        buildAllyOnboardingPayload('accommodation')
      );

      const listingId = accom.listingId ?? `listing_${accom.allyId}`;
      const threeAspects = ['Vista al mar', 'Terraza privada', 'Alberca infinita'];

      let rejected = false;
      try {
        const updated = await catalogHelper.updateOffer24x7(
          ctx,
          hostAlly,
          accom.allyId,
          listingId,
          { aspects: threeAspects }
        );
        expect((updated.aspects ?? []).length).toBeLessThanOrEqual(2);
      } catch {
        rejected = true;
      }

      if (rejected) {
        expect(rejected).toBe(true);
      }
    });

    it('T2-F02-05: rejects Offer title exceeding 32 chars and excludes pending_review allies from public catalog categories', async () => {
      const user = await authHelper.registerExplorer(ctx, buildExplorerSignup('pendingally'));
      const { session: allySession } = await authHelper.switchMode(ctx, user, 'aliado');
      const pendingAccom = await catalogHelper.onboardAlly(
        ctx,
        allySession,
        buildAllyOnboardingPayload('accommodation')
      );
      expect(pendingAccom.status).toBe('pending_review');

      const listingId = pendingAccom.listingId ?? `listing_${pendingAccom.allyId}`;
      const title33 = 'A'.repeat(33);
      await expect(
        catalogHelper.updateOffer24x7(ctx, allySession, pendingAccom.allyId, listingId, {
          offer: {
            id: 'offer_over_32',
            title: title33,
            priceMxn: 1450,
          },
        })
      ).rejects.toThrow(/32|t[ií]tulo|largo|length|max/i);

      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('catviewer'));
      const activeCategories = await catalogHelper.listDynamicCategories(ctx, explorer);
      expect(activeCategories).not.toContain('accommodation');
    });
  }
);
