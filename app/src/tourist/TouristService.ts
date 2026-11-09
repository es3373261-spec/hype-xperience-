import { CatalogManager } from '../catalog/CatalogManager';
import { WalletService } from '../wallet/WalletService';
import { User } from '../types/user';
import { CatalogCategory, CentroConsumo, Service, Provider } from '../types/catalog';
import { Booking, HypeTicket, CalendarEntry } from '../types/booking';
import { emitOddLog } from '../observability/oddLogger';
import { getFirebaseInstance } from '../firebase/config';

export class TouristService {
  private catalog: CatalogManager;
  private walletService: WalletService;
  private bookings: Map<string, Booking> = new Map();
  private tickets: Map<string, HypeTicket> = new Map();
  private nextId = 1;

  constructor(catalog: CatalogManager, walletService?: WalletService) {
    this.catalog = catalog;
    this.walletService = walletService || new WalletService();
  }

  // 1. Descubrir / Explorar Feed (§4 F1, §5b, §6)
  exploreFeed(filters?: {
    filterTag?: string;
    categoria?: CatalogCategory;
    centroConsumo?: CentroConsumo;
  }): Array<{ service: Service; provider: Provider }> {
    const all = this.catalog.getTouristFeed({
      category: filters?.categoria,
      centro: filters?.centroConsumo,
    });

    if (!filters?.filterTag || filters.filterTag === 'Todo') {
      return all;
    }

    if (filters.filterTag === 'Beach Clubs') {
      return all.filter(
        (item) => item.service.categoría === 'Club' || item.service.categoría === 'Playa'
      );
    }

    if (filters.filterTag === 'Pozolerías') {
      return all.filter(
        (item) =>
          item.service.categoría === 'Restaurantes' ||
          item.service.título.toLowerCase().includes('pozole')
      );
    }

    if (filters.filterTag === 'Taxis') {
      return all.filter((item) => item.service.categoría === 'Taxi');
    }

    return all;
  }

  formatServiceRating(rating: number): string {
    return this.catalog.formatRating(rating);
  }

  getServiceCardDesign() {
    return {
      backgroundColor: '#080808',
      accentColor: '#d4af37',
      borderRadius: 16,
      fontFamily: 'Montserrat',
      textColor: '#ffffff',
      secondaryTextColor: '#a9b1d6',
    };
  }

  // 2. Reservar (§4 F1, §7, §8, §10 T03, T04, T05)
  createBooking(user: User, serviceId: string, fecha: string): Booking {
    if (user.rol !== 'turista') {
      throw new Error('Solo los usuarios con rol turista pueden crear reservas');
    }

    const service = this.catalog.getServiceById(serviceId);
    if (!service || !service.activo) {
      throw new Error('Servicio no encontrado o inactivo');
    }

    const provider = this.catalog.getProviderById(service.providerId);
    if (!provider || !provider.activo) {
      throw new Error('Proveedor no disponible o inactivo');
    }

    const id = `book_${Date.now()}_${this.nextId++}`;
    const newBooking: Booking = {
      id,
      userId: user.id,
      serviceId: service.id,
      fecha,
      estado: 'pendiente',
      monto: service.precioMXN,
    };

    this.bookings.set(id, newBooking);

    const fb = getFirebaseInstance();
    fb.firestore.collection('bookings').doc(id).set(newBooking);

    // ODD Observabilidad (§11)
    emitOddLog('booking.created', {
      bookingId: id,
      userId: user.id,
      serviceId: service.id,
      monto: service.precioMXN,
    });

    return newBooking;
  }

  getBookingById(id: string): Booking | null {
    return this.bookings.get(id) || null;
  }

  setTouristWalletBalance(userId: string, balance: number): void {
    this.walletService.setBalance(userId, balance);
  }

  getTouristWalletBalance(userId: string): number {
    return this.walletService.getBalance(userId);
  }

