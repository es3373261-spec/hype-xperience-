// Complete 10-module typed opaque-box facade for Hype Xperience v2 E2E tests.
// Delegates strictly to real resolved PROJECT.md § Interface Contracts modules
// or Firebase Emulator HTTP endpoints. NEVER fakes or mocks business logic.
// Uses strictly erasable TypeScript syntax.

import {
  ContractNotImplementedError,
  getE2ETargetMode,
  getEmulatorConfig,
  invokeHttpEndpoint,
  requireContract,
  type ContractTargetKey,
} from './contractHarness.ts';
import {
  ALEJANDRO_VALDES_ANOMALY,
  CONCIERGE_ACCOUNTS,
  MARISCOS_RULOS_SEED,
  ONE_BY_PRO_SEED,
  PRICING_RULES,
  TAXI_TRACED_ROUTES,
} from './fixtures.ts';

export type HarnessTarget = 'emulator' | 'in_memory' | 'ui_web';

export interface HarnessContext {
  readonly target: HarnessTarget;
  readonly baseUrl?: string;
  readonly projectId: string;
  readonly startedAtIso: string;
  currentTimeIso: string;
  readonly cleanupTasks: (() => Promise<void> | void)[];
}

export interface SeedSnapshot {
  readonly seeded: boolean;
  readonly pricingRulesId: string;
  readonly adminEmails: readonly string[];
  readonly mariscosRulosAllyId: string;
  readonly oneByProAllyId: string;
  readonly alejandroValdesUid: string;
  readonly tracedRoutes: readonly string[];
}

export interface UserSession {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly ('explorer' | 'ally' | 'guide' | 'staff')[];
  readonly mode: 'viajero' | 'aliado';
  readonly conciergeAccess: boolean;
  readonly idToken?: string;
  readonly staffAllyId?: string;
  readonly assignedTourIds?: readonly string[];
  readonly vip?: boolean;
}

export interface AccountSummary {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly string[];
  readonly mode: 'viajero' | 'aliado';
  readonly conciergeAccess: boolean;
}

export interface AllyRecord {
  readonly allyId: string;
  readonly ownerUid: string;
  readonly status: 'pending_review' | 'active' | 'suspended';
  readonly allyActivatedAt?: string;
  readonly category: 'venue' | 'tour' | 'accommodation' | 'transport';
  readonly subcategory: string;
  readonly listingId?: string;
  readonly payoutConfig?: Record<string, unknown>;
  readonly profile?: Record<string, unknown>;
  readonly verticalConfig?: Record<string, unknown>;
}

export interface ListingRecord {
  readonly listingId: string;
  readonly allyId: string;
  readonly status: 'publicado' | 'en_progreso';
  readonly priceMxn?: number;
  readonly pricedDates?: readonly string[];
  readonly itineraryMoments?: readonly string[];
  readonly aspects?: readonly string[];
}

export interface PublicAllyView {
  readonly allyId: string;
  readonly businessName: string;
  readonly category: string;
  readonly spei_clabe_last4?: string;
  readonly spei_clabe?: never;
  readonly [key: string]: unknown;
}

export interface AutoRechargeConfig {
  readonly enabled: boolean;
  readonly minBalanceMxn: number;
  readonly rechargeAmountMxn: number;
  readonly monthlyCapMxn: number;
  readonly monthlySpentMxn: number;
}

export interface PaymentResult {
  readonly bookingId: string;
  readonly paid: boolean;
  readonly method: 'wallet_hype' | 'stripe_card' | 'mixed';
  readonly walletPartMxn: number;
  readonly cardPartMxn: number;
  readonly walletBalanceAfterMxn: number;
  readonly txId: string;
  readonly receiptId: string;
  readonly commissionRate?: number;
  readonly hypeFeeMxn?: number;
  readonly hostPayoutMxn?: number;
  readonly ticketCode?: string;
}

export interface WalletTransactionRecord {
  readonly txId: string;
  readonly uid: string;
  readonly walletType: 'explorer_credits' | 'driver_commission_pool' | 'ally_payout_ledger';
  readonly type: string;
  readonly amountMxn: number;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly referenceId: string;
  readonly paymentMethod: string;
  readonly createdAt: string;
}

export interface ReceiptRecord {
  readonly receiptId: string;
  readonly walletTxId: string;
  readonly merchant: string;
  readonly items: readonly { name: string; priceMxn: number; qty?: number }[];
  readonly subtotalMxn: number;
  readonly ivaMxn: number;
  readonly totalMxn: number;
  readonly cashMxn?: number;
  readonly changeMxn?: number;
  readonly barcode: string;
  readonly isDemo: boolean;
  readonly disclaimers: readonly string[];
  readonly createdAt: string;
}

export interface BookingRecord {
  readonly bookingId: string;
  readonly travelerId: string;
  readonly allyId: string;
  readonly listingId: string;
  readonly status: 'pendiente' | 'aceptada' | 'completada' | 'cancelada';
  readonly ticketCode: string;
  readonly subtotalMxn: number;
  readonly ivaMxn: number;
  readonly totalMxn: number;
  readonly allergies: readonly string[];
  readonly qrScanned: boolean;
}

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly priceMxn: number;
  readonly imageUrl?: string;
  readonly unconfirmed?: boolean;
  readonly priceIncludesIva?: boolean;
}

export interface BottleItem {
  readonly id: string;
  readonly name: string;
  readonly priceMxn: number;
  readonly imageUrl?: string;
}

