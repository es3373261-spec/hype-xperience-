import { TouristService } from '../tourist/TouristService';
import { CatalogManager } from '../catalog/CatalogManager';
import { User } from '../types/user';
import { Booking, HypeTicket } from '../types/booking';
import { getOddLogs, clearOddLogs } from '../observability/oddLogger';
import { initializeFirebase } from '../firebase/config';

describe('T-04: Turista — descubrir, reservar, Tickets (spec §4 F1, §6, §7, §8, §10, §11, §12)', () => {
  let touristService: TouristService;
  let catalog: CatalogManager;

  const touristUser: User = {
    id: 'u-tourist-01',
    nombre: 'Ana Turista',
    email: 'ana@acapulco.com',
    telefono: '7441112233',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '1234', titular: 'Ana Turista' },
  };

  const providerUser: User = {
    id: 'u-rulos',
    nombre: "Raul Rulo's",
    email: 'rulos@acapulco.com',
    telefono: '7449998877',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '9999', titular: 'Raul Rulos' },
  };

  const oneByProUser: User = {
    id: 'u-onebypro',
    nombre: 'Pedro One By Pro',
    email: 'onebypro@hype.com',
    telefono: '7448887766',
    rol: 'xperience',
    tema: 'oscuro',
    bank: { clabeLast4: '8888', titular: 'Pedro Xperience' },
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    catalog = new CatalogManager();
    // Sembrar pilotos reales (§14 Q2): Mariscos Rulo's y One By Pro
    catalog.seedPilotProviders({
      rulosUserId: providerUser.id,
      oneByProUserId: oneByProUser.id,
    });
    touristService = new TouristService(catalog);
  });

  describe('1. Descubrir / Explorar Feed (Spec §4 F1, §5b, §6)', () => {
    it('muestra el Feed activo con filtros Todo, Beach Clubs, Pozolerías y Taxis', () => {
      const allFeed = touristService.exploreFeed({ filterTag: 'Todo' });
      expect(allFeed.length).toBeGreaterThan(0);

      // Todos los servicios en el feed pertenecen a proveedores activos
      for (const item of allFeed) {
        expect(item.service.activo).toBe(true);
        expect(item.provider.activo).toBe(true);
        expect(item.service.precioMXN).toBeGreaterThan(0);
      }
    });

    it('permite ver detalle del servicio con precio en MXN y reseñas en fuegos 🔥', () => {
      const allFeed = touristService.exploreFeed();
      const ceviche = allFeed.find((item) => item.service.título === 'Ceviche de pez vela');
      expect(ceviche).toBeDefined();
      expect(ceviche?.service.precioMXN).toBe(250);

      const reviewFormatted = touristService.formatServiceRating(5);
      expect(reviewFormatted).toBe('🔥🔥🔥🔥🔥');
      expect(reviewFormatted).not.toContain('⭐');
    });

    it('aplica tokens de diseño Hype Night (§6, design-system.md)', () => {
      const cardStyle = touristService.getServiceCardDesign();
      expect(cardStyle.backgroundColor).toBe('#080808');
      expect(cardStyle.accentColor).toBe('#d4af37');
      expect(cardStyle.borderRadius).toBeGreaterThanOrEqual(16);
      expect(cardStyle.fontFamily).toBe('Montserrat');
    });
  });

  describe('2. Flujo de Reserva y Validación con Wallet (Spec §4 F1, §8, §10 T03, T04, T05)', () => {
    it('crea reserva en estado pendiente y emite log ODD booking.created', () => {
      const allFeed = touristService.exploreFeed();
      const serviceId = allFeed[0].service.id;

      const booking = touristService.createBooking(
        touristUser,
        serviceId,
        '2026-11-20T14:00:00Z'
      );

      expect(booking.id).toBeDefined();
      expect(booking.userId).toBe(touristUser.id);
      expect(booking.serviceId).toBe(serviceId);
      expect(booking.estado).toBe('pendiente');

      const logs = getOddLogs('booking.created');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].payload).toMatchObject({
        bookingId: booking.id,
        userId: touristUser.id,
      });
    });

    it('T03: dado turista con $0 y reserva de $250, el pago se rechaza con "Saldo insuficiente"', () => {
      const allFeed = touristService.exploreFeed();
      const service = allFeed.find((s) => s.service.título === 'Ceviche de pez vela')!.service;

      const booking = touristService.createBooking(
        touristUser,
        service.id,
        '2026-11-20T14:00:00Z'
      );

      // Saldo de $0
      touristService.setTouristWalletBalance(touristUser.id, 0);

      expect(() => {
        touristService.payBookingWithWallet(touristUser, booking.id);
      }).toThrow(/Saldo insuficiente — agrega dinero en tu Wallet/i);

      expect(touristService.getBookingById(booking.id)?.estado).toBe('pendiente');
    });

    it('T04: dado turista con $2,000 y reserva de $250, se descuenta de Wallet y reserva queda pagada', () => {
      const allFeed = touristService.exploreFeed();
      const service = allFeed.find((s) => s.service.título === 'Ceviche de pez vela')!.service;

      const booking = touristService.createBooking(
        touristUser,
        service.id,
        '2026-11-20T14:00:00Z'
      );

      touristService.setTouristWalletBalance(touristUser.id, 2000);

      const result = touristService.payBookingWithWallet(touristUser, booking.id);
      expect(result.success).toBe(true);
      expect(result.booking.estado).toBe('pagada');
      expect(touristService.getTouristWalletBalance(touristUser.id)).toBe(1750);

      // Emite log ODD booking.paid
      const paidLogs = getOddLogs('booking.paid');
      expect(paidLogs.length).toBeGreaterThan(0);
      expect(paidLogs[0].payload).toMatchObject({
        bookingId: booking.id,
      });
    });

    it('T05: Doble pago rechazado si la reserva ya está pagada', () => {
      const allFeed = touristService.exploreFeed();
      const service = allFeed[0].service;

      const booking = touristService.createBooking(
        touristUser,
        service.id,
        '2026-11-20T14:00:00Z'
      );

      touristService.setTouristWalletBalance(touristUser.id, 5000);
      touristService.payBookingWithWallet(touristUser, booking.id);

      // Segundo intento de pago
      expect(() => {
        touristService.payBookingWithWallet(touristUser, booking.id);
      }).toThrow(/Doble pago rechazado: la reserva ya fue pagada/i);

      const blockedLogs = getOddLogs('booking.double_payment_blocked');
      expect(blockedLogs.length).toBeGreaterThan(0);
    });

    it('prohíbe a roles no turistas crear reservas como cliente', () => {
      const allFeed = touristService.exploreFeed();
      const serviceId = allFeed[0].service.id;

      expect(() => {
        touristService.createBooking(providerUser, serviceId, '2026-11-20T14:00:00Z');
      }).toThrow(/solo los usuarios con rol turista pueden crear reservas/i);
    });
  });

  describe('3. Hype Tickets con código QR (Spec §4 F1, §6, §7, §8, §10 T07, §11)', () => {
    it('emite Hype Ticket con formato HYPE-XXXXXX y payload QR al pagar', () => {
      const allFeed = touristService.exploreFeed();
      const service = allFeed.find((s) => s.service.título === 'Ceviche de pez vela')!.service;

      const booking = touristService.createBooking(
        touristUser,
        service.id,
        '2026-11-20T14:00:00Z'
      );

      touristService.setTouristWalletBalance(touristUser.id, 1000);
      const { ticket } = touristService.payBookingWithWallet(touristUser, booking.id);

      expect(ticket.ticketCode).toMatch(/^HYPE-[A-Z0-9]{6}$/);
      expect(ticket.qrPayload).toBe(`hype://ticket/${ticket.ticketCode}`);
      expect(ticket.estado).toBe('valido');
      expect(ticket.precioMXN).toBe(250);
      expect(ticket.colorBadge).toBe('#d4af37');

      // Aparece en la lista de tickets del turista
      const userTickets = touristService.getTouristTickets(touristUser);
      expect(userTickets.map((t) => t.ticketCode)).toContain(ticket.ticketCode);
    });

    it('T07: escaneo de ticket QR — un solo uso válido; segundo escaneo se rechaza', () => {
      const allFeed = touristService.exploreFeed();
      const service = allFeed[0].service;

      const booking = touristService.createBooking(
        touristUser,
        service.id,
        '2026-11-20T14:00:00Z'
      );

      touristService.setTouristWalletBalance(touristUser.id, 1000);
      const { ticket } = touristService.payBookingWithWallet(touristUser, booking.id);

      // Primer escaneo en puerta
      const scan1 = touristService.validateAndScanTicket(ticket.ticketCode);
      expect(scan1.valid).toBe(true);
      expect(scan1.message).toMatch(/Acceso autorizado/i);

      const scannedLogs = getOddLogs('ticket.scanned');
      expect(scannedLogs.length).toBeGreaterThan(0);

      // Segundo escaneo (intento de duplicar uso)
      const scan2 = touristService.validateAndScanTicket(ticket.ticketCode);
      expect(scan2.valid).toBe(false);
      expect(scan2.message).toMatch(/rechazado.*ya utilizado/i);

      const rejectedLogs = getOddLogs('ticket.rejected');
      expect(rejectedLogs.length).toBeGreaterThan(0);
    });
  });

  describe('4. Distinción en Calendario de Feed (§4 F1 paso 6, §10 T10)', () => {
    it('T10: en el Feed, las reservas son doradas (#d4af37) y los eventos son azules (#46578f)', () => {
      // 1 reserva de restaurante
      const allFeed = touristService.exploreFeed();
      const rulosService = allFeed.find((s) => s.service.título === 'Ceviche de pez vela')!.service;
      const booking = touristService.createBooking(
        touristUser,
        rulosService.id,
        '2026-11-14T14:00:00Z'
      );
      touristService.setTouristWalletBalance(touristUser.id, 1000);
      touristService.payBookingWithWallet(touristUser, booking.id);

      // Consultar entradas de calendario
      const entries = touristService.getTouristCalendarEntries(touristUser);

      // Reserva pagada -> Dorada
      const bookingEntry = entries.find((e) => e.tipo === 'reserva');
      expect(bookingEntry).toBeDefined();
      expect(bookingEntry?.colorHex.toLowerCase()).toBe('#d4af37');

      // Evento de productora Ronnie Acapulco (One By Pro) -> Azul
      const eventEntry = entries.find((e) => e.tipo === 'evento');
      expect(eventEntry).toBeDefined();
      expect(eventEntry?.colorHex.toLowerCase()).toMatch(/^#(46578f|2e3a5c)$/);
    });
  });
});
