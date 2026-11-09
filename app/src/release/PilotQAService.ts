import { CatalogManager } from '../catalog/CatalogManager';
import { ConciergeAuraService } from '../concierge/ConciergeAuraService';
import { getOddLogs } from '../observability/oddLogger';
import { TaxiService } from '../taxi/TaxiService';
import { TouristService } from '../tourist/TouristService';
import { CatalogCategory } from '../types/catalog';
import {
  OddAlertsSummary,
  OddMetricsSummary,
  PilotCatalogReadiness,
  ReleaseDistributionConfig,
  SecurityAuditReport,
} from '../types/release';
import { User } from '../types/user';
import { WalletService } from '../wallet/WalletService';
import { getFirebaseInstance } from '../firebase/config';

export const REQUIRED_ODD_EVENTS = [
  'wallet.recharge',
  'wallet.payment',
  'wallet.payment_rejected',
  'wallet.withdrawal',
  'booking.created',
  'booking.paid',
  'booking.double_payment_blocked',
  'ticket.scanned',
  'ticket.rejected',
  'order.created',
  'order.paid',
  'trip.requested',
  'trip.accepted',
  'trip.location_updated',
  'trip.completed',
  'trip.cancelled',
  'profile.theme_updated',
  'concierge.no_service_found',
  'concierge.hallucination_blocked',
  'auth.role_assigned',
  'auth.login_failed',
] as const;

export interface PilotQADependencies {
  catalog: CatalogManager;
  walletService: WalletService;
  touristService: TouristService;
  taxiService: TaxiService;
  conciergeService: ConciergeAuraService;
}

export class PilotQAService {
  private deps: PilotQADependencies;

  constructor(deps: PilotQADependencies) {
    this.deps = deps;
  }

  // Cálculo de las 5 métricas obligatorias de ODD (spec §11)
  computeMetrics(): OddMetricsSummary {
    const paidLogs = getOddLogs('booking.paid');
    const paidBookingsByCategory: Partial<Record<CatalogCategory, number>> = {};

    for (const log of paidLogs) {
      const bookingId = log.payload.bookingId;
      const booking = bookingId
        ? this.deps.touristService.getBookingById(bookingId)
        : null;
      const service = booking
        ? this.deps.catalog.getServiceById(booking.serviceId)
        : null;
      if (service) {
        paidBookingsByCategory[service.categoría] =
          (paidBookingsByCategory[service.categoría] || 0) + 1;
      }
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
      const req = tripRequestedLogs.find(
        (r) => r.payload.tripId === acc.payload.tripId
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

    return {
      paidBookingsTotal: paidLogs.length,
      paidBookingsByCategory,
      insufficientBalanceRejections: rejectedPaymentLogs.length,
      averageTaxiAcceptanceSeconds:
        acceptedCount > 0 ? totalAcceptanceMs / 1000 / acceptedCount : 0,
      ticketsScannedVsIssued: {
        issued: issuedCount,
        scanned: scannedCount,
        ratio: issuedCount > 0 ? scannedCount / issuedCount : 0,
      },
      paymentAndQrErrorsCount:
        rejectedPaymentLogs.length +
        doublePaymentLogs.length +
        rejectedTicketLogs.length,
    };
  }

  // Evaluación de las 4 alertas obligatorias de ODD (spec §11)
  evaluateAlerts(): OddAlertsSummary {
    const paymentLogs = getOddLogs('wallet.payment');
    const withdrawalRejectedLogs = getOddLogs('wallet.withdrawal_rejected');
    const fbDownLogs = getOddLogs('auth.facebook_login_down');
    const hallucinationLogs = getOddLogs('concierge.hallucination_blocked');

    const paymentChargedWithoutBooking = paymentLogs.some(
      (log) =>
        !log.payload.bookingId && !log.payload.orderId && !log.payload.tripId
    );

    const withdrawalExceedsBalance = withdrawalRejectedLogs.some(
      (log) => log.payload.reason === 'exceeds_balance'
    );

    return {
      paymentChargedWithoutBooking,
      withdrawalExceedsBalance,
      facebookLoginDown: fbDownLogs.length > 0,
      conciergeInventingService: hallucinationLogs.length > 0,
    };
  }

  // Auditoría de reglas de seguridad y gatekeeper humano (spec §7, §8, §12)
  auditSecurityAndPrivacy(users: User[]): SecurityAuditReport {
    const clabePrivacyCompliant = users.every((u) => {
      const bankAny = u.bank as unknown as Record<string, unknown>;
      return (
        bankAny.clabeFull === undefined &&
        (u.bank.clabeLast4 === '' || u.bank.clabeLast4.length === 4)
      );
    });

    const fbInstance = getFirebaseInstance();
    const noHardcodedProductionSecrets = fbInstance.isMock === true;

    return {
      clabePrivacyCompliant,
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