export interface PreOrderItem {
  readonly itemId: string;
  readonly name: string;
  readonly qty: number;
  readonly priceMxn: number;
}

export interface DriverMarker {
  readonly driverUid: string;
  readonly lat: number;
  readonly lng: number;
  readonly tier: 'hype_go' | 'hype_confort' | 'hype_pro';
  readonly driverType?: 'blue' | 'yellow';
  readonly isOnline: boolean;
}

export interface LatLng {
  readonly lat: number;
  readonly lng: number;
}

export interface TaxiQuote {
  readonly quoteId: string;
  readonly routeId: string;
  readonly tier: 'hype_go' | 'hype_confort' | 'hype_pro';
  readonly distanceKm: number;
  readonly durationMin: number;
  readonly fareMxn: number;
  readonly breakdown: {
    readonly fareBase: number;
    readonly fareKm: number;
    readonly fareMin: number;
    readonly flooredBase: number;
    readonly multiplier: number;
    readonly roundedTo: number;
  };
}

export interface TripRecord {
  readonly tripId: string;
  readonly travelerId: string;
  readonly driverId?: string;
  readonly routeId: string;
  readonly tier: 'hype_go' | 'hype_confort' | 'hype_pro';
  readonly status: string;
  readonly fareMxn: number;
  readonly paymentMethod: 'wallet_hype' | 'stripe_card' | 'cash';
  readonly crossRule: boolean;
  readonly code?: string;
  readonly etaMinutes?: number;
}

export interface ChatMessage {
  readonly messageId: string;
  readonly tripId: string;
  readonly senderUid: string;
  readonly text: string;
  readonly createdAt: string;
}

export interface AuraTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface AuraStructuredResponse {
  readonly draftId?: string;
  readonly mensaje_conversacional: string;
  readonly estado_cotizacion: 'recopilando_datos' | 'borrador_listo';
  readonly datos_cliente?: {
    readonly ocasion?: string;
    readonly dias?: number;
    readonly personas?: number;
    readonly alergias_notas?: string;
  };
  readonly itinerario_propuesto?: readonly {
    readonly dia: number;
    readonly vertical: string;
    readonly ally_id: string;
    readonly servicio_nombre: string;
    readonly precio_neto_aliado: number;
    readonly notas_logisticas?: string;
  }[];
  readonly resumen_financiero?: {
    readonly subtotal_aliados: number;
    readonly comision_concierge_15_pct: number;
    readonly total_cliente_mxn: number;
  };
  readonly preloadSuggestionMxn?: number;
}

export interface ConciergeRequestRecord {
  readonly requestId: string;
  readonly explorerUid: string;
  readonly status: 'draft_from_aura' | 'under_review' | 'approved_payment_sent' | 'paid';
  readonly paymentLinkCode?: string;
  readonly financials: {
    readonly allies_subtotal_mxn: number;
    readonly concierge_commission_rate: number;
    readonly concierge_fee_mxn: number;
    readonly final_client_total_mxn: number;
  };
}

export interface PackageSpec {
  readonly title: string;
  readonly days: number;
  readonly items: readonly {
    readonly day: number;
    readonly allyId: string;
    readonly listingId: string;
    readonly serviceLabel: string;
    readonly netPriceMxn: number;
  }[];
}

export interface PackageRecord {
  readonly packageId: string;
  readonly title: string;
  readonly totalMxn: number;
  readonly status: string;
}

export interface SubBookingRecord {
  readonly subBookingId: string;
  readonly packageBookingId: string;
  readonly partnerId: string;
  readonly serviceLabel: string;
  readonly date: string;
  readonly time: string;
  readonly guests: number;
  readonly status: 'directa' | 'cancelada' | 'completada';
  readonly netAmountMxn: number;
  readonly packageTotalMxn?: never;
  readonly otherPartners?: never;
}

export interface GuideAssignment {
  readonly packageBookingId: string;
  readonly tourTitle: string;
  readonly clients: readonly string[];
  readonly schedule: string;
  readonly meetingPoint: string;
}

export interface ReviewRecord {
  readonly reviewId: string;
  readonly targetType: 'service' | 'transport_driver' | 'transport_passenger' | 'package';
  readonly bookingOrTripId: string;
  readonly stars: number;
  readonly comment: string;
  readonly photos: readonly string[];
  readonly allyReply?: string | null;
}

export interface ScreenSnapshot {
  readonly screen: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly theme: 'dark' | 'light';
  readonly renderedTree: unknown;
  readonly textContent: string;
}

export interface ThemeTokensSnapshot {
  readonly theme: 'dark' | 'light';
  readonly background: string;
  readonly cardBackground: string;
  readonly backdropFilter: string;
  readonly cardBorder: string;
  readonly primaryButton: string;
  readonly accent?: string;
}

export interface DesignAuditResult {
  readonly tokens: Record<string, string>;
  readonly hasEmojiIcons: boolean;
  readonly horizontalOverflowPx: number;
  readonly buttonSymmetryViolations: readonly string[];
  readonly splashDurationMs?: number;
  readonly helpSheetOpaque?: boolean;
  readonly datePickerLiquidGlass?: boolean;
  readonly bottomDockOrder?: readonly string[];
}

export interface OddEventRecord {
  readonly event: string;
  readonly actorUid?: string;
  readonly entityId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: string;
}

export interface OddMetricsSnapshot {
  readonly paidBookingsByVertical: Record<string, number>;
  readonly insufficientBalanceRejections: number;
  readonly avgDriverAcceptMs: number;
  readonly ticketsScannedVsIssued: readonly [number, number];
  readonly paymentQrErrorsPerHour: number;
  readonly auraToPaidConversionRate: number;
  readonly avgConciergeApprovalMs: number;
}

