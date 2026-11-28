import { CatalogCategory } from './catalog';

export interface OddMetricsSummary {
  paidBookingsTotal: number;
  paidBookingsByCategory: Partial<Record<CatalogCategory, number>>;
  paidBookingsByDayAndVertical: Record<string, Record<string, number>>;
  insufficientBalanceRejections: number;
  averageTaxiAcceptanceSeconds: number;
  ticketsScannedVsIssued: {
    issued: number;
    scanned: number;
    ratio: number;
  };
  paymentAndQrErrorsCount: number;
  paymentAndQrErrorsPerHour: number;
  auraDraftConversionRate: number;
  averageConciergeApprovalSeconds: number;
}

export interface OddAlertsSummary {
  paymentChargedWithoutBooking: boolean;
  withdrawalExceedsBalance: boolean;
  facebookLoginDown: boolean;
  conciergeInventingService: boolean;
  auraOrConciergeHallucination: boolean;
  driverPoolBelowMinimum: boolean;
  listingPublishedWithoutAvailability: boolean;
}

export interface SecurityAuditReport {
  clabePrivacyCompliant: boolean;
  noHardcodedProductionSecrets: boolean;
  humanGatekeeper: 'Pedro';
  gatedDomains: readonly ['pagos', 'auth', 'datos_personales'];
}

export interface ReleaseDistributionConfig {
  branch: 'release/piloto';
  iosTrack: 'TestFlight (Piloto Cerrado)';
  androidTrack: 'Google Play Internal Testing';
  publicStorePublicationAllowed: false;
  targetLaunchSeason: 'Diciembre 2026';
}

export interface PilotCatalogReadiness {
  readyForClosedPilot: boolean;
  confirmedPilotProviders: string[];
  containsMockupFictionalData: boolean;
}
