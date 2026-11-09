import { CatalogManager } from '../catalog/CatalogManager';
import { WalletService } from '../wallet/WalletService';
import { User } from '../types/user';
import { ClubDrinkItem, Order, OrderItem, OrderState } from '../types/club';
import { HypeTicket, globalTicketStore } from '../types/booking';
import { emitOddLog } from '../observability/oddLogger';
import { getFirebaseInstance } from '../firebase/config';

export class ClubService {
  private catalog: CatalogManager;
  private walletService: WalletService;
  private menus: Map<string, ClubDrinkItem[]> = new Map();
  private clubStaff: Map<string, Set<string>> = new Map();
  private orders: Map<string, Order> = new Map();
  private clubOrderIds: Map<string, string[]> = new Map();
  private nextId = 1;

  constructor(catalog: CatalogManager, walletService: WalletService) {
    this.catalog = catalog;
    this.walletService = walletService;
  }

  // 1. Carta de bebidas del Club (§2 MVP, §4 F3, §7)
  addDrinkToMenu(user: User, clubId: string, drink: ClubDrinkItem): ClubDrinkItem {
    // T08: Staff de club NO puede editar menú ni carta
    if (user.rol === 'staff_club') {
      throw new Error('No autorizado: el staff no puede ver ni modificar el menú o precios');
    }

    const provider = this.catalog.getProviderById(clubId);
    if (!provider) {
      throw new Error(`Club no encontrado: ${clubId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: solo el dueño del club o Admin puede modificar la carta');
    }

    const currentMenu = this.menus.get(clubId) || [];
    currentMenu.push(drink);
    this.menus.set(clubId, currentMenu);

    const fb = getFirebaseInstance();
    fb.firestore.collection('drinks').doc(drink.id).set(drink);

    return drink;
  }

  getClubMenu(clubId: string): ClubDrinkItem[] {
    return this.menus.get(clubId) || [];
  }

  // 2. Staff de Club & Permisos Limitados (Spec §3, §4 F3, §10 T08)
  assignStaffToClub(user: User, clubId: string, staffUserId: string): void {
    // T08: Staff de club no puede crear staff
    if (user.rol === 'staff_club') {
      throw new Error('No autorizado: el staff no puede crear ni asignar staff');
    }

    const provider = this.catalog.getProviderById(clubId);
    if (!provider) {
      throw new Error(`Club no encontrado: ${clubId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: solo el dueño del club o Admin puede asignar staff');
    }

    const staffSet = this.clubStaff.get(clubId) || new Set();
    staffSet.add(staffUserId);
    this.clubStaff.set(clubId, staffSet);

    const fb = getFirebaseInstance();
    fb.firestore.collection('club_staff').doc(`${clubId}_${staffUserId}`).set({
      clubId,
      staffUserId,
      assignedAt: new Date().toISOString(),
    });
  }

  isStaffAssigned(clubId: string, staffUserId: string): boolean {
    const staffSet = this.clubStaff.get(clubId);
    return staffSet ? staffSet.has(staffUserId) : false;
  }

  // T08: Staff de club NO puede ver finanzas ni pagos
  getClubFinances(user: User, clubId: string): { totalIngresosMXN: number; balance: number } {
    if (user.rol === 'staff_club') {
      throw new Error('No autorizado: el staff no puede ver pagos ni finanzas');
    }

    const provider = this.catalog.getProviderById(clubId);
    if (!provider) {
      throw new Error(`Club no encontrado: ${clubId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: no tienes acceso a las finanzas de este negocio');
    }

    const balance = this.walletService.getBalance(provider.userId);
    return {
      totalIngresosMXN: balance,
      balance,
    };
  }

  // 3. Escáner QR de Tickets en Puerta (Spec §4 F3, §8, §10 T07, §11)
  scanTicketAtDoor(
    staffUser: User,
    clubId: string,
    ticketCodeOrPayload: string
  ): { valid: boolean; message: string; ticket?: any } {
    const cleanCode = ticketCodeOrPayload.replace(/^hype:\/\/ticket\//, '');
    const ticket = globalTicketStore.get(cleanCode);

    if (!ticket) {
      emitOddLog('ticket.rejected', {
        ticketCode: cleanCode,
        motivo: 'no_encontrado',
      });
      return {
        valid: false,
        message: 'Ticket no encontrado',
      };
    }

    // Regla de oro (§8, §10 T07): Un solo uso válido por ticket
    if (ticket.estado === 'usado') {
      emitOddLog('ticket.rejected', {
        ticketCode: cleanCode,
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
    ticket.staffUserId = staffUser.id;

    const fb = getFirebaseInstance();
    fb.firestore.collection('tickets').doc(cleanCode).set(ticket);

    // ODD Observabilidad (§11)
    emitOddLog('ticket.scanned', {
      ticketCode: cleanCode,
      staffUserId: staffUser.id,
      clubId,
      timestamp: ticket.escaneadoAt,
    });

    return {
      valid: true,
      message: 'Acceso autorizado',
      ticket,
    };
  }

  // 4. Pedido en Mesa desde la Carta Precargada (Spec §2 MVP, §4 F3, §7, §11)
  createTableOrder(
    touristUser: User,
    params: {
      bookingId: string;
      clubId: string;
      mesa?: string;
      items: { drinkId: string; cantidad: number }[];
    }
  ): Order {
    if (touristUser.rol !== 'turista') {
      throw new Error('Solo los turistas pueden realizar pedidos en mesa');
    }

    const menu = this.getClubMenu(params.clubId);
    const orderItems: OrderItem[] = [];
    let totalMXN = 0;

    for (const itemReq of params.items) {
      const drink = menu.find((d) => d.id === itemReq.drinkId);
      if (!drink || !drink.disponible) {
        throw new Error(`Bebida no disponible: ${itemReq.drinkId}`);
      }
      const subtotalMXN = drink.precioMXN * itemReq.cantidad;
      totalMXN += subtotalMXN;
      orderItems.push({
        drinkId: drink.id,
        nombre: drink.nombre,
        cantidad: itemReq.cantidad,
        precioUnitarioMXN: drink.precioMXN,
        subtotalMXN,
      });
    }

    // Validación de Wallet prepago (§4 F3, §8)
    const touristBalance = this.walletService.getBalance(touristUser.id);
    if (touristBalance < totalMXN) {
      emitOddLog('wallet.payment_rejected', {
        userId: touristUser.id,
        monto: totalMXN,
        motivo: 'saldo_insuficiente_pedido_mesa',
      });
      throw new Error('Saldo insuficiente — agrega dinero en tu Wallet');
    }

    // Descuento de saldo y reparto 90% club / 10% Hype (§14 Q4)
    const comisionHype = Math.round(totalMXN * 0.1 * 100) / 100;
    const netoClub = Math.round(totalMXN * 0.9 * 100) / 100;

    this.walletService.setBalance(touristUser.id, touristBalance - totalMXN);

    const provider = this.catalog.getProviderById(params.clubId);
    if (provider) {
      const clubOwnerId = provider.userId;
      const currentClubBal = this.walletService.getBalance(clubOwnerId);
      this.walletService.setBalance(clubOwnerId, currentClubBal + netoClub);
    }
    const currentHypeBal = this.walletService.getBalance('admin_hype');
    this.walletService.setBalance('admin_hype', currentHypeBal + comisionHype);

    const orderId = `ord_${Date.now()}_${this.nextId++}`;
    const newOrder: Order = {
      id: orderId,
      bookingId: params.bookingId,
      clubId: params.clubId,
      touristUserId: touristUser.id,
      mesa: params.mesa,
      items: orderItems,
      totalMXN,
      estado: 'pagado',
      fecha: new Date().toISOString(),
    };

    this.orders.set(orderId, newOrder);

    const existingClubOrders = this.clubOrderIds.get(params.clubId) || [];
    existingClubOrders.push(orderId);
    this.clubOrderIds.set(params.clubId, existingClubOrders);

    const fb = getFirebaseInstance();
    fb.firestore.collection('orders').doc(orderId).set(newOrder);

    // ODD Observabilidad (§11)
    emitOddLog('order.created', {
      orderId,
      clubId: params.clubId,
      totalMXN,
      mesa: params.mesa,
    });

    emitOddLog('order.paid', {
      orderId,
      totalMXN,
      netoClub,
      comisionHype,
    });

    return newOrder;
  }

  getClubOrders(user: User, clubId: string): Order[] {
    // T08: Staff no puede ver finanzas ni pagos de las órdenes
    if (user.rol === 'staff_club') {
      throw new Error('No autorizado: el staff no puede ver pagos ni finanzas');
    }

    const provider = this.catalog.getProviderById(clubId);
    if (!provider) {
      throw new Error(`Club no encontrado: ${clubId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: no tienes acceso a las órdenes de este club');
    }

    const orderIds = this.clubOrderIds.get(clubId) || [];
    return orderIds
      .map((id) => this.orders.get(id))
      .filter((o): o is Order => o !== undefined);
  }

  updateOrderStatus(user: User, clubId: string, orderId: string, newStatus: OrderState): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Orden no encontrada: ${orderId}`);
    }

    const provider = this.catalog.getProviderById(clubId);
    if (!provider) {
      throw new Error(`Club no encontrado: ${clubId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: no tienes permisos para actualizar esta orden');
    }

    order.estado = newStatus;
    this.orders.set(orderId, order);

    const fb = getFirebaseInstance();
    fb.firestore.collection('orders').doc(orderId).set(order);

    return order;
  }
}
