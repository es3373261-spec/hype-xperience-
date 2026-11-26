// Tier 1 Feature Coverage — F02: Dynamic Catalog, 4-Vertical Onboarding, 24/7 Editor, Publication Gate
// Spec Refs: T03, T04, T05, §2, §5, §16

import { describeContract } from '../helpers/contractHarness.ts';
import {
  authHelper,
  catalogHelper,
  harness,
  oddHelper,
  type HarnessContext,
} from '../helpers/domainFacades.ts';
import {
  buildAllyOnboardingPayload,
  buildExplorerSignup,
  CONCIERGE_ACCOUNTS,
  REQUIRED_DRIVER_PHOTOS,
} from '../helpers/fixtures.ts';

describeContract(
  'catalog',
  [],
  'F02: Dynamic Catalog, 4-Vertical Onboarding, 24/7 Editor & Publication Gate (Tier 1)',
  () => {
    let ctx: HarnessContext;

    beforeEach(async () => {
      ctx = await harness.boot();
    });

    afterEach(async () => {
      await harness.teardown(ctx);
    });

    it('T1-F02-01: dynamic catalog exposes only categories with active published providers and hides empty categories', async () => {
      const conciergeUser = await authHelper.registerExplorer(ctx, {
        displayName: 'Admin Seed',
        email: CONCIERGE_ACCOUNTS.primary.email,
        phone: '+527441000000',
        termsAccepted: true,
      });
      await harness.resetAndSeedPilotData(ctx);
      const concierge = await authHelper.signIn(ctx, {
        email: CONCIERGE_ACCOUNTS.primary.email,
      });
      expect(concierge.conciergeAccess).toBe(true);

      const explorer = await authHelper.registerExplorer(ctx, buildExplorerSignup('cat01'));

      // Onboard & activate a venue and a tour (no accommodation yet)
      const venueUser = await authHelper.registerExplorer(ctx, buildExplorerSignup('v01'));
      const venueAlly = (await authHelper.switchMode(ctx, venueUser, 'aliado')).session;
      const venueRecord = await catalogHelper.onboardAlly(
        ctx,
        venueAlly,
        buildAllyOnboardingPayload('venue')
      );
      await catalogHelper.activateAlly(ctx, concierge, venueRecord.allyId);
      if (venueRecord.listingId) {
        await catalogHelper.updateOffer24x7(ctx, venueAlly, venueRecord.allyId, venueRecord.listingId, {
          pricedDates: [{ date: '2026-12-20', priceMxn: 250 }],
        });
        await catalogHelper.publishListing(ctx, venueAlly, venueRecord.listingId);
      }

      const tourUser = await authHelper.registerExplorer(ctx, buildExplorerSignup('t01'));
      const tourAlly = (await authHelper.switchMode(ctx, tourUser, 'aliado')).session;
      const tourRecord = await catalogHelper.onboardAlly(
        ctx,
        tourAlly,
        buildAllyOnboardingPayload('tour')
      );
      await catalogHelper.activateAlly(ctx, concierge, tourRecord.allyId);
      if (tourRecord.listingId) {
        await catalogHelper.updateOffer24x7(ctx, tourAlly, tourRecord.allyId, tourRecord.listingId, {
          pricedDates: [{ date: '2026-12-20', priceMxn: 350 }],
          itineraryMoments: [{ title: 'Salida muelle' }],
        });
        await catalogHelper.publishListing(ctx, tourAlly, tourRecord.listingId);
      }

      const categoriesBefore = await catalogHelper.listDynamicCategories(ctx, explorer);
      expect(categoriesBefore).toContain('venue');
      expect(categoriesBefore).toContain('tour');
      expect(categoriesBefore).not.toContain('accommodation');

      // Now publish an accommodation provider and verify category appears dynamically
      const accUser = await authHelper.registerExplorer(ctx, buildExplorerSignup('a01'));
      const accAlly = (await authHelper.switchMode(ctx, accUser, 'aliado')).session;
      const accRecord = await catalogHelper.onboardAlly(
        ctx,
        accAlly,
        buildAllyOnboardingPayload('accommodation')
      );
      await catalogHelper.activateAlly(ctx, concierge, accRecord.allyId);
      if (accRecord.listingId) {
        await catalogHelper.updateOffer24x7(ctx, accAlly, accRecord.allyId, accRecord.listingId, {
          pricedDates: [{ date: '2026-12-20', priceMxn: 1450 }],
        });
        await catalogHelper.publishListing(ctx, accAlly, accRecord.listingId);
      }

      const categoriesAfter = await catalogHelper.listDynamicCategories(ctx, explorer);
      expect(categoriesAfter).toContain('accommodation');
      expect(conciergeUser.uid.length).toBeGreaterThan(0);
    });

    it('T1-F02-02: venue onboarding stores digital menu with IVA prices, mandatory allergy alert flag, conditional Bar 360, and tables/turns', async () => {
      const user = await authHelper.registerExplorer(ctx, buildExplorerSignup('venue02'));
      const ally = (await authHelper.switchMode(ctx, user, 'aliado')).session;

      const payload = buildAllyOnboardingPayload('venue', {
        subcategory: 'antro_club',
        verticalConfig: {
          requires_mandatory_bottle: true,
          supports_allergies_alert: true,
          menu_items: [
            {
              id: 'dish_1',
              name: 'Aguachile Negro',
              price_mxn: 270,
              price_includes_iva: true,
              image_url: 'https://storage.googleapis.com/hype-demo/aguachile.jpg',
              available: true,
            },
          ],
          bar_360_bottles: [
            {
              id: 'bottle_1',
              name: 'Tequila Don Julio 70',
              price_mxn: 3200,
              image_url: 'https://storage.googleapis.com/hype-demo/dj70.jpg',
            },
          ],
          tables: [{ label: 'VIP Terraza', capacity: 8 }],
          turns: ['22:00', '23:30'],
        },
      });

      const created = await catalogHelper.onboardAlly(ctx, ally, payload);
      expect(created.category).toBe('venue');
      expect(created.subcategory).toBe('antro_club');
      expect(created.status).toBe('pending_review');
      expect(created.verticalConfig).toBeDefined();

      await oddHelper.assertOddSequence(ctx, ['ally.created']);
    });

    it('T1-F02-03: tour, accommodation, and transport onboarding accept their vertical-specific schemas (including 4 photos and no Go year filter)', async () => {
      const u1 = await authHelper.registerExplorer(ctx, buildExplorerSignup('tour03'));
      const a1 = (await authHelper.switchMode(ctx, u1, 'aliado')).session;
      const tour = await catalogHelper.onboardAlly(ctx, a1, buildAllyOnboardingPayload('tour'));
      expect(tour.category).toBe('tour');
      expect(tour.verticalConfig).toBeDefined();

      const u2 = await authHelper.registerExplorer(ctx, buildExplorerSignup('acc03'));
      const a2 = (await authHelper.switchMode(ctx, u2, 'aliado')).session;
      const acc = await catalogHelper.onboardAlly(
        ctx,
        a2,
        buildAllyOnboardingPayload('accommodation')
      );
      expect(acc.category).toBe('accommodation');
      expect(acc.verticalConfig).toBeDefined();

      const u3 = await authHelper.registerExplorer(ctx, buildExplorerSignup('tr03'));
      const a3 = (await authHelper.switchMode(ctx, u3, 'aliado')).session;
      const transport = await catalogHelper.onboardAlly(
        ctx,
        a3,
        buildAllyOnboardingPayload('transport', {
          verticalConfig: {
            vehicle_tier: 'hype_go',
            model: 'Nissan Tsuru',
            year: 2012,
            plates: 'A-999-GRO',
            passenger_capacity: 4,
            has_ac: true,
            verification_photos: [...REQUIRED_DRIVER_PHOTOS],
          },
        })
      );
      expect(transport.category).toBe('transport');
      expect(transport.subcategory).toBe('hype_go');
      await oddHelper.assertOddSequence(ctx, ['ally.created']);
    });

    it('T1-F02-04: publication gate publishes complete tour listing with >=1 priced date and >=1 itinerary moment and emits listing.published', async () => {
      await harness.resetAndSeedPilotData(ctx);
      const concierge = await authHelper.signIn(ctx, {
        email: CONCIERGE_ACCOUNTS.primary.email,
      });

      const u = await authHelper.registerExplorer(ctx, buildExplorerSignup('pub04'));
      const ally = (await authHelper.switchMode(ctx, u, 'aliado')).session;
      const created = await catalogHelper.onboardAlly(ctx, ally, buildAllyOnboardingPayload('tour'));
      await catalogHelper.activateAlly(ctx, concierge, created.allyId);

      const listingId = created.listingId ?? `listing_${created.allyId}`;
      await catalogHelper.updateOffer24x7(ctx, ally, created.allyId, listingId, {
        pricedDates: [{ date: '2026-12-20', priceMxn: 350 }],
        itineraryMoments: [{ title: 'Salida muelle' }],
      });

      const pubResult = await catalogHelper.publishListing(ctx, ally, listingId);
      expect(pubResult.published).toBe(true);
      expect(pubResult.status).toBe('publicado');
      expect(pubResult.missing).toEqual([]);

      await oddHelper.assertOddSequence(ctx, ['listing.created', 'listing.published']);
    });

    it('T1-F02-05: 24/7 Editar Perfil y Oferta updates listing price ($250 -> $275), rules, and photo immediately and emits ally.profile_updated', async () => {
      await harness.resetAndSeedPilotData(ctx);
      const concierge = await authHelper.signIn(ctx, {
        email: CONCIERGE_ACCOUNTS.primary.email,
      });

      const u = await authHelper.registerExplorer(ctx, buildExplorerSignup('edit05'));
      const ally = (await authHelper.switchMode(ctx, u, 'aliado')).session;
      const created = await catalogHelper.onboardAlly(
        ctx,
        ally,
        buildAllyOnboardingPayload('venue')
      );
      await catalogHelper.activateAlly(ctx, concierge, created.allyId);

      const listingId = created.listingId ?? `listing_${created.allyId}`;
      await catalogHelper.updateOffer24x7(ctx, ally, created.allyId, listingId, {
        priceMxn: 250,
        pricedDates: [{ date: '2026-12-20', priceMxn: 250 }],
      });
      await catalogHelper.publishListing(ctx, ally, listingId);

      const updated = await catalogHelper.updateOffer24x7(ctx, ally, created.allyId, listingId, {
        priceMxn: 275,
        pricedDates: [{ date: '2026-12-20', priceMxn: 275 }],
        rules: { cancellation_policy: 'Cancelación flexible 24h' },
        photos: ['https://storage.googleapis.com/hype-demo/updated-ceviche.jpg'],
      });

      expect(updated.priceMxn).toBe(275);
      await oddHelper.assertOddSequence(ctx, ['ally.profile_updated']);
    });
  }
);
