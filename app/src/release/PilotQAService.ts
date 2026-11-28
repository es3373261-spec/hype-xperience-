import { CatalogManager } from '../catalog/CatalogManager';
import { ConciergeAuraService } from '../concierge/ConciergeAuraService';
import { getOddLogs, MVP_ODD_EVENTS } from '../observability/oddLogger';
import { TaxiService } from '../taxi/TaxiService';
import { TouristService } from '../tourist/TouristService';
import { Ally, CatalogCategory } from '../types/catalog';
import {
  OddAlertsSummary,
  OddMetricsSummary,
  PilotCatalogReadiness,
  ReleaseDistributionConfig,
  SecurityAuditReport,
} from '../types/release';
import { User, UserAccount } from '../types/user';
import { WalletService } from '../wallet/WalletService';
import { getFirebaseInstance, mockStore } from '../firebase/config';

export const REQUIRED_ODD_EVENTS = MVP_ODD_EVENTS;

export interface PilotQADependencies {
  catalog: CatalogManager;
  walletService?: WalletService;
  touristService?: TouristService;
  taxiService?: TaxiService;
  conciergeService?: ConciergeAuraService;
}

export class PilotQAService {
  private deps: PilotQADependencies;

  constructor(deps: PilotQADependencies) {
    this.deps = deps;
  }

  // Cálculo de las 7 métricas obligatorias de ODD (spec §13)
  computeMetrics(): OddMetricsSummary {
    const paidLogs = getOddLogs('booking.paid');
    const paidBookingsByCategory: Partial<Record<CatalogCategory, number>> = {};
    const paidBookingsByDayAndVertical: Record<string, Record<string, number>> = {};

    for (const log of paidLogs) {
      const bookingId = log.payload?.bookingId || log.entityId;
      const booking =
        bookingId && this.deps.touristService
          ? this.deps.touristService.getBookingById(bookingId)
          : null;
      const service = booking
        ? this.deps.catalog.getServiceById(booking.serviceId)
        : null;
      if (service) {
        paidBookingsByCategory[service.categoría] =
          (paidBookingsByCategory[service.categoría] || 0) + 1;
      }

      const day = log.metadata?.day || log.timestamp.slice(0, 10);
      const vertical = log.metadata?.vertical || service?.categoría || 'unknown';
      if (!paidBookingsByDayAndVertical[day]) {
        paidBookingsByDayAndVertical[day] = {};
      }
      paidBookingsByDayAndVertical[day][vertical] =
        (paidBookingsByDayAndVertical[day][vertical] || 0) + 1;
    }

    const rejectedPaymentLogs = getOddLogs('wallet.payment_rejected');
    const doublePaymentLogs = getOddLogs('booking.double_payment_blocked');
    const scannedLogs = getOddLogs('ticket.scanned');
    const rejectedTicketLogs = getOddLogs('ticket.rejected');

    const tripRequestedLogs = getOddLogs('trip.requested');
    const tripAcceptedLogs = getOddLogs('trip.accepted');

    let totalAcceptanceMs = 0;
    let acceptedCount = 0;

    for (const acc of tripAcceptedLogs) {
      const accTripId = acc.payload?.tripId || acc.entityId;
      const req = tripRequestedLogs.find(
        (r) => (r.payload?.tripId || r.entityId) === accTripId
      );
      if (req) {
        const diffMs = Math.max(
          0,
          new Date(acc.timestamp).getTime() - new Date(req.timestamp).getTime()
        );
        totalAcceptanceMs += diffMs;
        acceptedCount++;
      }
    }

    const issuedCount = paidLogs.length;
    const scannedCount = scannedLogs.length;

    const errorLogs = [
      ...rejectedPaymentLogs,
      ...doublePaymentLogs,
      ...rejectedTicketLogs,
    ];
    const paymentAndQrErrorsCount = errorLogs.length;

    let hoursSpan = 1;
    if (errorLogs.length >= 2) {
      const timestamps = errorLogs.map((l) => new Date(l.timestamp).getTime());
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      hoursSpan = Math.max(1, (maxTs - minTs) / (1000 * 60 * 60));
    }
    const paymentAndQrErrorsPerHour =
      paymentAndQrErrorsCount > 0 ? paymentAndQrErrorsCount / hoursSpan : 0;

    // 6 & 7: Aura draft-to-paid conversion & Concierge mean approval time
    const auraDrafts = getOddLogs('aura.draft_created');
    const conciergePaid = getOddLogs('concierge.request_paid');
    const auraDraftConversionRate =
      auraDrafts.length > 0 ? conciergePaid.length / auraDrafts.length : 0;

    const reqReceived = getOddLogs('concierge.request_received');
    const reqApproved = getOddLogs('concierge.request_approved');
    let totalApprovalMs = 0;
    let approvalCount = 0;
    for (const app of reqApproved) {
      const appReqId = app.payload?.requestId || app.entityId;
      const rec = reqReceived.find(
        (r) => (r.payload?.requestId || r.entityId) === appReqId
      );
      if (rec) {
        const diffMs = Math.max(
          0,
          new Date(app.timestamp).getTime() - new Date(rec.timestamp).getTime()
        );
        totalApprovalMs += diffMs;
        approvalCount++;
      }
    }

    return {
      paidBookingsTotal: paidLogs.length,
      paidBookingsByCategory,
      paidBookingsByDayAndVertical,
      insufficientBalanceRejections: rejectedPaymentLogs.length,
      averageTaxiAcceptanceSeconds:
        acceptedCount > 0 ? totalAcceptanceMs / 1000 / acceptedCount : 0,
      ticketsScannedVsIssued: {
        issued: issuedCount,
        scanned: scannedCount,
        ratio: issuedCount > 0 ? scannedCount / issuedCount : 0,
      },
      paymentAndQrErrorsCount,
      paymentAndQrErrorsPerHour,
      auraDraftConversionRate,
      averageConciergeApprovalSeconds:
        approvalCount > 0 ? totalApprovalMs / 1000 / approvalCount : 0,
    };
  }

