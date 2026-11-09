import { AuthService } from '../auth/AuthService';
import { RBAC, SPEC_5_ROLES, RoleAction } from '../auth/rbac';
import { UserRole, PrimaryRole, User } from '../types/user';
import { getFirebaseInstance, initializeFirebase } from '../firebase/config';
import { getOddLogs, clearOddLogs } from '../observability/oddLogger';

describe('T-02: Auth por rol + RBAC (Spec.md §3, §6, §7, §10, §11)', () => {
  let authService: AuthService;

  beforeEach(() => {
    initializeFirebase({ useMock: true });
    clearOddLogs();
    authService = new AuthService();
  });

  describe('Spec §3: Definición exacta de los 5 roles y taxonomía', () => {
    it('incluye exactamente los 5 roles principales de centros de consumo y turista', () => {
      const expected5Roles: PrimaryRole[] = [
        'turista',
        'alimentos_bebidas',
        'transportacion',
        'alojamiento',
        'xperience',
      ];
      expect(SPEC_5_ROLES).toHaveLength(5);
      expect(SPEC_5_ROLES).toEqual(expect.arrayContaining(expected5Roles));
    });

    it('agrupa los roles anteriores en los 5 centros de consumo según spec §3', () => {
      expect(RBAC.canonicalizeRole('restaurante')).toBe('alimentos_bebidas');
      expect(RBAC.canonicalizeRole('club')).toBe('alimentos_bebidas');
      expect(RBAC.canonicalizeRole('taxista')).toBe('transportacion');
      expect(RBAC.canonicalizeRole('hotel')).toBe('alojamiento');
      expect(RBAC.canonicalizeRole('playa')).toBe('xperience');
    });

    it('soporta el sub-rol staff_club subordinado a Alimentos y bebidas y admin_hype', () => {
      expect(RBAC.isValidRole('staff_club')).toBe(true);
      expect(RBAC.isValidRole('admin_hype')).toBe(true);
      expect(RBAC.getParentRole('staff_club')).toBe('alimentos_bebidas');
    });
  });

  describe('Autenticación y Registro por Rol (Spec §3, §6, §7, §11)', () => {
    it('registra un usuario con uno de los 5 roles y emite log ODD auth.role_assigned', async () => {
      const result = await authService.registerWithRole({
        nombre: 'Pedro Turista',
        email: 'turista@acapulco.com',
        password: 'password123',
        telefono: '7441234567',
        rol: 'turista',
        bank: {
          clabeLast4: '1234',
          titular: 'Pedro Turista',
        },
      });

      expect(result.success).toBe(true);
      expect(result.user.rol).toBe('turista');
      expect(result.user.id).toBeDefined();

      const logs = getOddLogs('auth.role_assigned');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].payload).toMatchObject({
        userId: result.user.id,
        rol: 'turista',
      });
    });

    it('rechaza registro con un rol inventado fuera del spec', async () => {
      await expect(
        authService.registerWithRole({
          nombre: 'Hacker',
          email: 'hacker@test.com',
          password: 'password123',
          telefono: '7440000000',
          rol: 'rol_inventado' as unknown as UserRole,
          bank: { clabeLast4: '0000', titular: 'Hacker' },
        })
      ).rejects.toThrow(/Rol no válido/i);
    });

    it('registra login fallido y emite evento ODD auth.login_failed', async () => {
      await expect(
        authService.login('inexistente@hype.com', 'clave_incorrecta')
      ).rejects.toThrow();

      const failLogs = getOddLogs('auth.login_failed');
      expect(failLogs.length).toBeGreaterThan(0);
      expect(failLogs[0].payload).toMatchObject({
        email: 'inexistente@hype.com',
      });
    });

    it('garantiza que la CLABE completa jamás se almacene en datos de usuario (Spec §7)', async () => {
      const regData: any = {
        nombre: 'Mario Torres',
        email: 'mario@taxiacapulco.com',
        password: 'password123',
        telefono: '7449876543',
        rol: 'transportacion',
        bank: {
          clabeFull: '012180001234567890',
          clabeLast4: '7890',
          titular: 'Mario Torres',
        },
      };

      const result = await authService.registerWithRole(regData);
      expect(result.user.bank).not.toHaveProperty('clabeFull');
      expect(result.user.bank.clabeLast4).toBe('7890');

      const storedUser = await authService.getUserById(result.user.id);
      expect(storedUser?.bank).not.toHaveProperty('clabeFull');
      expect(storedUser?.bank.clabeLast4).toBe('7890');
    });
  });

  describe('RBAC: Vistas permitidas por rol (Spec §3)', () => {
    it('Turista: tiene acceso exclusivo a vistas de turista y no a paneles de prestadores', () => {
      const turistaUser: User = {
        id: 'u-turista',
        nombre: 'Turista 1',
        email: 'turista1@test.com',
        telefono: '7441112233',
        rol: 'turista',
        tema: 'oscuro',
        bank: { clabeLast4: '1111', titular: 'Turista 1' },
      };

      expect(RBAC.getAllowedViews(turistaUser.rol)).toEqual(
        expect.arrayContaining(['Feed', 'Explorar', 'Mapa', 'Concierge', 'Tickets', 'Wallet', 'Calendario'])
      );
      expect(RBAC.canAccessView(turistaUser, 'Feed')).toBe(true);
      expect(RBAC.canAccessView(turistaUser, 'Explorar')).toBe(true);
      expect(RBAC.canAccessView(turistaUser, 'Mapa')).toBe(true);
      expect(RBAC.canAccessView(turistaUser, 'Panel')).toBe(false);
      expect(RBAC.canAccessView(turistaUser, 'Escáner')).toBe(false);
    });

    it('Alimentos y bebidas: ve Panel, Reservas, Catálogo / Menú; NO ve Feed de turista', () => {
      const fbUser: User = {
        id: 'u-rulos',
        nombre: "Mariscos Rulo's",
        email: 'rulos@acapulco.com',
        telefono: '7442223344',
        rol: 'alimentos_bebidas',
        tema: 'oscuro',
        bank: { clabeLast4: '2222', titular: 'Raul Rulos' },
      };

      expect(RBAC.getAllowedViews(fbUser.rol)).toEqual(
        expect.arrayContaining(['Panel', 'Reservas', 'Catálogo / Menú'])
      );
      expect(RBAC.canAccessView(fbUser, 'Panel')).toBe(true);
      expect(RBAC.canAccessView(fbUser, 'Catálogo / Menú')).toBe(true);
      expect(RBAC.canAccessView(fbUser, 'Feed')).toBe(false);
      expect(RBAC.canAccessView(fbUser, 'Viajes')).toBe(false);
    });

    it('Transportación: ve Viajes, Mapa, Wallet; NO ve viajes de otros ni paneles ajenos', () => {
      const taxiUser: User = {
        id: 'u-taxi',
        nombre: 'Mario Taxista',
        email: 'mario@taxi.com',
        telefono: '7443334455',
        rol: 'transportacion',
        tema: 'oscuro',
        bank: { clabeLast4: '3333', titular: 'Mario Torres' },
      };

      expect(RBAC.getAllowedViews(taxiUser.rol)).toEqual(
        expect.arrayContaining(['Viajes', 'Mapa', 'Wallet'])
      );
      expect(RBAC.canAccessView(taxiUser, 'Viajes')).toBe(true);
      expect(RBAC.canAccessView(taxiUser, 'Feed')).toBe(false);
      expect(RBAC.canAccessView(taxiUser, 'Habitaciones')).toBe(false);
    });

    it('Alojamiento: ve Panel, Reservas, Habitaciones', () => {
      const hotelUser: User = {
        id: 'u-hotel',
        nombre: 'Hotel Emporio',
        email: 'emporio@hotel.com',
        telefono: '7444445566',
        rol: 'alojamiento',
        tema: 'oscuro',
        bank: { clabeLast4: '4444', titular: 'Hotel Emporio SA' },
      };

      expect(RBAC.getAllowedViews(hotelUser.rol)).toEqual(
        expect.arrayContaining(['Panel', 'Reservas', 'Habitaciones'])
      );
      expect(RBAC.canAccessView(hotelUser, 'Habitaciones')).toBe(true);
      expect(RBAC.canAccessView(hotelUser, 'Viajes')).toBe(false);
    });

    it('Xperience: ve Panel, Reservas, Eventos, Catálogo', () => {
      const xpUser: User = {
        id: 'u-onebypro',
        nombre: 'One By Pro',
        email: 'onebypro@hype.com',
        telefono: '7445556677',
        rol: 'xperience',
        tema: 'oscuro',
        bank: { clabeLast4: '5555', titular: 'Pedro Xperience' },
      };

      expect(RBAC.getAllowedViews(xpUser.rol)).toEqual(
        expect.arrayContaining(['Panel', 'Reservas', 'Eventos', 'Catálogo'])
      );
      expect(RBAC.canAccessView(xpUser, 'Eventos')).toBe(true);
      expect(RBAC.canAccessView(xpUser, 'Viajes')).toBe(false);
    });

    it('Staff de club: solo ve Escáner y Hostess; NO ve pagos ni menú ni finanzas (Spec §10 T08)', () => {
      const staffUser: User = {
        id: 'u-staff',
        nombre: 'Hostess Ronnie',
        email: 'staff@ronnie.com',
        telefono: '7446667788',
        rol: 'staff_club',
        tema: 'oscuro',
        bank: { clabeLast4: '6666', titular: 'Staff Club' },
      };

      expect(RBAC.getAllowedViews(staffUser.rol)).toEqual(['Escáner', 'Hostess']);
      expect(RBAC.canAccessView(staffUser, 'Escáner')).toBe(true);
      expect(RBAC.canAccessView(staffUser, 'Hostess')).toBe(true);
      expect(RBAC.canAccessView(staffUser, 'Panel')).toBe(false);
      expect(RBAC.canAccessView(staffUser, 'Wallet')).toBe(false);
      expect(RBAC.canAccessView(staffUser, 'Catálogo / Menú')).toBe(false);
    });

    it('Admin Hype: ve todos los paneles', () => {
      const adminUser: User = {
        id: 'u-admin',
        nombre: 'Admin Hype',
        email: 'admin@hype.com',
        telefono: '7447778899',
        rol: 'admin_hype',
        tema: 'oscuro',
        bank: { clabeLast4: '7777', titular: 'Admin Hype' },
      };

      expect(RBAC.canAccessView(adminUser, 'Panel')).toBe(true);
      expect(RBAC.canAccessView(adminUser, 'Feed')).toBe(true);
      expect(RBAC.canAccessView(adminUser, 'Viajes')).toBe(true);
      expect(RBAC.canAccessView(adminUser, 'Habitaciones')).toBe(true);
      expect(RBAC.canAccessView(adminUser, 'Escáner')).toBe(true);
      expect(RBAC.canAccessView(adminUser, 'Todos los paneles')).toBe(true);
    });
  });

  describe('RBAC: Acciones y Reglas de Seguridad (Spec §3, §10)', () => {
    it('T08: Staff de club NO puede ver pagos, menú ni finanzas, ni crear staff', () => {
      const staffUser: User = {
        id: 'u-staff',
        nombre: 'Staff',
        email: 'staff@test.com',
        telefono: '7441110000',
        rol: 'staff_club',
        tema: 'oscuro',
        bank: { clabeLast4: '0000', titular: 'Staff' },
      };

      expect(RBAC.canPerformAction(staffUser, 'scan_tickets')).toBe(true);
      expect(RBAC.canPerformAction(staffUser, 'grant_entry')).toBe(true);
      expect(RBAC.canPerformAction(staffUser, 'view_payments')).toBe(false);
      expect(RBAC.canPerformAction(staffUser, 'view_finances')).toBe(false);
      expect(RBAC.canPerformAction(staffUser, 'view_menu')).toBe(false);
      expect(RBAC.canPerformAction(staffUser, 'create_staff')).toBe(false);
    });

    it('Prestadores y Admin no pueden cobrar fuera de Wallet (Spec §3)', () => {
      const rolesToTest: UserRole[] = [
        'turista',
        'alimentos_bebidas',
        'transportacion',
        'alojamiento',
        'xperience',
        'admin_hype',
      ];

      for (const r of rolesToTest) {
        const u: User = {
          id: `u-${r}`,
          nombre: `User ${r}`,
          email: `${r}@hype.com`,
          telefono: '7440001111',
          rol: r,
          tema: 'oscuro',
          bank: { clabeLast4: '9999', titular: 'Test' },
        };
        expect(RBAC.canPerformAction(u, 'charge_outside_wallet')).toBe(false);
      }
    });

    it('Xperience puede armar paquetes combinando centros de consumo y mapa de mesas (Spec §3)', () => {
      const xpUser: User = {
        id: 'u-pedro',
        nombre: 'Pedro Provider',
        email: 'pedro@hype.com',
        telefono: '7449998877',
        rol: 'xperience',
        tema: 'oscuro',
        bank: { clabeLast4: '8888', titular: 'Pedro' },
      };

      expect(RBAC.canPerformAction(xpUser, 'bundle_centers_of_consumption')).toBe(true);
      expect(RBAC.canPerformAction(xpUser, 'book_tables_and_edit_table_map')).toBe(true);
      expect(RBAC.canPerformAction(xpUser, 'create_tours_walks_festivals_events')).toBe(true);
    });

    it('Transportación puede recibir viajes y seguimiento por WhatsApp (Spec §3)', () => {
      const taxiUser: User = {
        id: 'u-taxista',
        nombre: 'Mario Bocho',
        email: 'taxista@hype.com',
        telefono: '7445551212',
        rol: 'transportacion',
        tema: 'oscuro',
        bank: { clabeLast4: '1212', titular: 'Mario' },
      };

      expect(RBAC.canPerformAction(taxiUser, 'receive_trips')).toBe(true);
      expect(RBAC.canPerformAction(taxiUser, 'accept_trips')).toBe(true);
      expect(RBAC.canPerformAction(taxiUser, 'track_trip_whatsapp')).toBe(true);
    });
  });

  describe('Regla de un solo rol principal (Spec §3)', () => {
    it('un usuario tiene rol inmutable en sesión normal y el cambio de rol exige verificación/re-registro', () => {
      const user: User = {
        id: 'u-1',
        nombre: 'Carlos',
        email: 'carlos@test.com',
        telefono: '7440001122',
        rol: 'turista',
        tema: 'oscuro',
        bank: { clabeLast4: '1234', titular: 'Carlos' },
      };

      expect(() => {
        authService.switchRoleInProduction(user, 'alimentos_bebidas');
      }).toThrow(/El cambio de rol en producción requiere verificación por rol/i);
    });
  });
});