export interface OddAlertRecord {
  readonly key: string;
  readonly active: boolean;
  readonly severity?: string;
  readonly message?: string;
}

type AnyFn = (...args: unknown[]) => unknown;

function resolveCallable(
  targetKey: ContractTargetKey,
  candidateNames: readonly string[]
): AnyFn {
  const api = requireContract(targetKey, []);
  for (const name of candidateNames) {
    const fn = api[name];
    if (typeof fn === 'function') {
      return fn as AnyFn;
    }
  }
  throw new ContractNotImplementedError({
    targetKey,
    milestone: 'M1-M5',
    searchedPaths: [],
    missingExports: candidateNames,
    detail: `Module resolved for "${targetKey}", but none of [${candidateNames.join(', ')}] were exported as callable functions/methods.`,
  });
}

async function invokeTargetOperation<T>(
  ctx: HarnessContext,
  targetKey: ContractTargetKey,
  moduleCandidateNames: readonly string[],
  emulatorFnName: string,
  payload: unknown,
  session?: UserSession
): Promise<T> {
  if (ctx.target === 'emulator' || getE2ETargetMode() === 'emulator') {
    const headers: Record<string, string> = {};
    if (session?.idToken) {
      headers.Authorization = `Bearer ${session.idToken}`;
    }
    const res = await invokeHttpEndpoint<T>(emulatorFnName, payload, headers, {
      callable: true,
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new ContractNotImplementedError({
          targetKey,
          milestone: 'M3',
          searchedPaths: [res.url],
          missingExports: [emulatorFnName],
          detail: `HTTP ${res.status} from emulator endpoint ${res.url}`,
        });
      }
      const errMsg =
        typeof res.data === 'object' && res.data !== null && 'error' in res.data
          ? JSON.stringify((res.data as Record<string, unknown>).error)
          : res.rawText || `HTTP ${res.status}`;
      throw new Error(errMsg);
    }
    return res.data;
  }

  const fn = resolveCallable(targetKey, moduleCandidateNames);
  const result = await fn(payload, session, ctx);
  return result as T;
}