  // Evaluación de las 6 alertas obligatorias de ODD (spec §13)
  evaluateAlerts(): OddAlertsSummary {
    const paymentLogs = getOddLogs('wallet.payment');
    const withdrawalRejectedLogs = getOddLogs('wallet.withdrawal_rejected');
    const paymentRejectedLogs = getOddLogs('wallet.payment_rejected');
    const fbDownLogs = getOddLogs('auth.facebook_login_down');
    const loginFailedLogs = getOddLogs('auth.login_failed');
    const conciergeHallucinationLogs = getOddLogs('concierge.hallucination_blocked');
    const auraHallucinationLogs = getOddLogs('aura.hallucination_blocked');
    const driverPoolLogs = getOddLogs('driver.pool_deducted');

    const paymentChargedWithoutBooking = paymentLogs.some(
      (log) =>
        !log.payload?.bookingId &&
        !log.payload?.orderId &&
        !log.payload?.tripId &&
        !log.entityId
    );

    const withdrawalExceedsBalance =
      withdrawalRejectedLogs.some((log) => log.payload?.reason === 'exceeds_balance') ||
      paymentRejectedLogs.some((log) => log.payload?.reason === 'exceeds_balance');

    const facebookLoginDown =
      fbDownLogs.length > 0 ||
      loginFailedLogs.some(
        (log) =>
          log.payload?.provider === 'facebook' ||
          log.payload?.reason === 'facebook_login_down'
      );

    const auraOrConciergeHallucination =
      conciergeHallucinationLogs.length > 0 || auraHallucinationLogs.length > 0;

    const driverPoolBelowMinimum = driverPoolLogs.some(
      (log) =>
        typeof log.payload?.balanceAfterMxn === 'number' &&
        log.payload.balanceAfterMxn < -30
    );

    const listingsSnapshot = mockStore.getRawCollectionSnapshot('listings');
    const listingPublishedWithoutAvailability = listingsSnapshot.some(
      ({ data }) =>
        data?.status === 'publicado' &&
        (!Array.isArray(data?.pricedDates) || data.pricedDates.length === 0)
    );

    return {
      paymentChargedWithoutBooking,
      withdrawalExceedsBalance,
      facebookLoginDown,
      conciergeInventingService: auraOrConciergeHallucination,
      auraOrConciergeHallucination,
      driverPoolBelowMinimum,
      listingPublishedWithoutAvailability,
    };
  }

  // Auditoría de reglas de seguridad y gatekeeper humano (spec §7, §8, §12, §13)
  auditSecurityAndPrivacy(
    users: Array<User | UserAccount>,
    allies: Ally[] = []
  ): SecurityAuditReport {
    const usersCompliant = users.every((u) => {
      if (!u.bank) return true;
      const bankAny = u.bank as unknown as Record<string, unknown>;
      return (
        bankAny.clabeFull === undefined &&
        (u.bank.clabeLast4 === '' || u.bank.clabeLast4.length === 4)
      );
    });

    const alliesCompliant = allies.every((a) => {
      const payoutAny = (a.payout_config || {}) as unknown as Record<string, unknown>;
      return (
        payoutAny.spei_clabe === undefined &&
        payoutAny.spei_clabe_full === undefined
      );
    });

    const fbInstance = getFirebaseInstance();
    const noHardcodedProductionSecrets = fbInstance.isMock === true;

    return {
      clabePrivacyCompliant: usersCompliant && alliesCompliant,
      noHardcodedProductionSecrets,
      humanGatekeeper: 'Pedro',
      gatedDomains: ['pagos', 'auth', 'datos_personales'] as const,
    };
  }

  // Configuración de distribución del piloto cerrado (spec §2, §12)
  getReleaseDistributionConfig(): ReleaseDistributionConfig {
    return {
      branch: 'release/piloto',
      iosTrack: 'TestFlight (Piloto Cerrado)',
      androidTrack: 'Google Play Internal Testing',
      publicStorePublicationAllowed: false,
      targetLaunchSeason: 'Diciembre 2026',
    };
  }

  // Verificación de datos reales del piloto cerrado (spec §8, §14 Q2)
  verifyPilotCatalogReadiness(): PilotCatalogReadiness {
    const activeServices = this.deps.catalog.getAllActiveServices();
    const rulos = this.deps.catalog.getProviderByName("Mariscos Rulo's");
    const oneByPro = this.deps.catalog.getProviderByName('One By Pro');

    const confirmedPilotProviders: string[] = [];
    if (rulos && rulos.activo) confirmedPilotProviders.push(rulos.nombre);
    if (oneByPro && oneByPro.activo)
      confirmedPilotProviders.push(oneByPro.nombre);

    // Prohibido incluir precios/servicios ficticios de los mockups en producción (ej. Baby'O VIP $14,500, spec §8)
    const containsMockupFictionalData = activeServices.some(
      (s) =>
        s.título.toLowerCase().includes("baby'o") || s.precioMXN === 14500
    );

    return {
      readyForClosedPilot:
        confirmedPilotProviders.length >= 2 && !containsMockupFictionalData,
      confirmedPilotProviders,
      containsMockupFictionalData,
    };
  }
}
