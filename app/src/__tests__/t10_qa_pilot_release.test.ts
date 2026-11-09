import {
  PilotQAService,
  REQUIRED_ODD_EVENTS,
} from '../release/PilotQAService';
import { AuthService } from '../auth/AuthService';
import { RBAC } from '../auth/rbac';
import { CatalogManager } from '../catalog/CatalogManager';
import { TouristService } from '../tourist/TouristService';
import { WalletService } from '../wallet/WalletService';
import { ClubService } from '../club/ClubService';
import { TaxiService } from '../taxi/TaxiService';
import { FeedCalendarService } from '../calendar/FeedCalendarService';
import { FloatingProfileService } from '../profile/FloatingProfileService';
import { ConciergeAuraService } from '../concierge/ConciergeAuraService';
import { User } from '../types/user';
import { clearGlobalTicketStore } from '../types/booking';
import { initializeFirebase } from '../firebase/config';
import { clearOddLogs, emitOddLog } from '../observability/oddLogger';

describe('T-10: QA, TestFlight / Play Internal, piloto cerrado (spec §2, §7, §8, §10 T01-T12, §11, §12, §14)', () => {
  let authService: AuthService;
  let catalog: CatalogManager;
  let walletService: WalletService;
  let touristService: TouristService;
  let clubService: ClubService;
  let taxiService: TaxiService;
  let calendarService: FeedCalendarService;
  let profileService: FloatingProfileService;
  let conciergeService: ConciergeAuraService;
  let qaService: PilotQAService;

  const touristUser: User = {
    id: 'u-piloto-turista',
    nombre: 'Ana Piloto',
    email: 'ana@turista.com',
    telefono: '+527441110000',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '1234', titular: 'Ana Piloto' },
  };

  const rulosUser: User = {
    id: 'u-piloto-rulos',
    nombre: "Mariscos Rulo's",
    email: 'rulos@acapulco.com',
    telefono: '+527442220000',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '5678', titular: 'Rulo Acapulco' },
  };

  const oneByProUser: User = {
    id: 'u-piloto-onebypro',
    nombre: 'Pedro One By Pro',
    email: 'pedro@onebypro.com',
    telefono: '+527443330000',
    rol: 'xperience',
    tema: 'oscuro',
    bank: { clabeLast4: '9012', titular: 'One By Pro' },
  };

  const staffUser: User = {
    id: 'u-piloto-staff',
    nombre: 'Luis Hostess',
    email: 'staff@ronnie.com',
    telefono: '+527444440000',
    rol: 'staff_club',
    tema: 'oscuro',
    bank: { clabeLast4: '0000', titular: 'Luis Staff' },
  };

  const driverMario: User = {
    id: 'driver-mario-torres',
    nombre: 'Mario Torres',
    email: 'mario@taxiacapulco.com',
    telefono: '+527445550000',
    rol: 'transportacion',
    tema: 'oscuro',
    bank: { clabeLast4: '3456', titular: 'Mario Torres' },
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    clearGlobalTicketStore();

    authService = new AuthService();
    catalog = new CatalogManager();
    catalog.seedPilotProviders({
      rulosUserId: rulosUser.id,
      oneByProUserId: oneByProUser.id,
    });
    walletService = new WalletService();
    touristService = new TouristService(catalog, walletService);
    clubService = new ClubService(catalog, walletService);
    taxiService = new TaxiService(walletService);
    calendarService = new FeedCalendarService(touristService, catalog);
    profileService = new FloatingProfileService();
    conciergeService = new ConciergeAuraService(catalog);
    qaService = new PilotQAService({
      catalog,
      walletService,
      touristService,
      taxiService,
      conciergeService,
    });
  });

  describe('1. Verificación E2E de los 12 Criterios de Aceptación TDD (spec §10 T01-T12)', () => {
    test('ejecuta y certifica el flujo completo T01 a T12 de punta a punta en el piloto cerrado', async () => {
      // T01: Registro por rol Restaurante -> ve su dashboard y no el de turista
      const regRest = await authService.registerWithRole({
        nombre: "Mariscos Rulo's",
        email: 'rulos_e2e@acapulco.com',
        password: 'Password123!',
        telefono: '7442220000',
        rol: 'restaurante',
        bank: { clabeLast4: '5678', titular: 'Rulo Acapulco' },
      });
      expect(RBAC.canAccessView(regRest.user, 'Panel')).toBe(true);
      expect(RBAC.canAccessView(regRest.user, 'Feed')).toBe(false);

      // T02: Categoría Hotel sin proveedor activo no aparece en Feed del turista
      expect(catalog.getActiveCategoriesForTourist()).not.toContain('Hotel');

      // T03: Wallet sin saldo ($0) y reserva -> rechaza con "Saldo insuficiente"
      const eventoService = catalog
        .getAllActiveServices()
        .find((s) => s.categoría === 'Eventos')!; // $350 cover
      const booking1 = touristService.createBooking(
        touristUser,
        eventoService.id,
        '2026-11-14'
      );
      expect(() => {
        touristService.payBookingWithWallet(touristUser, booking1.id);
      }).toThrow('Saldo insuficiente');

      // T04: Wallet con saldo ($2,000) y reserva de $700 (2 covers o servicio de $700) -> saldo $1,300, prestador $630 (90%), Hype $70 (10%)
      await walletService.rechargeWithStripe(touristUser, 2000, 'pm_card_visa');
      const tour700 = catalog.createService(oneByProUser, {
        providerId: eventoService.providerId,
        categoría: 'Eventos',
        título: 'Mesa Doble Ronnie One By Pro',
        precioMXN: 700,
        cupo: 10,
        horario: '22:00',
        fotos: ['marketing/flyer-ronnie-onebypro.png'],
        activo: true,
      });
      const booking700 = touristService.createBooking(
        touristUser,
        tour700.id,
        '2026-11-14'
      );
      const paymentResult = touristService.payBookingWithWallet(
        touristUser,
        booking700.id
      );
      expect(walletService.getBalance(touristUser.id)).toBe(1300);
      expect(walletService.getBalance(oneByProUser.id)).toBe(630);
      expect(walletService.getHypeRevenueBalance()).toBe(70);

      // T05: Doble pago de la misma reserva se rechaza
      expect(() => {
        touristService.payBookingWithWallet(touristUser, booking700.id);
      }).toThrow('Doble pago rechazado');

      // T06: Retiro sin CLABE exige guardarla primero
      const providerNoClabe: User = {
        ...oneByProUser,
        bank: { clabeLast4: '', titular: '' },
      };
      expect(() => {
        walletService.requestWithdrawal(providerNoClabe, 300);
      }).toThrow('CLABE');

      // T07: QR ya escaneado -> segundo escaneo se rechaza
      clubService.assignStaffToClub(
        oneByProUser,
        eventoService.providerId,
        staffUser.id
      );
      const firstScan = clubService.scanTicketAtDoor(
        staffUser,
        eventoService.providerId,
        paymentResult.ticket.ticketCode
      );
      expect(firstScan.valid).toBe(true);
      const secondScan = clubService.scanTicketAtDoor(
        staffUser,
        eventoService.providerId,
        paymentResult.ticket.ticketCode
      );
      expect(secondScan.valid).toBe(false);

      // T08: Staff de club no puede ver pagos ni finanzas
      expect(() => {
        clubService.getClubFinances(staffUser, eventoService.providerId);
      }).toThrow('No autorizado');

      // T09: Concierge dado catálogo sin hotel -> Aura no recomienda hoteles
      const auraHotel = conciergeService.askAura(
        touristUser,
        'Recomiéndame un hotel en Acapulco'
      );
      expect(auraHotel.recommendedServices).toHaveLength(0);
      expect(auraHotel.escalatedToHumanHost).toBe(true);

      // T10: Calendario en Feed muestra reserva dorada (#d4af37) y evento azul (#46578f); fuera de Feed no hay calendario
      const calEntries = calendarService.getCalendarEntries(touristUser, 'Feed');
      expect(
        calEntries.some((e) => e.tipo === 'reserva' && e.colorHex === '#d4af37')
      ).toBe(true);
      expect(
        calEntries.some((e) => e.tipo === 'evento' && e.colorHex === '#46578f')
      ).toBe(true);
      expect(calendarService.isCalendarAvailableInView('Tickets')).toBe(false);

      // T11: Tema cambiado a claro en Perfil persiste al reabrir
      await profileService.updateUserTheme(touristUser, 'claro');
      const reopenedProfile = await profileService.getUserProfile(touristUser.id);
      expect(reopenedProfile?.tema).toBe('claro');

      // T12: Taxi aceptado muestra enlace de seguimiento por WhatsApp
      const trip = taxiService.requestTrip(touristUser, {
        origen: { direccion: 'CICI Acapulco', lat: 16.84911, lng: -99.85405 },
        destino: { direccion: 'Ronnie Acapulco', lat: 16.8582, lng: -99.8631 },
        precioMXN: 200,
      });
      const acceptedTrip = taxiService.acceptTrip(driverMario, trip.id);
      expect(acceptedTrip.whatsappThread).toContain('https://wa.me/');
    });
  });

  describe('2. Observabilidad ODD: Logs, Métricas y Alertas (spec §11)', () => {
    test('registra los 18 eventos obligatorios del spec §11 y calcula las 5 métricas operativas', async () => {
      expect(REQUIRED_ODD_EVENTS).toEqual(
        expect.arrayContaining([
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
        ])
      );

      // Generar actividad real para métricas
      await walletService.rechargeWithStripe(touristUser, 1500, 'pm_card_visa');
      const service = catalog.getAllActiveServices()[0];
      const b1 = touristService.createBooking(touristUser, service.id, '2026-11-14');
      const paid = touristService.payBookingWithWallet(touristUser, b1.id);
      touristService.validateAndScanTicket(paid.ticket.ticketCode);

      // Segundo escaneo rechazado para métrica de error QR
      touristService.validateAndScanTicket(paid.ticket.ticketCode);

      // Viaje de taxi solicitado y aceptado
      const trip = taxiService.requestTrip(touristUser, {
        origen: { direccion: 'CICI', lat: 16.849, lng: -99.854 },
        destino: { direccion: 'Ronnie', lat: 16.858, lng: -99.863 },
        precioMXN: 150,
      });
      taxiService.acceptTrip(driverMario, trip.id);

      const metrics = qaService.computeMetrics();
      expect(metrics.paidBookingsTotal).toBe(1);
      expect(metrics.paidBookingsByCategory[service.categoría]).toBe(1);
      expect(metrics.ticketsScannedVsIssued.issued).toBe(1);
      expect(metrics.ticketsScannedVsIssued.scanned).toBe(1);
      expect(metrics.paymentAndQrErrorsCount).toBeGreaterThanOrEqual(1);
      expect(metrics.averageTaxiAcceptanceSeconds).toBeGreaterThanOrEqual(0);
    });

    test('dispara las 4 alertas críticas de ODD cuando ocurren anomalías (spec §11)', () => {
      // Simular eventos de alerta
      emitOddLog('wallet.payment', {
        userId: touristUser.id,
        monto: 500,
        bookingId: undefined, // Pago cobrado sin reserva ni orden ni viaje
      });
      emitOddLog('wallet.withdrawal_rejected', {
        userId: rulosUser.id,
        reason: 'exceeds_balance',
      });
      emitOddLog('auth.facebook_login_down', {
        provider: 'facebook_business',
        status: 'unreachable',
      });
      emitOddLog('concierge.hallucination_blocked', {
        serviceId: 'serv_fake',
        reason: 'service_not_found_or_inactive',
      });

      const alerts = qaService.evaluateAlerts();
      expect(alerts.paymentChargedWithoutBooking).toBe(true);
      expect(alerts.withdrawalExceedsBalance).toBe(true);
      expect(alerts.facebookLoginDown).toBe(true);
      expect(alerts.conciergeInventingService).toBe(true);
    });
  });

  describe('3. Seguridad, Privacidad de CLABE y Gatekeeper Humano (spec §7, §8, §12)', () => {
    test('audita que ningún usuario almacene la CLABE completa (solo últimos 4) y que Pedro sea el gatekeeper humano', () => {
      const audit = qaService.auditSecurityAndPrivacy([
        touristUser,
        rulosUser,
        oneByProUser,
        staffUser,
        driverMario,
      ]);

      expect(audit.clabePrivacyCompliant).toBe(true);
      expect(audit.noHardcodedProductionSecrets).toBe(true);
      expect(audit.humanGatekeeper).toBe('Pedro');
      expect(audit.gatedDomains).toEqual(['pagos', 'auth', 'datos_personales']);
    });
  });

  describe('4. Configuración de Release Piloto Cerrado: TestFlight y Google Play Internal (spec §2, §8, §12, §14)', () => {
    test('configura distribución exclusiva para TestFlight y Play Internal, bloqueando tiendas públicas y datos falsos de mockups', () => {
      const releaseConfig = qaService.getReleaseDistributionConfig();

      expect(releaseConfig.branch).toBe('release/piloto');
      expect(releaseConfig.iosTrack).toBe('TestFlight (Piloto Cerrado)');
      expect(releaseConfig.androidTrack).toBe('Google Play Internal Testing');
      expect(releaseConfig.publicStorePublicationAllowed).toBe(false);

      // Certificación de catálogo de producción: solo proveedores reales confirmados (Rulo's y One By Pro), sin precios de mockup como Baby'O $14,500
      const readiness = qaService.verifyPilotCatalogReadiness();
      expect(readiness.readyForClosedPilot).toBe(true);
      expect(readiness.confirmedPilotProviders).toContain("Mariscos Rulo's");
      expect(readiness.confirmedPilotProviders).toContain('One By Pro');
      expect(readiness.containsMockupFictionalData).toBe(false);
    });
  });
});
