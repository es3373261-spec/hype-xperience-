// Authoritative Borrador v3 spec constants & deterministic test builders.
// Derived exclusively from spec.md (Borrador v3, 2026-11-19),
// providers/mariscos-rulos-menu.md, ORIGINAL_REQUEST.md, and PROJECT.md.
// Uses strictly erasable TypeScript syntax.

export const MAESTRO_V2_TOKENS = {
  brand: {
    primaryWord: 'HYPE',
    primaryWeight: 'ExtraBold',
    secondaryWord: 'XPERIENCE',
    secondaryWeight: 'Light',
    secondaryLetterSpacing: '0.15em',
    suitcaseHex: '#E62E3D',
    soleSuitcaseImage: true,
    welcomePrefix: 'Bienvenido a la Saga del Sol',
  },
  dark: {
    background: '#0B0B0E',
    cardBackground: 'rgba(28, 28, 34, 0.75)',
    backdropFilter: 'blur(16px)',
    cardBorder: 'rgba(230, 46, 61, 0.25)',
    primaryButton: '#E62E3D',
    textPrimary: '#FFFFFF',
  },
  light: {
    background: 'rgba(248, 248, 250, 0.85)',
    accent: '#F23847',
    primaryButton: '#E62E3D',
  },
  typography: {
    uiFont: 'Montserrat',
    codeOnlyFont: 'JetBrains Mono',
  },
  buttons: {
    primaryHex: '#E62E3D',
    centeredSymmetricText: true,
  },
  splash: {
    background: '#000000',
    initialDurationMs: 8000,
    modeSwitchDurationMs: 900,
    showProgressBar: false,
    showText: false,
    onlyRedSuitcase: true,
  },
  auraPill: {
    borderRadiusCss: '999px',
    borderRadiusPx: 999,
    placeholder: 'Crea tu Xperience con Aura...',
    orbPosition: 'left',
    sendButtonPosition: 'right',
    draftDisclaimer: 'sujeto a verificación del Concierge',
  },
  navigation: {
    bottomDockTabs: ['Feed', 'Explorar', 'Tickets', 'Taxi', 'Wallet'] as const,
    auraPillDirectlyBelowNav: true,
    calendarBookingsColor: 'gold',
    calendarEventsColor: 'blue',
    lineIconsOnly: true,
  },
  viewports: {
    mobile: { width: 390, height: 844 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
  },
} as const;

export const DISCARDED_LEGACY_TOKENS = [
  '#cf2d2b',
  '#d4af37',
  '#46578f',
  '#f5f2ea',
  '#e0af68',
  '#2e3a5c',
] as const;

export const DISCARDED_LEGACY_STRINGS = [
  'MODO TURISTA',
  'vista compartida',
  'Afterlife Zamna',
  'La maleta es el flujo',
  'Explorar por parche',
] as const;

export const DISCARDED_LEGACY_RULES = {
  fixedColectivoFareMxn: 25,
  fixedPackageSplitLabel: '90/10',
  fireRatingIcon: '🔥',
  emailVerificationRequiredOnSignup: true,
} as const;

export const CONCIERGE_ACCOUNTS = {
  primary: {
    email: 'es3373261@gmail.com',
    displayName: 'One Xperience',
    conciergeAccess: true,
  },
  legacy: {
    email: 'pedro@hypexperience.demo',
    displayName: 'Pedro (Legacy)',
    conciergeAccess: true,
  },
} as const;

export const ALEJANDRO_VALDES_ANOMALY = {
  uid: 'uid_alejandro_valdes',
  displayName: 'Alejandro Valdés',
  email: 'alejandro.valdes@hypexperience.demo',
  walletBalanceMxn: 52520,
  preserveUntouched: true,
} as const;

export const PRICING_RULES = {
  transport: {
    base_fare: 35,
    per_km: 12,
    per_min: 2,
    min_fare: 95,
    round_to_nearest: 5,
    multipliers: {
      hype_go: 1.0,
      hype_confort: 1.25,
      hype_pro: 1.5,
    },
  },
  commissions: {
    ally_promo_days: 30,
    ally_promo_rate: 0.05,
    ally_standard_rate: 0.10,
    transport_override_rate: null as number | null,
    concierge_bundle_rate: 0.15,
    driver_min_wallet_balance_mxn: -30,
  },
} as const;

export type TaxiTier = 'hype_go' | 'hype_confort' | 'hype_pro';

export function computeExpectedTaxiFare(
  distanceKm: number,
  durationMin: number,
  tier: TaxiTier
): {
  rawSubtotal: number;
  flooredBase: number;
  multiplier: number;
  fareMxn: number;
} {
  const { base_fare, per_km, per_min, min_fare, round_to_nearest, multipliers } =
    PRICING_RULES.transport;
  const rawSubtotal = base_fare + distanceKm * per_km + durationMin * per_min;
  const flooredBase = Math.max(min_fare, rawSubtotal);
  const multiplier = multipliers[tier];
  const unrounded = flooredBase * multiplier;
  const fareMxn = Math.round(unrounded / round_to_nearest) * round_to_nearest;
  return { rawSubtotal, flooredBase, multiplier, fareMxn };
}

export const TAXI_TRACED_ROUTES = [
  'Zapata',
  'Vacacional',
  'Rena',
  'Coloso',
  'Colosio',
  'Costera',
] as const;

export const REQUIRED_DRIVER_PHOTOS = [
  'front',
  'seats',
  'dashboard_ac',
  'license',
] as const;

export const TAXI_REFERENCE_QUOTES = {
  costeraGo: {
    routeId: 'Costera',
    tier: 'hype_go' as const,
    distanceKm: 6.5,
    durationMin: 14,
    expectedRaw: 141,
    expectedFareMxn: 140,
  },
  colosioConfort: {
    routeId: 'Colosio',
    tier: 'hype_confort' as const,
    distanceKm: 9,
    durationMin: 18,
    expectedRaw: 179,
    expectedFareMxn: 225,
  },
  shortFloorConfort: {
    routeId: 'Costera',
    tier: 'hype_confort' as const,
    distanceKm: 2,
    durationMin: 5,
    expectedRaw: 69,
    expectedFlooredBase: 95,
    expectedFareMxn: 120,
  },
  cashPoolTrip: {
    fareMxn: 210,
    promoRate: 0.05,
    expectedDeductionMxn: 10.5,
    pauseThresholdMxn: -30,
  },
  byProBlockedMessage: 'uso exclusivo del modo Concierge y traslados VIP',
} as const;

export const WALLET_TOPUP_CHIPS_MXN = [500, 1000, 2000, 5000] as const;

export const WALLET_MESSAGES = {
  insufficientBalance: 'Saldo insuficiente — agrega dinero en tu Wallet',
  insufficientBalanceShort: 'Saldo insuficiente',
  autoRechargeMissingCap: 'sin tope no hay recarga automática',
  demoWatermark: 'EJEMPLO · DEMO',
  nonFiscalNotice: 'No es un comprobante fiscal',
} as const;

export interface RulosMenuItemFixture {
  readonly id: string;
  readonly category: 'Para picar' | 'Desayunos' | 'Mariscos' | 'Bebidas';
  readonly name: string;
  readonly priceMxn: number;
  readonly priceIncludesIva: true;
  readonly unconfirmed: boolean;
}

export const MARISCOS_RULOS_MENU: readonly RulosMenuItemFixture[] = [
  // Para picar (8)
  { id: 'rulos_01', category: 'Para picar', name: 'Ceviche de pez vela', priceMxn: 250, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_02', category: 'Para picar', name: 'Coctel de camarón o caracol', priceMxn: 280, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_03', category: 'Para picar', name: 'Campechana', priceMxn: 300, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_04', category: 'Para picar', name: 'Tiritas de pescado al aguachile', priceMxn: 270, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_05', category: 'Para picar', name: 'Camarones al aguachile', priceMxn: 400, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_06', category: 'Para picar', name: 'Tostadas de camarón', priceMxn: 280, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_07', category: 'Para picar', name: 'Totopos con guacamole (gourmet)', priceMxn: 180, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_08', category: 'Para picar', name: 'Papas a la francesa', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },

  // Desayunos (4)
  { id: 'rulos_09', category: 'Desayunos', name: 'Huevos al gusto (con frijoles y ensalada)', priceMxn: 200, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_10', category: 'Desayunos', name: 'Chilaquiles (pollo, cecina o huevo)', priceMxn: 250, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_11', category: 'Desayunos', name: 'Café (verde, rojo)', priceMxn: 60, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_12', category: 'Desayunos', name: 'Jugo de naranja', priceMxn: 100, priceIncludesIva: true, unconfirmed: false },

  // Mariscos (16)
  { id: 'rulos_13', category: 'Mariscos', name: 'Mojarra Grande (al ajo o frita)', priceMxn: 350, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_14', category: 'Mariscos', name: 'Mojarra Grande (a la diabla)', priceMxn: 380, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_15', category: 'Mariscos', name: 'Mojarra Mediana (al ajo o frita)', priceMxn: 300, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_16', category: 'Mariscos', name: 'Mojarra Mediana (a la diabla)', priceMxn: 330, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_17', category: 'Mariscos', name: 'Filete de pescado', priceMxn: 250, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_18', category: 'Mariscos', name: 'Milanesa de pollo empanizada', priceMxn: 250, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_19', category: 'Mariscos', name: 'Camarones al gusto (12 pza.)', priceMxn: 360, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_20', category: 'Mariscos', name: 'Camarones rellenos (12 pza.)', priceMxn: 420, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_21', category: 'Mariscos', name: 'Mariscada Grande', priceMxn: 1700, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_22', category: 'Mariscos', name: 'Mariscada Mediana', priceMxn: 1400, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_23', category: 'Mariscos', name: 'Mariscada chica', priceMxn: 1000, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_24', category: 'Mariscos', name: 'Molcajete de Mariscos', priceMxn: 850, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_25', category: 'Mariscos', name: 'Pulpo al gusto', priceMxn: 370, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_26', category: 'Mariscos', name: 'Quesadillas de Camarón', priceMxn: 280, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_27', category: 'Mariscos', name: 'Sopes (3 pza.), pescadillas y quesadillas (4 pza.)', priceMxn: 140, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_28', category: 'Mariscos', name: 'Hamburguesa', priceMxn: 180, priceIncludesIva: true, unconfirmed: false },

  // Bebidas (24, including 3 unconfirmed (?) items)
  { id: 'rulos_29', category: 'Bebidas', name: 'Agua 600 ml', priceMxn: 25, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_30', category: 'Bebidas', name: 'Agua 1 lt', priceMxn: 35, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_31', category: 'Bebidas', name: 'Agua 1 1/2 lt', priceMxn: 45, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_32', category: 'Bebidas', name: 'Soda 600 ml', priceMxn: 45, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_33', category: 'Bebidas', name: 'Coco Nat', priceMxn: 120, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_34', category: 'Bebidas', name: 'Coco Rulo', priceMxn: 180, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_35', category: 'Bebidas', name: 'Limonada y naranjada', priceMxn: 100, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_36', category: 'Bebidas', name: 'Conga (?)', priceMxn: 120, priceIncludesIva: true, unconfirmed: true },
  { id: 'rulos_37', category: 'Bebidas', name: 'Suero (?)', priceMxn: 120, priceIncludesIva: true, unconfirmed: true },
  { id: 'rulos_38', category: 'Bebidas', name: 'Piña colada Nat', priceMxn: 120, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_39', category: 'Bebidas', name: 'Piña colada Pre (?)', priceMxn: 150, priceIncludesIva: true, unconfirmed: true },
  { id: 'rulos_40', category: 'Bebidas', name: 'Media de seda', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_41', category: 'Bebidas', name: 'Cuba', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_42', category: 'Bebidas', name: 'Margarita', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_43', category: 'Bebidas', name: 'Bull', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_44', category: 'Bebidas', name: 'Sex on the beach', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_45', category: 'Bebidas', name: 'Azulito', priceMxn: 200, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_46', category: 'Bebidas', name: 'Limonada brasileña', priceMxn: 200, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_47', category: 'Bebidas', name: 'Corona y Victoria de vidrio', priceMxn: 60, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_48', category: 'Bebidas', name: 'Latón Corona y Victoria', priceMxn: 70, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_49', category: 'Bebidas', name: 'Michelada, sal y limón', priceMxn: 130, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_50', category: 'Bebidas', name: 'Michelada cubana', priceMxn: 150, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_51', category: 'Bebidas', name: 'Cubetazo 6 cervezas', priceMxn: 270, priceIncludesIva: true, unconfirmed: false },
  { id: 'rulos_52', category: 'Bebidas', name: 'Cubetazo 10 cervezas', priceMxn: 450, priceIncludesIva: true, unconfirmed: false },
] as const;

export const MARISCOS_RULOS_SEED = {
  allyId: 'ally_mariscos_rulos',
  businessName: "Mariscos Rulo's",
  allyCategory: 'venue' as const,
  allySubcategory: 'restaurante',
  allyActivatedAt: '2026-09-01T00:00:00Z',
  expectedCommissionRate: 0.10,
  payoutMethod: 'spei_manual' as const,
  speiBeneficiaryName: 'Mariscos Rulos SA de CV',
  speiClabeFull: '012345678901234567',
  speiClabeLast4: '4567',
  coordinates: { lat: 16.84911, lng: -99.85405 },
  legacyUnverifiedCoordinates: { lat: 16.8492, lng: -99.8511 },
  address: 'Playa, acceso CICI, Acapulco',
  requiresMandatoryBottle: false,
  menuCount: 52,
  unconfirmedItemIds: ['rulos_36', 'rulos_37', 'rulos_39'] as const,
  menu: MARISCOS_RULOS_MENU,
  j1OrderBaseline: {
    preOrderItems: [
      { itemId: 'rulos_01', name: 'Ceviche de pez vela', qty: 1, priceMxn: 250 },
      { itemId: 'rulos_16', name: 'Mojarra Mediana (a la diabla)', qty: 1, priceMxn: 330 },
    ],
    preOrderTotalMxn: 580,
    netSubtotalMxn: 500,
    ivaMxn: 80,
    walletPartMxn: 300,
    cardPartMxn: 280,
    extrasMxn: 200,
    tipsMxn: 100,
    finalTicketMxn: 780,
    commissionMxn: 78,
    allyNetMxn: 702,
  },
} as const;

export const ONE_BY_PRO_SEED = {
  allyId: 'ally_one_by_pro',
  businessName: 'One By Pro',
  allyCategory: 'venue' as const,
  allySubcategory: 'antro_club',
  coverPriceMxn: 350,
  requiresMandatoryBottle: true,
  pilotReferenceEvents: [
    { date: '2026-11-14', venue: 'Tropic', isPastReference: true },
    { date: '2026-11-15', venue: 'Ronin 22', isPastReference: true },
  ],
} as const;

export const RONNIE_ACAPULCO_SEED = {
  allyId: 'ally_ronnie_acapulco',
  businessName: 'Ronnie Acapulco',
  locationVerified: false,
  approximateZone: 'Av. Costera Miguel Alemán, zona Dorada',
  approximateMarkerLabel: 'aproximado por confirmar',
} as const;

// All 64 mandatory MVP ODD events from spec.md §13
export const MVP_ODD_EVENTS = [
  // wallet (9 MVP)
  'wallet.recharge',
  'wallet.payment',
  'wallet.payment_rejected',
  'wallet.mixed_payment',
  'wallet.withdrawal',
  'wallet.autorecharge',
  'wallet.autorecharge_blocked',
  'wallet.low_balance_alert',
  'wallet.preload_suggested',
  // booking (5)
  'booking.created',
  'booking.paid',
  'booking.double_payment_blocked',
  'booking.self_booking_blocked',
  'booking.cancelled_cascade',
  // ticket (4)
  'ticket.scanned',
  'ticket.rejected',
  'ticket.final_closed',
  'ticket.tips_paid',
  // trip (6)
  'trip.requested',
  'trip.accepted',
  'trip.location_updated',
  'trip.completed',
  'trip.cancelled',
  'trip.fare_quoted',
  // driver (3)
  'driver.pool_deducted',
  'driver.online_paused',
  'driver.pool_topped_up',
  // ally (4)
  'ally.created',
  'ally.activated',
  'ally.profile_updated',
  'ally.payout_pending',
  // listing (4)
  'listing.created',
  'listing.published',
  'listing.publish_blocked',
  'listing.draft_saved',
  // review (3)
  'review.created',
  'review.rejected_not_completed',
  'review.reply_posted',
  // staff (2)
  'staff.created',
  'staff.scan_rejected_wrong_ally',
  // aura (4)
  'aura.qualified',
  'aura.draft_created',
  'aura.no_service_found',
  'aura.hallucination_blocked',
  // concierge (8)
  'concierge.request_received',
  'concierge.request_reviewed',
  'concierge.request_approved',
  'concierge.payment_link_sent',
  'concierge.request_paid',
  'concierge.pending_verification',
  'concierge.action_approved',
  'concierge.action_rejected',
  // experience (2)
  'experience.created',
  'experience.published',
  // subbooking (2)
  'subbooking.created',
  'subbooking.cancelled_cascade',
  // guide (1)
  'guide.assigned',
  // allergy & preorder (3)
  'allergy.flagged',
  'preorder.created',
  'preorder.ready',
  // profile & auth (4)
  'profile.theme_updated',
  'auth.role_assigned',
  'auth.login_failed',
  'account.mode_switched',
] as const;

// 7 Post-launch Fase 2/3 ODD events (T29–T32, strictly excluded from MVP execution)
export const EXCLUDED_FASE_2_3_ODD_EVENTS = [
  'wallet.oxxo_code_generated',
  'wallet.oxxo_paid',
  'wallet.oxxo_expired',
  'wallet.spei_pending',
  'wallet.spei_confirmed',
  'wallet.toll_topup',
  'wallet.fuel_qr_paid',
] as const;

// 7 §13 ODD Metrics
export const ODD_METRICS = [
  {
    key: 'paidBookingsByVertical',
    label: 'Reservas pagadas por día, por vertical',
  },
  {
    key: 'insufficientBalanceRejections',
    label: 'Pagos rechazados por saldo insuficiente',
  },
  {
    key: 'avgDriverAcceptMs',
    label: 'Tiempo de aceptación de viaje por conductor',
  },
  {
    key: 'ticketsScannedVsIssued',
    label: 'Tickets escaneados vs emitidos',
  },
  {
    key: 'paymentQrErrorsPerHour',
    label: 'Errores de pago y de QR por hora',
  },
  {
    key: 'auraToPaidConversionRate',
    label: 'Borradores de Aura convertidos a pagados (tasa de conversión Concierge)',
  },
  {
    key: 'avgConciergeApprovalMs',
    label: 'Tiempo medio de aprobación de un borrador en la bandeja',
  },
] as const;

// 6 §13 ODD Alerts
export const ODD_ALERTS = [
  {
    key: 'payment_without_booking',
    label: 'Pago cobrado sin reserva',
  },
  {
    key: 'withdrawal_exceeds_balance',
    label: 'Retiro mayor al saldo',
  },
  {
    key: 'facebook_login_outage',
    label: 'Caída de login con Facebook',
  },
  {
    key: 'concierge_hallucinated_service',
    label: 'Error de Concierge inventando un servicio',
  },
  {
    key: 'driver_pool_below_minus_30',
    label: 'Bolsa de conductor por debajo de -$30',
  },
  {
    key: 'published_listing_without_availability',
    label: 'Anuncio publicado sin disponibilidad (no debe ocurrir; la puerta lo impide)',
  },
] as const;

// Deterministic test data builders

export function buildExplorerSignup(suffix = '01'): {
  displayName: string;
  email: string;
  phone: string;
  termsAccepted: boolean;
  allergies: string[];
} {
  return {
    displayName: `Sofía ${suffix}`,
    email: `sofia.${suffix}@ejemplo.com`,
    phone: '+527441000001',
    termsAccepted: true,
    allergies: ['nueces'],
  };
}

export function buildAllyOnboardingPayload(
  category: 'venue' | 'tour' | 'accommodation' | 'transport',
  overrides: Record<string, unknown> = {}
): {
  category: 'venue' | 'tour' | 'accommodation' | 'transport';
  subcategory: string;
  profile: Record<string, unknown>;
  verticalConfig: Record<string, unknown>;
  payoutConfig: Record<string, unknown>;
} {
  const defaultsByCategory = {
    venue: {
      subcategory: 'restaurante',
      verticalConfig: {
        requires_mandatory_bottle: false,
        supports_allergies_alert: true,
        menu_items: [
          {
            id: 'item_01',
            name: 'Ceviche de pez vela',
            price_mxn: 250,
            image_url: 'https://storage.googleapis.com/hype-demo/ceviche.jpg',
            available: true,
          },
        ],
        bar_360_bottles: [],
        tables: [{ label: 'Palapa principal', capacity: 40 }],
        turns: ['13:00', '16:00', '19:00'],
      },
    },
    tour: {
      subcategory: 'barco_turistico',
      verticalConfig: {
        departure_dock: 'Parque de la Reina',
        schedule_slots: ['11:00', '14:00', '16:30'],
        duration_minutes: 150,
        capacity_per_slot: 80,
        price_per_person_mxn: 350,
        checklist: ['Bloqueador', 'Ropa cómoda'],
      },
    },
    accommodation: {
      subcategory: 'departamento',
      verticalConfig: {
        price_per_night_mxn: 1450,
        max_guests: 4,
        check_in: '15:00',
        check_out: '12:00',
        aspects: ['Vista al mar', 'Terraza privada'],
        cancellation_policy: 'Gratuita antes de aceptación',
      },
    },
    transport: {
      subcategory: 'hype_go',
      verticalConfig: {
        vehicle_tier: 'hype_go',
        model: 'Nissan Tsuru 2015',
        plates: 'A-456-GRO',
        passenger_capacity: 4,
        has_ac: true,
        verification_photos: [...REQUIRED_DRIVER_PHOTOS],
      },
    },
  } as const;

  const selected = defaultsByCategory[category];
  return {
    category,
    subcategory: (overrides.subcategory as string) ?? selected.subcategory,
    profile: {
      business_name: `Aliado Demo ${category}`,
      avatar_url: 'https://storage.googleapis.com/hype-demo/avatar.jpg',
      description: `Servicio piloto ${category} en Acapulco`,
      location: { lat: 16.84911, lng: -99.85405, address: 'Acapulco, Gro.' },
      languages: ['es', 'en'],
      ...((overrides.profile as Record<string, unknown>) ?? {}),
    },
    verticalConfig: {
      ...selected.verticalConfig,
      ...((overrides.verticalConfig as Record<string, unknown>) ?? {}),
    },
    payoutConfig: {
      payout_method: 'spei_manual',
      spei_clabe: '012345678901234567',
      spei_beneficiary_name: `Aliado Demo ${category} SA`,
      ...((overrides.payoutConfig as Record<string, unknown>) ?? {}),
    },
  };
}

export function buildVenueBookingPayload(
  overrides: Record<string, unknown> = {}
): {
  allyId: string;
  listingId: string;
  date: string;
  turn: string;
  guests: number;
  items: { itemId: string; qty: number }[];
  allergies: string[];
  bottleIds: string[];
} {
  return {
    allyId: (overrides.allyId as string) ?? MARISCOS_RULOS_SEED.allyId,
    listingId: (overrides.listingId as string) ?? 'listing_mariscos_rulos',
    date: (overrides.date as string) ?? '2026-12-20',
    turn: (overrides.turn as string) ?? '13:00',
    guests: (overrides.guests as number) ?? 2,
    items: (overrides.items as { itemId: string; qty: number }[]) ?? [
      { itemId: 'rulos_01', qty: 1 },
      { itemId: 'rulos_16', qty: 1 },
    ],
    allergies: (overrides.allergies as string[]) ?? ['nueces'],
    bottleIds: (overrides.bottleIds as string[]) ?? [],
  };
}

export function buildTaxiQuoteInput(
  overrides: Record<string, unknown> = {}
): {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routeId: string;
  tier: TaxiTier;
  distanceKm: number;
  durationMin: number;
} {
  return {
    origin: (overrides.origin as { lat: number; lng: number }) ?? {
      lat: 16.84911,
      lng: -99.85405,
    },
    destination: (overrides.destination as { lat: number; lng: number }) ?? {
      lat: 16.8635,
      lng: -99.8822,
    },
    routeId: (overrides.routeId as string) ?? 'Costera',
    tier: (overrides.tier as TaxiTier) ?? 'hype_go',
    distanceKm: (overrides.distanceKm as number) ?? 6.5,
    durationMin: (overrides.durationMin as number) ?? 14,
  };
}

export function buildAuraDraftFixture(): {
  alliesSubtotalMxn: number;
  conciergeCommissionRate: number;
  conciergeFeeMxn: number;
  finalClientTotalMxn: number;
  items: readonly {
    day: number;
    allyId: string;
    serviceName: string;
    netPriceMxn: number;
  }[];
} {
  return {
    alliesSubtotalMxn: 6936,
    conciergeCommissionRate: 0.15,
    conciergeFeeMxn: 1040,
    finalClientTotalMxn: 7976,
    items: [
      { day: 1, allyId: 'ally_lucia', serviceName: 'Estancia Bahía Lucía', netPriceMxn: 4350 },
      { day: 2, allyId: 'ally_diego', serviceName: 'Yate Bahía Diego', netPriceMxn: 2086 },
      { day: 3, allyId: 'ally_mariscos_rulos', serviceName: "Almuerzo Mariscos Rulo's", netPriceMxn: 500 },
    ],
  };
}
