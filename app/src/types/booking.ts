export type BookingState = 'pendiente' | 'pagada' | 'completada' | 'cancelada';

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  fecha: string;
  estado: BookingState;
  monto: number;
  ticketCode?: string;
  walletTxId?: string;
}

export type TicketState = 'valido' | 'usado' | 'cancelado';

export interface HypeTicket {
  id: string;
  ticketCode: string; // ej. HYPE-CEQBU7
  bookingId: string;
  userId: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  fecha: string;
  precioMXN: number;
  qrPayload: string; // hype://ticket/HYPE-CEQBU7
  estado: TicketState;
  colorBadge: string; // '#d4af37' dorado
  escaneadoAt?: string;
}

export interface CalendarEntry {
  id: string;
  tipo: 'reserva' | 'evento';
  título: string;
  fecha: string;
  colorHex: string; // '#d4af37' dorado para reservas, '#46578f' azul para eventos (spec §4 F1, §10 T10)
}
