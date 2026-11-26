import * as tokens from '../theme/tokens';
import * as appIndex from '../index';
import type { UserAccount } from '../types/user';
import type { Ally, Listing } from '../types/catalog';
import type { ThermalReceipt } from '../types/receipt';
import type { VerifiedReview } from '../types/review';
import type { OddEventName } from '../types/odd';

describe('M1 — Maestro v2.0 Design Tokens & Borrador v3 Core Types', () => {
  describe('Maestro v2.0 design tokens exports & values (spec.md §4)', () => {
    it('exports themeTokens and all Maestro v2.0 token groups', () => {
      expect(tokens.themeTokens).toBeDefined();
      expect(tokens.brandTokens).toBeDefined();
      expect(tokens.typographyTokens).toBeDefined();
      expect(tokens.splashTokens).toBeDefined();
      expect(tokens.auraBarTokens).toBeDefined();
      expect(tokens.navigationTokens).toBeDefined();
      expect(tokens.glassmorphismTokens).toBeDefined();
      expect(tokens.welcomeTokens).toBeDefined();
      expect(tokens.iconTokens).toBeDefined();
      expect(tokens.responsiveTokens).toBeDefined();
      expect(tokens.maestroDarkTheme).toBeDefined();
      expect(tokens.maestroLightTheme).toBeDefined();
    });

    it('enforces Dark Mode default (#0B0B0E, translucent card rgba(28, 28, 34, 0.75), blur(16px), border rgba(230, 46, 61, 0.25))', () => {
      const dark = tokens.maestroDarkTheme;
      expect(dark.mode).toBe('dark');
      expect(dark.isDefault).toBe(true);
      expect(dark.background.toUpperCase()).toBe('#0B0B0E');
      expect(dark.cardBackground).toBe('rgba(28, 28, 34, 0.75)');
      expect(dark.backdropFilter).toBe('blur(16px)');
      expect(dark.cardBorder).toBe('rgba(230, 46, 61, 0.25)');

      expect(tokens.themeTokens.colors.background.toUpperCase()).toBe('#0B0B0E');
      expect(tokens.themeTokens.colors.cardBackground).toBe('rgba(28, 28, 34, 0.75)');
      expect(tokens.themeTokens.colors.border).toBe('rgba(230, 46, 61, 0.25)');
      expect(tokens.glassmorphismTokens.backdropFilter).toBe('blur(16px)');
      expect(tokens.glassmorphismTokens.blurRadiusPx).toBe(16);
    });

    it('enforces Light Mode tokens (rgba(248, 248, 250, 0.85), coral/crimson accent #F23847)', () => {
      const light = tokens.maestroLightTheme;
      expect(light.mode).toBe('light');
      expect(light.background).toBe('rgba(248, 248, 250, 0.85)');
      expect(light.accent.toUpperCase()).toBe('#F23847');
    });

    it('enforces primary button #E62E3D with centered symmetric white text (replaces #d4af37 / #cf2d2b)', () => {
      const btn = tokens.themeTokens.primaryButton;
      expect(btn.backgroundColor.toUpperCase()).toBe('#E62E3D');
      expect(btn.textColor.toUpperCase()).toBe('#FFFFFF');
      expect(btn.textAlign).toBe('center');
      expect(btn.symmetric).toBe(true);
      expect(tokens.themeTokens.colors.accent.toUpperCase()).toBe('#E62E3D');
    });

    it('enforces brand wordmark HYPE (800) + XPERIENCE (300, 0.15em) and red 3D suitcase #E62E3D as sole suitcase image', () => {
      const brand = tokens.brandTokens;
      expect(brand.wordmark.primary.text).toBe('HYPE');
      expect(brand.wordmark.primary.fontWeight).toBe(800);
      expect(brand.wordmark.secondary.text).toBe('XPERIENCE');
      expect(brand.wordmark.secondary.fontWeight).toBe(300);
      expect(brand.wordmark.secondary.letterSpacing).toBe('0.15em');
      expect(brand.suitcase.color.toUpperCase()).toBe('#E62E3D');
      expect(brand.suitcase.is3D).toBe(true);
      expect(brand.suitcase.isSoleSuitcaseImage).toBe(true);
    });

    it('enforces Montserrat for app text and JetBrains Mono for source code only', () => {
      const typo = tokens.typographyTokens;
      expect(typo.appFontFamily).toBe('Montserrat');
      expect(typo.codeFontFamily).toBe('JetBrains Mono');
      expect(typo.codeFontSourceCodeOnly).toBe(true);
    });

    it('enforces splash timings (8000ms first load, 900ms mode switch, #000000 bg, no progress bar, no text)', () => {
      const splash = tokens.splashTokens;
      expect(splash.firstLoadDurationMs).toBe(8000);
      expect(splash.modeSwitchDurationMs).toBe(900);
      expect(splash.backgroundColor.toUpperCase()).toBe('#000000');
      expect(splash.suitcaseColor.toUpperCase()).toBe('#E62E3D');
      expect(splash.showProgressBar).toBe(false);
      expect(splash.showText).toBe(false);
    });

    it('enforces fixed bottom stack: nav bar (Feed, Explorar, Tickets, Taxi, Wallet) above Aura pill bar (borderRadius 999)', () => {
      const nav = tokens.navigationTokens;
      const aura = tokens.auraBarTokens;
      expect(nav.tabs).toEqual(['Feed', 'Explorar', 'Tickets', 'Taxi', 'Wallet']);
      expect(nav.independentFloatingButtons).toBe(true);
      expect(nav.positionRelativeToAuraBar).toBe('above');
      expect(aura.borderRadius).toBe(999);
      expect(aura.placeholder).toBe('Crea tu Xperience con Aura...');
      expect(aura.placement).toBe('bottom_below_nav');
    });

    it('enforces simplified Feed calendar + unified Explorar rules (gold #d4af37 bookings, blue #46578f events, no Mes/Semana, no vista compartida)', () => {
      const cal = tokens.themeTokens.calendar;
      expect(cal.unifiedIn).toBe('Explorar');
      expect(cal.bookingColor.toLowerCase()).toBe('#d4af37');
      expect(cal.eventColor.toLowerCase()).toBe('#46578f');
      expect(cal.showMonthWeekToggleButtons).toBe(false);
      expect(cal.showSharedViewLegend).toBe(false);
      expect(cal.circularArrowButtons).toBe(true);
    });

    it('enforces welcome banner, line-only icons, 1.0-5.0 star ratings, opaque ? sheets, Liquid Glass date picker, and 390x844 mobile breakpoint', () => {
      expect(tokens.welcomeTokens.greetingPrefix).toBe('Bienvenido a la Saga del Sol');
      expect(tokens.welcomeTokens.forbiddenCopy).toContain('MODO TURISTA');

      expect(tokens.iconTokens.style).toBe('line');
      expect(tokens.iconTokens.allowEmojisAsIcons).toBe(false);
      expect(tokens.iconTokens.ratingIcon).toBe('star');
      expect(tokens.iconTokens.allowFireIcons).toBe(false);
      expect(tokens.iconTokens.ratingScale).toEqual({ min: 1.0, max: 5.0 });

      expect(tokens.glassmorphismTokens.helpSheetOpaque).toBe(true);
      expect(tokens.glassmorphismTokens.datePickerStyle).toBe('liquid_glass');

      expect(tokens.responsiveTokens.mobile).toEqual({ width: 390, height: 844 });
      expect(tokens.responsiveTokens.tablet).toBeDefined();
      expect(tokens.responsiveTokens.desktop).toBeDefined();
    });
  });

  describe('Core Types & app/src/index.ts exports (PROJECT.md § Interface Contracts)', () => {
    it('loads app/src/index.ts cleanly without runtime breakage and exports Maestro tokens', () => {
      expect(appIndex).toBeDefined();
      expect((appIndex as any).brandTokens).toEqual(tokens.brandTokens);
      expect((appIndex as any).maestroDarkTheme).toEqual(tokens.maestroDarkTheme);
      expect((appIndex as any).maestroLightTheme).toEqual(tokens.maestroLightTheme);
    });

    it('type-checks UserAccount, Ally, Listing, ThermalReceipt, VerifiedReview, and OddEventName structures', () => {
      const sampleUser: UserAccount = {
        uid: 'u_sofia',
        display_name: 'Sofía',
        email: 'sofia@ejemplo.com',
        phone: '7441002000',
        terms_accepted: true,
        account_status: 'active',
        roles: ['explorer'],
        mode: 'viajero',
        concierge_access: false,
        allergies: ['nueces'],
        theme: 'dark',
        wallet: {
          balance_mxn: 1500,
          currency: 'MXN',
          is_closed_loop: true,
          updated_at: '2026-11-19T08:40:00Z',
        },
      };

      const sampleAlly: Ally = {
        allyId: 'ally_rulos',
        owner_uid: 'u_rulos',
        status: 'active',
        ally_activated_at: '2026-09-01T00:00:00Z',
        ally_category: 'venue',
        ally_subcategory: 'restaurante',
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe_last4: '4567',
          spei_beneficiary_name: 'Mariscos Rulos SA de CV',
          pending_payout_balance_mxn: 4250,
          driver_commission_pool_mxn: 0,
        },
        profile: {
          business_name: "Mariscos Rulo's",
          avatar_url: 'https://storage.googleapis.com/hype/rulos.jpg',
          description: 'Restaurante bar en la playa, acceso CICI.',
          location: {
            lat: 16.84911,
            lng: -99.85405,
            address: 'Playa, acceso CICI, Acapulco',
          },
          languages: ['es', 'en'],
          gallery_photos: ['https://storage.googleapis.com/hype/palapa.jpg'],
        },
        vertical_config: {},
        staff_uids: [],
      };

      const sampleListing: Listing = {
        id: 'lst_1',
        allyId: 'ally_rulos',
        owner_uid: 'u_rulos',
        category: 'venue',
        title: 'Mesa frente al mar',
        description: 'Experiencia gastronómica en playa',
        photos: ['https://storage.googleapis.com/hype/mesa.jpg'],
        priceMxn: 500,
        pricedDates: [{ date: '2026-12-20', priceMxn: 500 }],
        itineraryMoments: [],
        status: 'publicado',
      };

      const sampleReceipt: ThermalReceipt = {
        id: 'rec_1',
        walletTxId: 'tx_1',
        merchantName: "Mariscos Rulo's",
        items: [{ label: 'Ceviche de pez vela', quantity: 2, unitPriceMxn: 250, totalMxn: 500 }],
        subtotalMxn: 500,
        ivaMxn: 80,
        totalMxn: 580,
        cashGivenMxn: 0,
        changeMxn: 0,
        barcode: 'HYPE-REC-001',
        createdAt: '2026-11-19T12:00:00Z',
        isDemo: true,
        demoLabel: 'EJEMPLO · DEMO',
        fiscalDisclaimer: 'No es un comprobante fiscal',
      };

      const sampleReview: VerifiedReview = {
        id: 'rev_1',
        bookingId: 'bkg_1',
        allyId: 'ally_rulos',
        authorUid: 'u_sofia',
        kind: 'servicio',
        rating: 5.0,
        comment: 'Excelente servicio en playa.',
        photos: [],
        allyReply: null,
        createdAt: '2026-11-19T14:00:00Z',
      };

      const sampleEvent: OddEventName = 'account.mode_switched';

      expect(sampleUser.wallet.is_closed_loop).toBe(true);
      expect(sampleAlly.ally_category).toBe('venue');
      expect(sampleListing.status).toBe('publicado');
      expect(sampleReceipt.demoLabel).toBe('EJEMPLO · DEMO');
      expect(sampleReview.rating).toBe(5.0);
      expect(sampleEvent).toBe('account.mode_switched');
    });
  });
});
