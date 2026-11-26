import {
  CatalogManager,
  MARISCOS_RULOS_MENU_ITEMS,
  DEMO_PRESERVED_ANOMALIES,
  calculateAllyCommissionInfo,
} from '../catalog/CatalogManager';
import { initializeFirebase, resetFirebaseInstance } from '../firebase/config';
import { mockStore } from '../firebase/mock';
import { clearOddLogs, getOddLogs } from '../observability/oddLogger';
import type { UserAccount } from '../types/user';

describe('M1 — Dynamic Catalog, 4 Verticals, Publication Gate, Commissions & Pilot Seed (T03, T04, T05, T08)', () => {
  let catalog: CatalogManager;

  const conciergeUser: UserAccount = {
    uid: 'u_concierge',
    display_name: 'One Xperience',
    email: 'es3373261@gmail.com',
    phone: '7440000001',
    terms_accepted: true,
    account_status: 'active',
    roles: ['explorer', 'ally'],
    mode: 'viajero',
    concierge_access: true,
    allergies: [],
    theme: 'dark',
    wallet: {
      balance_mxn: 0,
      currency: 'MXN',
      is_closed_loop: true,
      updated_at: '2026-11-19T00:00:00Z',
    },
  };

  const ownerUser: UserAccount = {
    uid: 'u_owner_1',
    display_name: 'Dueño Demo',
    email: 'owner@ejemplo.com',
    phone: '7441112233',
    terms_accepted: true,
    account_status: 'active',
    roles: ['explorer', 'ally'],
    mode: 'aliado',
    concierge_access: false,
    allergies: [],
    theme: 'dark',
    wallet: {
      balance_mxn: 0,
      currency: 'MXN',
      is_closed_loop: true,
      updated_at: '2026-11-19T00:00:00Z',
    },
  };

  const otherOwnerUser: UserAccount = {
    ...ownerUser,
    uid: 'u_owner_other',
    email: 'other@ejemplo.com',
  };

  const staffUser: UserAccount = {
    ...ownerUser,
    uid: 'u_staff_1',
    email: 'staff@ejemplo.com',
    roles: ['staff'],
    staff_ally_id: 'ally_1',
  };

  beforeEach(() => {
    resetFirebaseInstance();
    mockStore.reset();
    clearOddLogs();
    initializeFirebase({ mode: 'mock' });
    catalog = new CatalogManager();
  });

  describe('Dynamic category hiding (spec.md §2, §5)', () => {
    it('hides categories/verticals with 0 active allies and shows them once an ally is activated', async () => {
      expect(catalog.getVisibleCategories()).toEqual([]);
      expect(catalog.getActiveCategoriesForTourist()).toEqual([]);

      // Register a pending_review ally — still 0 active allies -> category remains hidden
      const ally = await catalog.registerAlly(ownerUser, {
        ally_category: 'tour',
        ally_subcategory: 'paseos_bahia',
        profile: {
          business_name: 'Yate Bahía',
          avatar_url: 'https://example.com/yate.jpg',
          description: 'Paseo por la bahía',
          location: { lat: 16.84, lng: -99.85, address: 'Malecón Acapulco' },
          languages: ['es'],
          gallery_photos: ['https://example.com/yate1.jpg'],
        },
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe_last4: '1234',
          spei_beneficiary_name: 'Yate Bahia SA',
          pending_payout_balance_mxn: 0,
          driver_commission_pool_mxn: 0,
        },
        vertical_config: {
          tour: {
            departure_dock: 'Parque de la Reina',
            schedule_slots: ['11:00', '16:00'],
            capacity_per_slot: 30,
            operational_checklist: ['Chaleco salvavidas', 'Bloqueador'],
          },
        },
      });

      expect(ally.status).toBe('pending_review');
      expect(catalog.getVisibleCategories()).toEqual([]);

      // Activate ally via Concierge -> 'tour' becomes visible
      const activated = await catalog.activateAlly(conciergeUser, ally.allyId);
      expect(activated.status).toBe('active');
      expect(activated.ally_activated_at).toBeTruthy();
      expect(catalog.getVisibleCategories()).toContain('tour');
      expect(catalog.getActiveCategoriesForTourist().length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('T03: 4 Verticals Conditional Onboarding Schemas & Validation', () => {
    it('provides conditional onboarding schemas and validates Venue (menu + IVA, allergies alert, conditional Bar 360, tables/turns)', () => {
      const schema = catalog.getOnboardingSchema('venue');
      expect(schema.fields).toEqual(
        expect.arrayContaining(['menu_items', 'supports_allergies_alert', 'bar_360_bottles', 'tables', 'turns'])
      );

      expect(
        catalog.isBar360Visible({
          requires_mandatory_bottle: false,
          supports_allergies_alert: true,
          menu_items: [],
          bar_360_bottles: [{ id: 'b1', name: 'Tequila', price_mxn: 2000 }],
        })
      ).toBe(false);

      expect(
        catalog.isBar360Visible({
          requires_mandatory_bottle: true,
          supports_allergies_alert: true,
          menu_items: [],
          bar_360_bottles: [{ id: 'b1', name: 'Tequila', price_mxn: 2000 }],
        })
      ).toBe(true);

      const validVenue = catalog.validateVerticalConfig('venue', {
        requires_mandatory_bottle: false,
        supports_allergies_alert: true,
        menu_items: [
          {
            id: 'm1',
            name: 'Ceviche',
            price_mxn: 250,
            iva_included: true,
            image_url: 'https://example.com/ceviche.jpg',
          },
        ],
        tables: [{ label: 'Mesa 1', capacity: 4 }],
        turns: ['13:00', '16:00'],
      });
      expect(validVenue.valid).toBe(true);

      const missingAllergyAlert = catalog.validateVerticalConfig('venue', {
        requires_mandatory_bottle: false,
        supports_allergies_alert: false,
        menu_items: [{ id: 'm1', name: 'Ceviche', price_mxn: 250, iva_included: true }],
      });
      expect(missingAllergyAlert.valid).toBe(false);
    });

    it('validates Tour (departure_dock, schedule_slots, capacity_per_slot, operational_checklist)', () => {
      const schema = catalog.getOnboardingSchema('tour');
      expect(schema.fields).toEqual(
        expect.arrayContaining([
          'departure_dock',
          'schedule_slots',
          'capacity_per_slot',
          'operational_checklist',
        ])
      );

      const validTour = catalog.validateVerticalConfig('tour', {
        departure_dock: 'Parque de la Reina',
        schedule_slots: ['11:00', '14:00'],
        capacity_per_slot: 40,
        operational_checklist: ['Llevar toalla', 'No vidrio'],
      });
      expect(validTour.valid).toBe(true);

      const invalidTour = catalog.validateVerticalConfig('tour', {
        departure_dock: '',
        schedule_slots: [],
        capacity_per_slot: 0,
        operational_checklist: [],
      });
      expect(invalidTour.valid).toBe(false);
    });

    it('validates Accommodation (night rates, check-in/out, max 2 aspectos enforced)', () => {
      const schema = catalog.getOnboardingSchema('accommodation');
      expect(schema.fields).toEqual(
        expect.arrayContaining(['price_per_night_mxn', 'check_in', 'check_out', 'aspectos'])
      );

      const validAccom = catalog.validateVerticalConfig('accommodation', {
        price_per_night_mxn: 1450,
        check_in: '15:00',
        check_out: '12:00',
        aspectos: ['Vista al mar', 'Alberca'],
      });
      expect(validAccom.valid).toBe(true);

      const tooManyAspects = catalog.validateVerticalConfig('accommodation', {
        price_per_night_mxn: 1450,
        check_in: '15:00',
        check_out: '12:00',
        aspectos: ['Vista al mar', 'Alberca', 'Jacuzzi'], // > 2 rejected!
      });
      expect(tooManyAspects.valid).toBe(false);
    });

    it('validates Transport (4 mandatory verification photos, no Go year filter, tier multipliers & hype_pro Concierge/VIP gate)', () => {
      const schema = catalog.getOnboardingSchema('transport');
      expect(schema.fields).toEqual(
        expect.arrayContaining(['vehicle_tier', 'verification_photos'])
      );

      // Fewer than 4 verification photos rejected
      const tooFewPhotos = catalog.validateVerticalConfig('transport', {
        vehicle_tier: 'hype_go',
        model_year: 2012,
        verification_photos: ['front', 'seats', 'dashboard_ac'], // only 3
      });
      expect(tooFewPhotos.valid).toBe(false);

      // Hype Go accepts older year as long as 4 photos exist (NO year filter rejection!)
      const validOldGo = catalog.validateVerticalConfig('transport', {
        vehicle_tier: 'hype_go',
        model_year: 2010,
        verification_photos: ['front', 'seats', 'dashboard_ac', 'license'],
      });
      expect(validOldGo.valid).toBe(true);

      expect(schema.tierMultipliers).toEqual({
        hype_go: 1.0,
        hype_confort: 1.25,
        hype_pro: 1.5,
      });

      // hype_pro restricted to Concierge / VIP
      expect(catalog.canSelectTransportTier('hype_go', ownerUser)).toBe(true);
      expect(catalog.canSelectTransportTier('hype_confort', ownerUser)).toBe(true);
      expect(catalog.canSelectTransportTier('hype_pro', ownerUser)).toBe(false);
      expect(catalog.canSelectTransportTier('hype_pro', conciergeUser)).toBe(true);
      expect(catalog.canSelectTransportTier('hype_pro', { ...ownerUser, is_vip: true })).toBe(true);
    });
  });

  describe('T04: Listing Publication Gate', () => {
    it('blocks publishing when pricedDates is empty or tour itineraryMoments is empty, keeping status en_progreso and logging listing.publish_blocked', async () => {
      const ally = await catalog.registerAlly(ownerUser, {
        ally_category: 'tour',
        ally_subcategory: 'paseos_bahia',
        profile: {
          business_name: 'Aca Rey Tours',
          avatar_url: 'https://example.com/acarey.jpg',
          description: 'Paseo bahía',
          location: { lat: 16.84, lng: -99.85, address: 'Malecón' },
          languages: ['es'],
          gallery_photos: [],
        },
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe_last4: '1234',
          spei_beneficiary_name: 'Aca Rey',
          pending_payout_balance_mxn: 0,
          driver_commission_pool_mxn: 0,
        },
        vertical_config: {},
      });

      // Missing both pricedDates and itineraryMoments for tour
      const incompleteTour = await catalog.createListing(ownerUser, {
        allyId: ally.allyId,
        category: 'tour',
        title: 'Paseo La Roqueta',
        description: 'Tour guiado',
        photos: ['https://example.com/tour.jpg'],
        priceMxn: 350,
        pricedDates: [],
        itineraryMoments: [],
      });

      const blocked1 = await catalog.publishListing(incompleteTour.id);
      expect(blocked1.published).toBe(false);
      expect(blocked1.status).toBe('en_progreso');
      expect(blocked1.missing.length).toBeGreaterThanOrEqual(2);
      expect(getOddLogs('listing.publish_blocked').length).toBe(1);

      // Has pricedDates, still missing itineraryMoments for tour
      const tourNoItinerary = await catalog.createListing(ownerUser, {
        allyId: ally.allyId,
        category: 'tour',
        title: 'Paseo Sin Itinerario',
        description: 'Tour guiado',
        photos: ['https://example.com/tour.jpg'],
        priceMxn: 350,
        pricedDates: [{ date: '2026-12-20', priceMxn: 350 }],
        itineraryMoments: [],
      });

      const blocked2 = await catalog.publishListing(tourNoItinerary.id);
      expect(blocked2.published).toBe(false);
      expect(blocked2.status).toBe('en_progreso');
      expect(blocked2.missing.some((m: string) => /itinerario|momento/i.test(m))).toBe(true);

      // Complete tour listing publishes cleanly
      const completeTour = await catalog.createListing(ownerUser, {
        allyId: ally.allyId,
        category: 'tour',
        title: 'Paseo Completo',
        description: 'Tour guiado completo',
        photos: ['https://example.com/tour.jpg'],
        priceMxn: 350,
        pricedDates: [{ date: '2026-12-20', priceMxn: 350 }],
        itineraryMoments: [{ time: '11:00', title: 'Abordaje en Parque de la Reina' }],
      });

      const published = await catalog.publishListing(completeTour.id);
      expect(published.published).toBe(true);
      expect(published.status).toBe('publicado');
      expect(published.missing).toEqual([]);
      expect(getOddLogs('listing.published').length).toBe(1);
    });
  });

  describe('T05: 24/7 "Editar Perfil y Oferta"', () => {
    it('updates ally profile/price/menu/rules 24/7 for owner or Concierge, rejects Staff/other allies, and logs ally.profile_updated', async () => {
      const ally = await catalog.registerAlly(ownerUser, {
        ally_category: 'venue',
        ally_subcategory: 'restaurante',
        profile: {
          business_name: 'Restaurante Playa',
          avatar_url: 'https://example.com/logo.jpg',
          description: 'Original',
          location: { lat: 16.84, lng: -99.85, address: 'Costera' },
          languages: ['es'],
          gallery_photos: [],
          rules: { cancellation_policy: 'Original' },
        },
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe_last4: '1234',
          spei_beneficiary_name: 'Playa SA',
          pending_payout_balance_mxn: 0,
          driver_commission_pool_mxn: 0,
        },
        vertical_config: {
          venue: {
            requires_mandatory_bottle: false,
            supports_allergies_alert: true,
            menu_items: [{ id: 'i1', name: 'Taco', price_mxn: 100, iva_included: true }],
          },
        },
      });
      await catalog.activateAlly(conciergeUser, ally.allyId);

      const listing = await catalog.createListing(ownerUser, {
        allyId: ally.allyId,
        category: 'venue',
        title: 'Mesa Restaurante Playa',
        description: 'Original',
        photos: ['https://example.com/mesa.jpg'],
        priceMxn: 300,
        pricedDates: [{ date: '2026-12-20', priceMxn: 300 }],
      });
      await catalog.publishListing(listing.id);

      // Staff and other ally owners are rejected
      await expect(
        catalog.updateAllyProfileAndOffer(staffUser, ally.allyId, { priceMxn: 999 })
      ).rejects.toThrow();
      await expect(
        catalog.updateAllyProfileAndOffer(otherOwnerUser, ally.allyId, { priceMxn: 999 })
      ).rejects.toThrow();

      // Owner updates profile, menu, rules, and listing price
      const updated = await catalog.updateAllyProfileAndOffer(ownerUser, ally.allyId, {
        profile: { description: 'Actualizado 24/7', rules: { cancellation_policy: 'Gratuita 2h antes' } },
        priceMxn: 450,
        menu_items: [{ id: 'i1', name: 'Taco Especial', price_mxn: 150, iva_included: true }],
      });

      expect(updated.profile.description).toBe('Actualizado 24/7');
      expect(updated.profile.rules?.cancellation_policy).toBe('Gratuita 2h antes');
      expect(updated.vertical_config.venue?.menu_items?.[0].price_mxn).toBe(150);

      const feedListings = catalog.getPublishedListings();
      const reflected = feedListings.find((l: any) => l.id === listing.id);
      expect(reflected?.priceMxn).toBe(450);

      expect(getOddLogs('ally.profile_updated').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('T08: Ally Commission Promo Window (5% < 30 days / 10% >= 30 days)', () => {
    it('returns 5% (0.95 net) on day 16 and 10% (0.90 net) on day 31+', () => {
      const refDate = new Date('2026-11-19T12:00:00Z');
      const day16Activated = new Date(refDate.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString();
      const day31Activated = new Date(refDate.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();

      const promoInfo = calculateAllyCommissionInfo(day16Activated, refDate);
      expect(promoInfo.rate).toBe(0.05);
      expect(promoInfo.netRate).toBe(0.95);
      expect(promoInfo.isPromoActive).toBe(true);

      const stdInfo = calculateAllyCommissionInfo(day31Activated, refDate);
      expect(stdInfo.rate).toBe(0.10);
      expect(stdInfo.netRate).toBe(0.90);
      expect(stdInfo.isPromoActive).toBe(false);
    });
  });

  describe('Pilot Seed Data: Mariscos Rulos (52 items), One By Pro ($350), Alejandro Valdés ($52,520 anomaly)', () => {
    it('seeds Mariscos Rulos with verified coords, spei_manual, 52 IVA-included items, 3 (?) flags, One By Pro, and preserves $52,520 anomaly', async () => {
      expect(MARISCOS_RULOS_MENU_ITEMS.length).toBe(52);
      expect(DEMO_PRESERVED_ANOMALIES.alejandroValdesBalanceMxn).toBe(52520);

      await catalog.seedPilotProviders({
        rulosUserId: 'u_rulos',
        oneByProUserId: 'u_onebypro',
        seedDemoAnomalyUser: true,
      });

      const rulos = catalog.getAllyByName("Mariscos Rulo's");
      expect(rulos).not.toBeNull();
      expect(rulos!.status).toBe('active');
      expect(rulos!.profile.location.lat).toBeCloseTo(16.84911, 5);
      expect(rulos!.profile.location.lng).toBeCloseTo(-99.85405, 5);
      expect(rulos!.payout_config.payout_method).toBe('spei_manual');
      expect(rulos!.payout_config.spei_beneficiary_name).toBe('Mariscos Rulos SA de CV');
      expect(rulos!.ally_activated_at).toBe('2026-09-01T00:00:00Z');
      expect((rulos!.payout_config as any).spei_clabe).toBeUndefined();
      expect((rulos!.payout_config as any).spei_clabe_full).toBeUndefined();

      const comm = calculateAllyCommissionInfo(
        rulos!.ally_activated_at!,
        new Date('2026-11-19T00:00:00Z')
      );
      expect(comm.rate).toBe(0.10);

      const menu = rulos!.vertical_config.venue!.menu_items!;
      expect(menu.length).toBe(52);
      expect(menu.every((item: any) => item.iva_included === true)).toBe(true);

      const ceviche = menu.find((i: any) => i.name === 'Ceviche de pez vela');
      const mariscada = menu.find((i: any) => i.name === 'Mariscada Grande');
      const cubetazo10 = menu.find((i: any) => i.name === 'Cubetazo 10 cervezas');
      const needsConfirm = menu.filter((i: any) => i.needs_confirmation === true);

      expect(ceviche?.price_mxn).toBe(250);
      expect(mariscada?.price_mxn).toBe(1700);
      expect(cubetazo10?.price_mxn).toBe(450);
      expect(needsConfirm.length).toBe(3);

      const oneByPro = catalog.getAllyByName('One By Pro');
      expect(oneByPro).not.toBeNull();
      expect(oneByPro!.status).toBe('active');
      const obpListings = catalog.getPublishedListings().filter((l: any) => l.allyId === oneByPro!.allyId);
      expect(obpListings.length).toBeGreaterThanOrEqual(1);
      expect(obpListings[0].priceMxn).toBe(350);

      // Alejandro Valdés $52,520 anomaly seeded & preserved
      const usersSnap = await mockStore.firestore
        .collection('users')
        .where('display_name', '==', 'Alejandro Valdés')
        .get();
      expect(usersSnap.size).toBe(1);
      const alejandroRef = mockStore.firestore.collection('users').doc(usersSnap.docs[0].id);
      expect(usersSnap.docs[0].data().wallet.balance_mxn).toBe(52520);

      // Re-seeding must NOT overwrite existing Alejandro Valdés record
      await alejandroRef.update({ custom_note: 'preserved_by_pedro' });
      await catalog.seedPilotProviders({
        rulosUserId: 'u_rulos',
        oneByProUserId: 'u_onebypro',
        seedDemoAnomalyUser: true,
      });
      const afterReseed = (await alejandroRef.get()).data();
      expect(afterReseed.wallet.balance_mxn).toBe(52520);
      expect(afterReseed.custom_note).toBe('preserved_by_pedro');
    });
  });
});
