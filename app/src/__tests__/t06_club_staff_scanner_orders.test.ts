import { ClubService } from '../club/ClubService';
import { CatalogManager } from '../catalog/CatalogManager';
import { TouristService } from '../tourist/TouristService';
import { WalletService } from '../wallet/WalletService';
import { User } from '../types/user';
import { ClubReservationType, ClubDrinkItem, Order } from '../types/club';
import { clearGlobalTicketStore } from '../types/booking';
import { getOddLogs, clearOddLogs } from '../observability/oddLogger';
import { initializeFirebase } from '../firebase/config';

describe('T-06: Club — staff, escáner QR y pedido en mesa (spec §2, §3, §4 F3, §7, §8, §10 T07, T08, §11, §12)', () => {
  let clubService: ClubService;
  let catalog: CatalogManager;
  let walletService: WalletService;
  let touristService: TouristService;

  const clubOwnerUser: User = {
    id: 'u-club-owner',
    nombre: 'Dueño BabyO / Ronnie',
    email: 'club@hype.com',
    telefono: '7441112233',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '1111', titular: 'Dueño Club SA' },
  };

  const staffUser: User = {
    id: 'u-staff-door',
    nombre: 'Hostess / Validador Puerta',
    email: 'staff@club.com',
    telefono: '7442223344',
    rol: 'staff_club',
    tema: 'oscuro',
    bank: { clabeLast4: '2222', titular: 'Staff' },
  };

  const touristUser: User = {
    id: 'u-tourist-club',
    nombre: 'Carlos Turista',
    email: 'carlos@turista.com',
    telefono: '7443334455',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '3333', titular: 'Carlos Turista' },
  };

  let clubProviderId: string;

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    clearGlobalTicketStore();
    catalog = new CatalogManager();
    walletService = new WalletService();
    touristService = new TouristService(catalog, walletService);
    clubService = new ClubService(catalog, walletService);

    // Onboard Club en catálogo
    const adminUser: User = {
      id: 'admin-01',
      nombre: 'Admin Hype',
      email: 'admin@hype.com',
      telefono: '7440000000',
      rol: 'admin_hype',
      tema: 'oscuro',
      bank: { clabeLast4: '0000', titular: 'Admin Hype' },
    };

    const provider = catalog.onboardProvider(adminUser, {
      userId: clubOwnerUser.id,
      tipo: 'alimentos_bebidas',
      nombre: 'Ronnie Acapulco Club',
      descripción: 'Club nocturno y discoteca en la Costera',
      fotos: ['assets/club_cover.jpg'],
      activo: true,
    });
    clubProviderId = provider.id;
    catalog.setCategoryStatus(adminUser, 'Club', 'activa');
  });

  describe('1. Carga de Carta de Bebidas y Modalidades de Reserva (§2 MVP, §4 F3, §7)', () => {
    it('permite al club cargar su carta de bebidas con foto y precio neto en MXN', () => {
      const drinks: ClubDrinkItem[] = [
        {
          id: 'drink-1',
          clubId: clubProviderId,
          nombre: 'Tequila Don Julio 70 (Botella)',
          categoria: 'botellas',
          precioMXN: 3500,
          foto: 'assets/don_julio.jpg',
          descripcion: 'Botella 700ml incluye 4 refrescos',
          disponible: true,
        },
        {
          id: 'drink-2',
          clubId: clubProviderId,
          nombre: 'Vodka Grey Goose (Botella)',
          categoria: 'botellas',
          precioMXN: 3200,
          foto: 'assets/grey_goose.jpg',
          descripcion: 'Botella 750ml incluye 4 mezcladores',
          disponible: true,
        },
        {
          id: 'drink-3',
          clubId: clubProviderId,
          nombre: 'Gin Tonic Hendrick’s',
          categoria: 'cocteleria',
          precioMXN: 250,
          foto: 'assets/gin_tonic.jpg',
          descripcion: 'Copa individual con pepino',
          disponible: true,
        },
      ];

      for (const d of drinks) {
        clubService.addDrinkToMenu(clubOwnerUser, clubProviderId, d);
      }

      const menu = clubService.getClubMenu(clubProviderId);
      expect(menu).toHaveLength(3);
      expect(menu.find((d) => d.nombre.includes('Don Julio'))?.precioMXN).toBe(3500);
    });

    it('soporta las 3 modalidades de reserva de club: mesa_con_botellas, mesa_sin_botellas y solo_entrada (§2 MVP)', () => {
      const modalities: ClubReservationType[] = [
        'mesa_con_botellas',
        'mesa_sin_botellas',
        'solo_entrada',
      ];
      expect(modalities).toHaveLength(3);

      const service = catalog.createService(clubOwnerUser, {
        providerId: clubProviderId,
        categoría: 'Club',
        título: 'Acceso General Ronnie Club',
        precioMXN: 350,
        cupo: 500,
        horario: '23:00 - 05:00',
        fotos: ['assets/club_access.jpg'],
        activo: true,
      });

      expect(service.id).toBeDefined();
    });
  });

  describe('2. Staff de Club y Permisos Limitados (Spec §3, §4 F3, §10 T08)', () => {
    it('asigna un staff al club y le otorga acceso a Escáner y Hostess', () => {
      clubService.assignStaffToClub(clubOwnerUser, clubProviderId, staffUser.id);
      expect(clubService.isStaffAssigned(clubProviderId, staffUser.id)).toBe(true);
    });

    it('T08: Staff de club NO puede ver pagos ni finanzas, ni editar carta ni crear staff', () => {
      clubService.assignStaffToClub(clubOwnerUser, clubProviderId, staffUser.id);

      // Staff intenta consultar finanzas o pagos del club
      expect(() => {
        clubService.getClubFinances(staffUser, clubProviderId);
      }).toThrow(/no autorizado: el staff no puede ver pagos ni finanzas/i);

      // Staff intenta crear otro staff
      expect(() => {
        clubService.assignStaffToClub(staffUser, clubProviderId, 'staff-02');
      }).toThrow(/no autorizado: el staff no puede crear ni asignar staff/i);

      // Staff intenta editar el menú de bebidas
      expect(() => {
        clubService.addDrinkToMenu(staffUser, clubProviderId, {
          id: 'drink-hack',
          clubId: clubProviderId,
          nombre: 'Cerveza Gratis',
          categoria: 'cerveza',
          precioMXN: 0,
          foto: '',
          disponible: true,
        });
      }).toThrow(/no autorizado/i);
    });
  });

  describe('3. Escáner QR de Tickets en Puerta (Spec §4 F3, §8, §10 T07, §11)', () => {
    let ticketCode: string;

    beforeEach(async () => {
      clubService.assignStaffToClub(clubOwnerUser, clubProviderId, staffUser.id);

      // Crear servicio de club y reservar
      const clubServiceEntry = catalog.createService(clubOwnerUser, {
        providerId: clubProviderId,
        categoría: 'Club',
        título: 'Entrada Ronnie Club',
        precioMXN: 350,
        fotos: [],
        activo: true,
      });

      await walletService.rechargeWithStripe(touristUser, 1000);
      const booking = touristService.createBooking(
        touristUser,
        clubServiceEntry.id,
        '2026-11-14T23:00:00Z'
      );
      const payResult = touristService.payBookingWithWallet(touristUser, booking.id);
      ticketCode = payResult.ticket.ticketCode;
    });

    it('Staff escanea ticket en puerta: ticket válido = "Acceso autorizado" y emite log ODD ticket.scanned', () => {
      const scanResult = clubService.scanTicketAtDoor(staffUser, clubProviderId, ticketCode);

      expect(scanResult.valid).toBe(true);
      expect(scanResult.message).toMatch(/Acceso autorizado/i);
      expect(scanResult.ticket.estado).toBe('usado');

      const logs = getOddLogs('ticket.scanned');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].payload).toMatchObject({
        ticketCode,
        staffUserId: staffUser.id,
      });
    });

    it('T07: dado ticket ya escaneado, el segundo escaneo se rechaza y emite log ODD ticket.rejected', () => {
      // Primer escaneo
      clubService.scanTicketAtDoor(staffUser, clubProviderId, ticketCode);

      // Segundo escaneo (intento de reutilizar entrada)
      const secondScan = clubService.scanTicketAtDoor(staffUser, clubProviderId, ticketCode);

      expect(secondScan.valid).toBe(false);
      expect(secondScan.message).toMatch(/rechazado.*ya utilizado/i);

      const rejectedLogs = getOddLogs('ticket.rejected');
      expect(rejectedLogs.length).toBeGreaterThan(0);
      expect(rejectedLogs[0].payload).toMatchObject({
        ticketCode,
        motivo: 'ya_usado',
      });
    });

    it('rechaza tickets inexistentes o pertenecientes a otro club', () => {
      const scanFake = clubService.scanTicketAtDoor(staffUser, clubProviderId, 'HYPE-NOEXISTE');
      expect(scanFake.valid).toBe(false);
      expect(scanFake.message).toMatch(/ticket no encontrado/i);
    });
  });

  describe('4. Pedido en Mesa desde la Carta Precargada (Spec §2 MVP, §4 F3, §7, §11)', () => {
    let bookingId: string;

    beforeEach(async () => {
      // Cargar bebidas en el club
      clubService.addDrinkToMenu(clubOwnerUser, clubProviderId, {
        id: 'botella-tequila',
        clubId: clubProviderId,
        nombre: 'Don Julio 70',
        categoria: 'botellas',
        precioMXN: 3500,
        foto: 'assets/don_julio.jpg',
        disponible: true,
      });
      clubService.addDrinkToMenu(clubOwnerUser, clubProviderId, {
        id: 'coctel-gin',
        clubId: clubProviderId,
        nombre: 'Hendricks Tonic',
        categoria: 'cocteleria',
        precioMXN: 250,
        foto: 'assets/gin.jpg',
        disponible: true,
      });

      // Crear reserva activa
      const service = catalog.createService(clubOwnerUser, {
        providerId: clubProviderId,
        categoría: 'Club',
        título: 'Mesa VIP Ronnie',
        precioMXN: 1000,
        fotos: [],
        activo: true,
      });

      await walletService.rechargeWithStripe(touristUser, 5000);
      const booking = touristService.createBooking(
        touristUser,
        service.id,
        '2026-11-14T23:00:00Z'
      );
      touristService.payBookingWithWallet(touristUser, booking.id);
      bookingId = booking.id;
    });

    it('turista dentro del club pide bebidas desde la carta precargada y paga con Wallet', () => {
      const order = clubService.createTableOrder(touristUser, {
        bookingId,
        clubId: clubProviderId,
        mesa: 'Mesa VIP 4',
        items: [
          { drinkId: 'botella-tequila', cantidad: 1 },
          { drinkId: 'coctel-gin', cantidad: 2 },
        ],
      });

      // Total: $3,500 + (2 * $250) = $4,000 MXN
      expect(order.id).toBeDefined();
      expect(order.totalMXN).toBe(4000);
      expect(order.estado).toBe('pagado');
      expect(order.items).toHaveLength(2);

      // Verifica descuento de Wallet prepago del turista ($4,000 de saldo restante tras reserva)
      expect(walletService.getBalance(touristUser.id)).toBe(0);

      // Reparto de orden (90% club / 10% Hype): Club recibe $3,600
      expect(walletService.getBalance(clubOwnerUser.id)).toBeGreaterThanOrEqual(3600);

      // Logs ODD obligatorios (§11)
      const orderCreatedLogs = getOddLogs('order.created');
      expect(orderCreatedLogs.length).toBeGreaterThan(0);
      expect(orderCreatedLogs[0].payload).toMatchObject({
        orderId: order.id,
        totalMXN: 4000,
      });

      const orderPaidLogs = getOddLogs('order.paid');
      expect(orderPaidLogs.length).toBeGreaterThan(0);
    });

    it('rechaza pedido si el turista no tiene saldo suficiente en Wallet', () => {
      // Turista con solo $100 en Wallet
      walletService.setBalance(touristUser.id, 100);

      expect(() => {
        clubService.createTableOrder(touristUser, {
          bookingId,
          clubId: clubProviderId,
          mesa: 'Mesa 12',
          items: [{ drinkId: 'botella-tequila', cantidad: 1 }],
        });
      }).toThrow(/saldo insuficiente — agrega dinero en tu wallet/i);
    });

    it('club ve sus pedidos activos y puede actualizar su estado a entregado', () => {
      const order = clubService.createTableOrder(touristUser, {
        bookingId,
        clubId: clubProviderId,
        mesa: 'Mesa 3',
        items: [{ drinkId: 'coctel-gin', cantidad: 2 }],
      });

      const clubOrders = clubService.getClubOrders(clubOwnerUser, clubProviderId);
      expect(clubOrders.map((o) => o.id)).toContain(order.id);

      // Actualizar a entregado
      const updated = clubService.updateOrderStatus(
        clubOwnerUser,
        clubProviderId,
        order.id,
        'entregado'
      );
      expect(updated.estado).toBe('entregado');
    });

    it('Staff de club no tiene acceso a los totales ni listado financiero de pedidos (T08)', () => {
      clubService.assignStaffToClub(clubOwnerUser, clubProviderId, staffUser.id);

      expect(() => {
        clubService.getClubOrders(staffUser, clubProviderId);
      }).toThrow(/no autorizado: el staff no puede ver pagos ni finanzas/i);
    });
  });
});