export const harness = {
  async boot(options?: {
    target?: HarnessTarget;
    baseUrl?: string;
  }): Promise<HarnessContext> {
    const mode = getE2ETargetMode();
    const cfg = getEmulatorConfig();
    const target: HarnessTarget =
      options?.target ?? (mode === 'emulator' ? 'emulator' : 'in_memory');
    const nowIso = new Date('2026-11-19T12:00:00.000Z').toISOString();

    const ctx: HarnessContext = {
      target,
      baseUrl: options?.baseUrl ?? cfg.functionsBaseUrl,
      projectId: cfg.projectId,
      startedAtIso: nowIso,
      currentTimeIso: nowIso,
      cleanupTasks: [],
    };

    if (target === 'emulator') {
      const probe = await invokeHttpEndpoint('healthCheck', {}, {}, { method: 'GET' }).catch(
        (err: unknown) => {
          throw new ContractNotImplementedError({
            targetKey: 'concierge',
            milestone: 'M3',
            searchedPaths: [cfg.functionsBaseUrl],
            missingExports: ['healthCheck'],
            detail: `Firebase emulator unreachable at ${cfg.functionsBaseUrl}: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      );
      if (probe.status === 404) {
        // Functions host responded even if healthCheck route is absent; let individual calls validate routes
      }
    }

    return ctx;
  },

  async resetAndSeedPilotData(ctx: HarnessContext): Promise<SeedSnapshot> {
    const seedPayload = {
      pricingRules: PRICING_RULES,
      conciergeAccounts: CONCIERGE_ACCOUNTS,
      mariscosRulos: MARISCOS_RULOS_SEED,
      oneByPro: ONE_BY_PRO_SEED,
      alejandroValdes: ALEJANDRO_VALDES_ANOMALY,
      tracedRoutes: TAXI_TRACED_ROUTES,
    };

    if (ctx.target === 'emulator' || getE2ETargetMode() === 'emulator') {
      const res = await invokeHttpEndpoint<SeedSnapshot>('seedPilotData', seedPayload, {}, {
        callable: true,
      });
      if (!res.ok) {
        throw new ContractNotImplementedError({
          targetKey: 'catalog',
          milestone: 'M1/M3',
          searchedPaths: [res.url],
          missingExports: ['seedPilotData'],
          detail: `Emulator seedPilotData returned HTTP ${res.status}: ${res.rawText}`,
        });
      }
      return res.data;
    }

    const seedFn = resolveCallable('catalog', [
      'resetAndSeedPilotData',
      'seedPilotData',
      'seedDatabase',
    ]);
    return (await seedFn(seedPayload, ctx)) as SeedSnapshot;
  },

  async advanceClock(
    ctx: HarnessContext,
    delta: { days?: number; ms?: number }
  ): Promise<string> {
    const deltaMs = (delta.days ?? 0) * 86400000 + (delta.ms ?? 0);
    const nextMs = Date.parse(ctx.currentTimeIso) + deltaMs;
    const nextIso = new Date(nextMs).toISOString();
    ctx.currentTimeIso = nextIso;

    if (ctx.target === 'emulator' || getE2ETargetMode() === 'emulator') {
      await invokeHttpEndpoint('setTestClock', { nowIso: nextIso }, {}, { callable: true });
      return nextIso;
    }

    const api = requireContract('catalog', []);
    if (typeof api.setTestClock === 'function') {
      await (api.setTestClock as AnyFn)(nextIso, ctx);
    }
    return nextIso;
  },

  async teardown(ctx: HarnessContext): Promise<void> {
    while (ctx.cleanupTasks.length > 0) {
      const task = ctx.cleanupTasks.pop();
      if (task) {
        await task();
      }
    }
    if (ctx.target === 'emulator' || getE2ETargetMode() === 'emulator') {
      return;
    }
    try {
      const api = requireContract('catalog', []);
      if (typeof api.resetTestState === 'function') {
        await (api.resetTestState as AnyFn)(ctx);
      }
    } catch {
      // Do not mask test errors if target is not yet implemented during teardown
    }
  },
};

export const authHelper = {
  async registerExplorer(
    ctx: HarnessContext,
    payload: {
      displayName: string;
      email: string;
      phone: string;
      termsAccepted: boolean;
      allergies?: string[];
    }
  ): Promise<UserSession> {
    return invokeTargetOperation<UserSession>(
      ctx,
      'auth',
      ['registerExplorer', 'registerUser'],
      'registerExplorer',
      payload
    );
  },

  async signIn(
    ctx: HarnessContext,
    payload: { email: string; password?: string }
  ): Promise<UserSession> {
    return invokeTargetOperation<UserSession>(
      ctx,
      'auth',
      ['signIn', 'loginUser'],
      'signIn',
      payload
    );
  },

  async switchMode(
    ctx: HarnessContext,
    session: UserSession,
    targetMode: 'viajero' | 'aliado'
  ): Promise<{ session: UserSession; splashDurationMs: number }> {
    return invokeTargetOperation<{ session: UserSession; splashDurationMs: number }>(
      ctx,
      'auth',
      ['switchMode'],
      'switchMode',
      { uid: session.uid, targetMode },
      session
    );
  },

  async attemptConciergeAccess(
    ctx: HarnessContext,
    session: UserSession
  ): Promise<{ allowed: boolean; error?: string }> {
    return invokeTargetOperation<{ allowed: boolean; error?: string }>(
      ctx,
      'auth',
      ['attemptConciergeAccess', 'checkConciergeAccess'],
      'attemptConciergeAccess',
      { uid: session.uid, email: session.email },
      session
    );
  },

  async createStaffAccount(
    ctx: HarnessContext,
    allyOwnerSession: UserSession,
    payload: {
      allyId: string;
      displayName: string;
      email: string;
      roleLabel: 'puerta' | 'muelle' | 'recepcion';
    }
  ): Promise<UserSession> {
    return invokeTargetOperation<UserSession>(
      ctx,
      'auth',
      ['createStaffAccount'],
      'createStaffAccount',
      { ...payload, actorUid: allyOwnerSession.uid },
      allyOwnerSession
    );
  },

  async createGuideAccount(
    ctx: HarnessContext,
    conciergeSession: UserSession,
    payload: {
      displayName: string;
      email: string;
      phone: string;
      assignedTourIds: string[];
    }
  ): Promise<UserSession> {
    return invokeTargetOperation<UserSession>(
      ctx,
      'auth',
      ['createGuideAccount'],
      'createGuideAccount',
      { ...payload, actorUid: conciergeSession.uid },
      conciergeSession
    );
  },

  async getRegisteredAccounts(
    ctx: HarnessContext,
    session: UserSession
  ): Promise<AccountSummary[]> {
    return invokeTargetOperation<AccountSummary[]>(
      ctx,
      'auth',
      ['getRegisteredAccounts', 'listRegisteredAccounts'],
      'getRegisteredAccounts',
      { actorUid: session.uid },
      session
    );
  },
};

export const catalogHelper = {
  async onboardAlly(
    ctx: HarnessContext,
    session: UserSession,
    payload: {
      category: 'venue' | 'tour' | 'accommodation' | 'transport';
      subcategory: string;
      profile: Record<string, unknown>;
      verticalConfig: Record<string, unknown>;
      payoutConfig: Record<string, unknown>;
    }
  ): Promise<AllyRecord> {
    return invokeTargetOperation<AllyRecord>(
      ctx,
      'catalog',
      ['onboardAlly', 'registerAlly'],
      'onboardAlly',
      { ...payload, ownerUid: session.uid },
      session
    );
  },

  async activateAlly(
    ctx: HarnessContext,
    conciergeSession: UserSession,
    allyId: string,
    activatedAtIso?: string
  ): Promise<AllyRecord> {
    return invokeTargetOperation<AllyRecord>(
      ctx,
      'catalog',
      ['activateAlly'],
      'activateAlly',
      {
        allyId,
        activatedAtIso: activatedAtIso ?? ctx.currentTimeIso,
        actorUid: conciergeSession.uid,
      },
      conciergeSession
    );
  },

  async updateOffer24x7(
    ctx: HarnessContext,
    allySession: UserSession,
    allyId: string,
    listingId: string,
    patch: Record<string, unknown>
  ): Promise<ListingRecord> {
    return invokeTargetOperation<ListingRecord>(
      ctx,
      'catalog',
      ['updateOffer24x7', 'updateListingOffer'],
      'updateOffer24x7',
      { allyId, listingId, patch, actorUid: allySession.uid },
      allySession
    );
  },

  async publishListing(
    ctx: HarnessContext,
    allySession: UserSession,
    listingId: string
  ): Promise<{ published: boolean; status: 'publicado' | 'en_progreso'; missing: string[] }> {
    return invokeTargetOperation<{
      published: boolean;
      status: 'publicado' | 'en_progreso';
      missing: string[];
    }>(
      ctx,
      'catalog',
      ['publishListing'],
      'publishListing',
      { listingId, actorUid: allySession.uid },
      allySession
    );
  },

  async listDynamicCategories(
    ctx: HarnessContext,
    explorerSession: UserSession
  ): Promise<string[]> {
    return invokeTargetOperation<string[]>(
      ctx,
      'catalog',
      ['listDynamicCategories', 'getActiveCategories'],
      'listDynamicCategories',
      { actorUid: explorerSession.uid },
      explorerSession
    );
  },

  async getAllyClientView(
    ctx: HarnessContext,
    session: UserSession,
    allyId: string
  ): Promise<PublicAllyView> {
    return invokeTargetOperation<PublicAllyView>(
      ctx,
      'catalog',
      ['getAllyClientView'],
      'getAllyClientView',
      { allyId, actorUid: session.uid },
      session
    );
  },
};

export const walletHelper = {
  async topUpWalletStripe(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: { amountMxn: number; stripeToken?: string }
  ): Promise<{ balanceMxn: number; txId: string; receiptId: string }> {
    return invokeTargetOperation<{ balanceMxn: number; txId: string; receiptId: string }>(
      ctx,
      'wallet',
      ['topUpWalletStripe', 'topUpWallet'],
      'topUpWalletStripe',
      { ...payload, uid: explorerSession.uid },
      explorerSession
    );
  },

  async configureAutoRecharge(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      enabled: boolean;
      minBalanceMxn: number;
      rechargeAmountMxn: number;
      monthlyCapMxn?: number | null;
    }
  ): Promise<AutoRechargeConfig> {
    return invokeTargetOperation<AutoRechargeConfig>(
      ctx,
      'wallet',
      ['configureAutoRecharge'],
      'configureAutoRecharge',
      { ...payload, uid: explorerSession.uid },
      explorerSession
    );
  },

  async getLowBalanceAlert(
    ctx: HarnessContext,
    explorerSession: UserSession,
    upcomingBookingId: string
  ): Promise<{
    alerted: boolean;
    shortfallMxn: number;
    oneTapSuggestedAmountMxn: number;
  }> {
    return invokeTargetOperation<{
      alerted: boolean;
      shortfallMxn: number;
      oneTapSuggestedAmountMxn: number;
    }>(
      ctx,
      'wallet',
      ['getLowBalanceAlert'],
      'getLowBalanceAlert',
      { uid: explorerSession.uid, upcomingBookingId },
      explorerSession
    );
  },

  async payBooking(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      bookingId: string;
      method: 'wallet_hype' | 'stripe_card' | 'mixed';
      walletPartMxn?: number;
      cardPartMxn?: number;
    }
  ): Promise<PaymentResult> {
    return invokeTargetOperation<PaymentResult>(
      ctx,
      'wallet',
      ['payBooking'],
      'payBooking',
      { ...payload, uid: explorerSession.uid },
      explorerSession
    );
  },

  async attemptWalletWithdrawalOrTransfer(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: { kind: 'withdraw' | 'transfer'; amountMxn: number; targetUid?: string }
  ): Promise<never> {
    return invokeTargetOperation<never>(
      ctx,
      'wallet',
      ['attemptWalletWithdrawalOrTransfer', 'withdrawOrTransferWallet'],
      'attemptWalletWithdrawalOrTransfer',
      { ...payload, uid: explorerSession.uid },
      explorerSession
    );
  },

  async getWalletLedger(
    ctx: HarnessContext,
    session: UserSession,
    uidOrAllyId: string
  ): Promise<WalletTransactionRecord[]> {
    return invokeTargetOperation<WalletTransactionRecord[]>(
      ctx,
      'wallet',
      ['getWalletLedger', 'listWalletTransactions'],
      'getWalletLedger',
      { uidOrAllyId, actorUid: session.uid },
      session
    );
  },

  async getReceipts(
    ctx: HarnessContext,
    explorerSession: UserSession,
    source: 'wallet' | 'tickets_recibos'
  ): Promise<ReceiptRecord[]> {
    return invokeTargetOperation<ReceiptRecord[]>(
      ctx,
      'wallet',
      ['getReceipts', 'listReceipts'],
      'getReceipts',
      { uid: explorerSession.uid, source },
      explorerSession
    );
  },

  async runSpeiPayoutCut(
    ctx: HarnessContext,
    conciergeSession: UserSession,
    allyId: string
  ): Promise<{ cutId: string; netMxn: number; clabeLast4: string }> {
    return invokeTargetOperation<{ cutId: string; netMxn: number; clabeLast4: string }>(
      ctx,
      'wallet',
      ['runSpeiPayoutCut'],
      'runSpeiPayoutCut',
      { allyId, actorUid: conciergeSession.uid },
      conciergeSession
    );
  },

  async getAllyPayoutPanel(
    ctx: HarnessContext,
    allySession: UserSession,
    allyId: string
  ): Promise<{
    pendingPayoutBalanceMxn: number;
    promoDaysRemaining: number;
    activeCommissionRate: number;
    clabeLast4?: string;
  }> {
    return invokeTargetOperation<{
      pendingPayoutBalanceMxn: number;
      promoDaysRemaining: number;
      activeCommissionRate: number;
      clabeLast4?: string;
    }>(
      ctx,
      'wallet',
      ['getAllyPayoutPanel'],
      'getAllyPayoutPanel',
      { allyId, actorUid: allySession.uid },
      allySession
    );
  },
};

export const venueHelper = {
  async createVenueBookingWithPreOrder(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      allyId: string;
      listingId: string;
      date: string;
      turn: string;
      guests: number;
      items: { itemId: string; qty: number }[];
      allergies?: string[] | null;
      bottleIds?: string[];
    }
  ): Promise<BookingRecord> {
    return invokeTargetOperation<BookingRecord>(
      ctx,
      'club',
      ['createVenueBookingWithPreOrder', 'createVenueBooking'],
      'createVenueBookingWithPreOrder',
      { ...payload, travelerId: explorerSession.uid },
      explorerSession
    );
  },

  async getVenueBookingFlowConfig(
    ctx: HarnessContext,
    explorerSession: UserSession,
    allyId: string
  ): Promise<{
    showBar360: boolean;
    requiresAllergies: boolean;
    menuItems: MenuItem[];
    bar360Bottles: BottleItem[];
  }> {
    return invokeTargetOperation<{
      showBar360: boolean;
      requiresAllergies: boolean;
      menuItems: MenuItem[];
      bar360Bottles: BottleItem[];
    }>(
      ctx,
      'club',
      ['getVenueBookingFlowConfig'],
      'getVenueBookingFlowConfig',
      { allyId, actorUid: explorerSession.uid },
      explorerSession
    );
  },

  async getKitchenPreOrderView(
    ctx: HarnessContext,
    allySession: UserSession,
    bookingId: string
  ): Promise<{ allergies: string[]; items: PreOrderItem[]; status: string }> {
    return invokeTargetOperation<{
      allergies: string[];
      items: PreOrderItem[];
      status: string;
    }>(
      ctx,
      'club',
      ['getKitchenPreOrderView'],
      'getKitchenPreOrderView',
      { bookingId, actorUid: allySession.uid },
      allySession
    );
  },

  async closeFinalTicket(
    ctx: HarnessContext,
    allySession: UserSession,
    payload: { bookingId: string; extrasMxn: number; tipsMxn: number }
  ): Promise<{
    finalTicketMxn: number;
    commissionMxn: number;
    tipsMxn: number;
    allyNetMxn: number;
  }> {
    return invokeTargetOperation<{
      finalTicketMxn: number;
      commissionMxn: number;
      tipsMxn: number;
      allyNetMxn: number;
    }>(
      ctx,
      'club',
      ['closeFinalTicket'],
      'closeFinalTicket',
      { ...payload, staffUid: allySession.uid },
      allySession
    );
  },

  async scanTicketQR(
    ctx: HarnessContext,
    staffSession: UserSession,
    ticketCode: string
  ): Promise<{ authorized: boolean; message: string }> {
    return invokeTargetOperation<{ authorized: boolean; message: string }>(
      ctx,
      'club',
      ['scanTicketQR'],
      'scanTicketQR',
      { ticketCode, staffUid: staffSession.uid },
      staffSession
    );
  },
};

export const taxiHelper = {
  async registerDriverVehicle(
    ctx: HarnessContext,
    driverSession: UserSession,
    payload: {
      tier: 'hype_go' | 'hype_confort' | 'hype_pro';
      model: string;
      year?: number;
      plates: string;
      hasAc: boolean;
      photos: string[];
      driverType?: 'blue' | 'yellow';
    }
  ): Promise<AllyRecord> {
    return invokeTargetOperation<AllyRecord>(
      ctx,
      'taxi',
      ['registerDriverVehicle'],
      'registerDriverVehicle',
      { ...payload, driverUid: driverSession.uid },
      driverSession
    );
  },

  async setDriverPresence(
    ctx: HarnessContext,
    driverSession: UserSession,
    payload: {
      lat: number;
      lng: number;
      isOnline: boolean;
      isEmpty?: boolean;
      routeId?: string;
    }
  ): Promise<{ isOnline: boolean; pauseReason?: string }> {
    return invokeTargetOperation<{ isOnline: boolean; pauseReason?: string }>(
      ctx,
      'taxi',
      ['setDriverPresence'],
      'setDriverPresence',
      { ...payload, driverUid: driverSession.uid },
      driverSession
    );
  },

  async getTaxiMapState(
    ctx: HarnessContext,
    explorerSession: UserSession
  ): Promise<{ visibleDrivers: DriverMarker[]; tracedRoutes: string[] }> {
    return invokeTargetOperation<{ visibleDrivers: DriverMarker[]; tracedRoutes: string[] }>(
      ctx,
      'taxi',
      ['getTaxiMapState'],
      'getTaxiMapState',
      { actorUid: explorerSession.uid },
      explorerSession
    );
  },

  async quoteTaxi(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      origin: LatLng;
      destination: LatLng;
      routeId: string;
      tier: 'hype_go' | 'hype_confort' | 'hype_pro';
      distanceKm: number;
      durationMin: number;
    }
  ): Promise<TaxiQuote> {
    return invokeTargetOperation<TaxiQuote>(
      ctx,
      'taxi',
      ['quoteTaxi'],
      'quoteTaxi',
      {
        ...payload,
        km: payload.distanceKm,
        min: payload.durationMin,
        user: {
          uid: explorerSession.uid,
          concierge_access: explorerSession.conciergeAccess,
          vip: Boolean(explorerSession.vip),
        },
      },
      explorerSession
    );
  },

  async requestTrip(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      quoteId: string;
      paymentMethod: 'wallet_hype' | 'stripe_card' | 'cash';
    }
  ): Promise<TripRecord> {
    return invokeTargetOperation<TripRecord>(
      ctx,
      'taxi',
      ['requestTrip'],
      'requestTrip',
      { ...payload, travelerId: explorerSession.uid },
      explorerSession
    );
  },

  async acceptTrip(
    ctx: HarnessContext,
    driverSession: UserSession,
    tripId: string
  ): Promise<TripRecord> {
    return invokeTargetOperation<TripRecord>(
      ctx,
      'taxi',
      ['acceptTrip'],
      'acceptTrip',
      { tripId, driverUid: driverSession.uid },
      driverSession
    );
  },

  async completeTrip(
    ctx: HarnessContext,
    driverSession: UserSession,
    tripId: string
  ): Promise<{
    trip: TripRecord;
    driverPoolBalanceMxn: number;
    driverIsOnline: boolean;
  }> {
    return invokeTargetOperation<{
      trip: TripRecord;
      driverPoolBalanceMxn: number;
      driverIsOnline: boolean;
    }>(
      ctx,
      'taxi',
      ['completeTrip'],
      'completeTrip',
      { tripId, driverUid: driverSession.uid },
      driverSession
    );
  },

  async topUpDriverPool(
    ctx: HarnessContext,
    driverSession: UserSession,
    amountMxn: number
  ): Promise<{ driverPoolBalanceMxn: number; isOnline: boolean }> {
    return invokeTargetOperation<{ driverPoolBalanceMxn: number; isOnline: boolean }>(
      ctx,
      'taxi',
      ['topUpDriverPool'],
      'topUpDriverPool',
      { driverUid: driverSession.uid, amountMxn },
      driverSession
    );
  },

  async sendTripChatMessage(
    ctx: HarnessContext,
    session: UserSession,
    tripId: string,
    text: string
  ): Promise<void> {
    await invokeTargetOperation<void>(
      ctx,
      'taxi',
      ['sendTripChatMessage'],
      'sendTripChatMessage',
      { tripId, senderUid: session.uid, text },
      session
    );
  },

  async readTripChat(
    ctx: HarnessContext,
    session: UserSession,
    tripId: string
  ): Promise<ChatMessage[]> {
    return invokeTargetOperation<ChatMessage[]>(
      ctx,
      'taxi',
      ['readTripChat'],
      'readTripChat',
      { tripId, actorUid: session.uid },
      session
    );
  },

  async getTripWhatsAppLink(
    ctx: HarnessContext,
    session: UserSession,
    tripId: string
  ): Promise<{ url: string; decodedText: string }> {
    return invokeTargetOperation<{ url: string; decodedText: string }>(
      ctx,
      'taxi',
      ['getTripWhatsAppLink'],
      'getTripWhatsAppLink',
      { tripId, actorUid: session.uid },
      session
    );
  },
};

export const conciergeHelper = {
  async chatWithAura(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: { message: string; history: AuraTurn[] }
  ): Promise<AuraStructuredResponse> {
    return invokeTargetOperation<AuraStructuredResponse>(
      ctx,
      'concierge',
      ['chatWithAura'],
      'chatWithAura',
      { ...payload, uid: explorerSession.uid },
      explorerSession
    );
  },

  async submitAuraDraftToConcierge(
    ctx: HarnessContext,
    explorerSession: UserSession,
    draftId: string
  ): Promise<ConciergeRequestRecord> {
    return invokeTargetOperation<ConciergeRequestRecord>(
      ctx,
      'concierge',
      ['submitAuraDraftToConcierge'],
      'submitAuraDraftToConcierge',
      { draftId, explorerUid: explorerSession.uid },
      explorerSession
    );
  },

  async reviewAndApproveConciergeRequest(
    ctx: HarnessContext,
    conciergeSession: UserSession,
    requestId: string
  ): Promise<{ status: string; paymentLinkCode: string }> {
    return invokeTargetOperation<{ status: string; paymentLinkCode: string }>(
      ctx,
      'concierge',
      ['reviewAndApproveConciergeRequest'],
      'reviewAndApproveConciergeRequest',
      { requestId, actorUid: conciergeSession.uid },
      conciergeSession
    );
  },

  async payConciergeLink(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      paymentLinkCode: string;
      method: 'wallet_hype' | 'stripe_card' | 'mixed';
    }
  ): Promise<{ status: 'paid'; bookingIds: string[] }> {
    return invokeTargetOperation<{ status: 'paid'; bookingIds: string[] }>(
      ctx,
      'concierge',
      ['payConciergeLink'],
      'payConciergeLink',
      { ...payload, explorerUid: explorerSession.uid },
      explorerSession
    );
  },

  async createXperiencePackage(
    ctx: HarnessContext,
    conciergeSession: UserSession,
    payload: PackageSpec
  ): Promise<PackageRecord> {
    return invokeTargetOperation<PackageRecord>(
      ctx,
      'concierge',
      ['createXperiencePackage'],
      'createXperiencePackage',
      { ...payload, actorUid: conciergeSession.uid },
      conciergeSession
    );
  },

  async bookPackage(
    ctx: HarnessContext,
    explorerSession: UserSession,
    payload: {
      packageId: string;
      method: 'wallet_hype' | 'stripe_card' | 'mixed';
    }
  ): Promise<{ packageBookingId: string; subBookingIds: string[] }> {
    return invokeTargetOperation<{ packageBookingId: string; subBookingIds: string[] }>(
      ctx,
      'concierge',
      ['bookPackage'],
      'bookPackage',
      { ...payload, travelerId: explorerSession.uid },
      explorerSession
    );
  },

  async cancelPackage(
    ctx: HarnessContext,
    explorerSession: UserSession,
    packageBookingId: string
  ): Promise<{
    status: 'cancelada';
    refundedMxn: number;
    subBookings: SubBookingRecord[];
  }> {
    return invokeTargetOperation<{
      status: 'cancelada';
      refundedMxn: number;
      subBookings: SubBookingRecord[];
    }>(
      ctx,
      'concierge',
      ['cancelPackage', 'cancelPackageBeforeAcceptance'],
      'cancelPackage',
      { packageBookingId, actorUid: explorerSession.uid },
      explorerSession
    );
  },

  async getAllySubBookings(
    ctx: HarnessContext,
    allySession: UserSession,
    allyId: string
  ): Promise<SubBookingRecord[]> {
    return invokeTargetOperation<SubBookingRecord[]>(
      ctx,
      'concierge',
      ['getAllySubBookings'],
      'getAllySubBookings',
      { allyId, actorUid: allySession.uid },
      allySession
    );
  },

  async assignGuide(
    ctx: HarnessContext,
    conciergeSession: UserSession,
    payload: { packageBookingId: string; guideUid: string }
  ): Promise<void> {
    await invokeTargetOperation<void>(
      ctx,
      'concierge',
      ['assignGuide'],
      'assignGuide',
      { ...payload, actorUid: conciergeSession.uid },
      conciergeSession
    );
  },

  async getGuideSchedule(
    ctx: HarnessContext,
    guideSession: UserSession
  ): Promise<GuideAssignment[]> {
    return invokeTargetOperation<GuideAssignment[]>(
      ctx,
      'concierge',
      ['getGuideSchedule'],
      'getGuideSchedule',
      { guideUid: guideSession.uid },
      guideSession
    );
  },
};

export const reviewHelper = {
  async submitReview(
    ctx: HarnessContext,
    session: UserSession,
    payload: {
      targetType: 'service' | 'transport_driver' | 'transport_passenger' | 'package';
      bookingOrTripId: string;
      stars: number;
      comment: string;
      photos?: string[];
      perServiceRatings?: Record<string, number>;
    }
  ): Promise<ReviewRecord> {
    return invokeTargetOperation<ReviewRecord>(
      ctx,
      'reviews',
      ['submitReview', 'createReview'],
      'submitReview',
      { ...payload, authorUid: session.uid },
      session
    );
  },

  async replyToReview(
    ctx: HarnessContext,
    allySession: UserSession,
    payload: { allyId: string; reviewId: string; replyText: string }
  ): Promise<ReviewRecord> {
    return invokeTargetOperation<ReviewRecord>(
      ctx,
      'reviews',
      ['replyToReview'],
      'replyToReview',
      { ...payload, actorUid: allySession.uid },
      allySession
    );
  },
};

export const uiHelper = {
  async renderScreen(
    ctx: HarnessContext,
    session: UserSession,
    screen: string,
    viewport: { width: number; height: number }
  ): Promise<ScreenSnapshot> {
    return invokeTargetOperation<ScreenSnapshot>(
      ctx,
      'tokens',
      ['renderScreen'],
      'renderScreen',
      { screen, viewport, actorUid: session.uid },
      session
    );
  },

  async toggleTheme(
    ctx: HarnessContext,
    session: UserSession,
    theme: 'dark' | 'light'
  ): Promise<ThemeTokensSnapshot> {
    return invokeTargetOperation<ThemeTokensSnapshot>(
      ctx,
      'tokens',
      ['toggleTheme', 'setProfileTheme'],
      'toggleTheme',
      { uid: session.uid, theme },
      session
    );
  },

  async getDesignAudit(
    ctx: HarnessContext,
    snapshot: ScreenSnapshot
  ): Promise<DesignAuditResult> {
    return invokeTargetOperation<DesignAuditResult>(
      ctx,
      'tokens',
      ['getDesignAudit'],
      'getDesignAudit',
      { snapshot }
    );
  },
};

export const oddHelper = {
  async getOddEvents(
    ctx: HarnessContext,
    filter?: { event?: string; actorUid?: string; entityId?: string }
  ): Promise<OddEventRecord[]> {
    return invokeTargetOperation<OddEventRecord[]>(
      ctx,
      'odd',
      ['getOddEvents', 'listOddLogs'],
      'getOddEvents',
      filter ?? {}
    );
  },

  async assertOddSequence(
    ctx: HarnessContext,
    expectedEventNames: string[]
  ): Promise<void> {
    const events = await oddHelper.getOddEvents(ctx);
    let cursor = 0;
    for (const expected of expectedEventNames) {
      let found = false;
      while (cursor < events.length) {
        if (events[cursor]?.event === expected) {
          found = true;
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      if (!found) {
        const recorded = events.map((e) => e.event);
        throw new Error(
          `Expected ODD event sequence missing "${expected}". Recorded events: [${recorded.join(', ')}]`
        );
      }
    }
  },

  async getOddMetrics(ctx: HarnessContext): Promise<OddMetricsSnapshot> {
    return invokeTargetOperation<OddMetricsSnapshot>(
      ctx,
      'odd',
      ['getOddMetrics', 'computeOddMetrics'],
      'getOddMetrics',
      {}
    );
  },

  async getActiveOddAlerts(ctx: HarnessContext): Promise<OddAlertRecord[]> {
    return invokeTargetOperation<OddAlertRecord[]>(
      ctx,
      'odd',
      ['getActiveOddAlerts', 'evaluateOddAlerts'],
      'getActiveOddAlerts',
      {}
    );
  },
};