  payBookingWithWallet(
    user: User,
    bookingId: string
  ): { success: boolean; booking: Booking; ticket: HypeTicket } {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Reserva no encontrada: ${bookingId}`);
    }

    const service = this.catalog.getServiceById(booking.serviceId);
    const provider = service ? this.catalog.getProviderById(service.providerId) : null;
    const providerUserId = provider ? provider.userId : 'provider_default';

    // Procesa el pago con el reparto 90% prestador / 10% Hype y ledger en ambos lados (§4 F2, §8, §14 Q4)
    this.walletService.processBookingPayment(user, providerUserId, booking);

    // Generar código Hype Ticket (§6, design-system.md: ej. HYPE-CEQBU7)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const ticketCode = `HYPE-${rand}`;

    const ticketId = `tkt_${Date.now()}_${this.nextId++}`;
    const newTicket: HypeTicket = {
      id: ticketId,
      ticketCode,
      bookingId: booking.id,
      userId: user.id,
      serviceId: booking.serviceId,
      serviceTitle: service?.título || 'Servicio Turístico',
      providerName: provider?.nombre || 'Prestador Hype',
      fecha: booking.fecha,
      precioMXN: booking.monto,
      qrPayload: `hype://ticket/${ticketCode}`,
      estado: 'valido',
      colorBadge: '#d4af37',
    };

    this.tickets.set(ticketCode, newTicket);

    const walletTxId = `tx_${Date.now()}_${this.nextId++}`;
    const updatedBooking: Booking = {
      ...booking,
      estado: 'pagada',
      ticketCode,
      walletTxId,
    };

    this.bookings.set(booking.id, updatedBooking);

    const fb = getFirebaseInstance();
    fb.firestore.collection('bookings').doc(booking.id).set(updatedBooking);
    fb.firestore.collection('tickets').doc(ticketId).set(newTicket);

    // ODD Observabilidad (§11)
    emitOddLog('booking.paid', {
      bookingId: booking.id,
      ticketCode,
      walletTxId,
      monto: booking.monto,
    });

    return {
      success: true,
      booking: updatedBooking,
      ticket: newTicket,
    };
  }

  // 3. Tickets (§4 F1, §7, §8, §10 T07)
  getTouristTickets(user: User): HypeTicket[] {
    return Array.from(this.tickets.values()).filter((t) => t.userId === user.id);
  }

  validateAndScanTicket(ticketCode: string): {
    valid: boolean;
    message: string;
    ticket?: HypeTicket;
  } {
    const ticket = this.tickets.get(ticketCode);
    if (!ticket) {
      return {
        valid: false,
        message: 'Ticket no encontrado',
      };
    }

    // Regla de oro (§8, §10 T07): Ticket QR — un solo uso válido por entrada
    if (ticket.estado === 'usado') {
      emitOddLog('ticket.rejected', {
        ticketCode,
        motivo: 'ya_usado',
      });
      return {
        valid: false,
        message: 'Acceso rechazado: ticket ya utilizado',
        ticket,
      };
    }

    ticket.estado = 'usado';
    ticket.escaneadoAt = new Date().toISOString();

    emitOddLog('ticket.scanned', {
      ticketCode,
      scannedAt: ticket.escaneadoAt,
    });

    return {
      valid: true,
      message: 'Acceso autorizado',
      ticket,
    };
  }

  // 4. Calendario en Feed (§4 F1 paso 6, §10 T10)
  getTouristCalendarEntries(user: User): CalendarEntry[] {
    const entries: CalendarEntry[] = [];

    // Reservas pagadas del usuario -> Color Dorado (#d4af37)
    for (const b of this.bookings.values()) {
      if (b.userId === user.id && b.estado === 'pagada') {
        const service = this.catalog.getServiceById(b.serviceId);
        entries.push({
          id: `cal_res_${b.id}`,
          tipo: 'reserva',
          título: service?.título || 'Tu Reserva',
          fecha: b.fecha,
          colorHex: '#d4af37',
        });
      }
    }

    // Eventos próximos activos del catálogo -> Color Azul (#46578f)
    const activeServices = this.catalog.getAllActiveServices();
    for (const s of activeServices) {
      if (s.categoría === 'Eventos' || s.centrosIncluidos?.includes('xperience')) {
        entries.push({
          id: `cal_evt_${s.id}`,
          tipo: 'evento',
          título: s.título,
          fecha: s.horario || 'Próximamente',
          colorHex: '#46578f',
        });
      }
    }

    return entries;
  }
}
