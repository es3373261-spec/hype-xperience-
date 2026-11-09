import { UserRole, PrimaryRole, SubRole, AdminRole, User } from '../types/user';

export const SPEC_5_ROLES: PrimaryRole[] = [
  'turista',
  'alimentos_bebidas',
  'transportacion',
  'alojamiento',
  'xperience',
];

export const VALID_ROLES: UserRole[] = [
  'turista',
  'alimentos_bebidas',
  'transportacion',
  'alojamiento',
  'xperience',
  'staff_club',
  'admin_hype',
  'restaurante',
  'playa',
  'club',
  'hotel',
  'taxista',
];

export type RoleAction =
  | 'register'
  | 'browse'
  | 'book'
  | 'pay_wallet'
  | 'request_taxi'
  | 'view_my_bookings'
  | 'view_my_events'
  | 'upload_dishes_drinks_with_photo_price'
  | 'receive_bookings'
  | 'view_reviews_fire'
  | 'receive_trips'
  | 'accept_trips'
  | 'track_trip_whatsapp'
  | 'upload_accommodations'
  | 'create_tours_walks_festivals_events'
  | 'bundle_centers_of_consumption'
  | 'manage_event_producer_onebypro'
  | 'book_tables_and_edit_table_map'
  | 'scan_tickets'
  | 'grant_entry'
  | 'hostess'
  | 'provider_onboarding'
  | 'toggle_categories'
  | 'support_management'
  | 'view_all_dashboards'
  | 'view_payments'
  | 'view_finances'
  | 'view_menu'
  | 'create_staff'
  | 'charge_outside_wallet';

export class RBAC {
  static canonicalizeRole(role: UserRole): PrimaryRole | SubRole | AdminRole {
    switch (role) {
      case 'restaurante':
      case 'club':
        return 'alimentos_bebidas';
      case 'taxista':
        return 'transportacion';
      case 'hotel':
        return 'alojamiento';
      case 'playa':
        return 'xperience';
      default:
        return role;
    }
  }

  static isValidRole(role: string): boolean {
    return VALID_ROLES.includes(role as UserRole);
  }

  static getParentRole(role: UserRole): UserRole | null {
    if (role === 'staff_club') {
      return 'alimentos_bebidas';
    }
    return null;
  }

  static getAllowedViews(role: UserRole): string[] {
    const canonical = this.canonicalizeRole(role);
    switch (canonical) {
      case 'turista':
        return ['Feed', 'Explorar', 'Mapa', 'Concierge', 'Tickets', 'Wallet', 'Calendario'];
      case 'alimentos_bebidas':
        return ['Panel', 'Reservas', 'Catálogo / Menú'];
      case 'transportacion':
        return ['Viajes', 'Mapa', 'Wallet'];
      case 'alojamiento':
        return ['Panel', 'Reservas', 'Habitaciones'];
      case 'xperience':
        return ['Panel', 'Reservas', 'Eventos', 'Catálogo'];
      case 'staff_club':
        return ['Escáner', 'Hostess'];
      case 'admin_hype':
        return [
          'Todos los paneles',
          'Panel',
          'Feed',
          'Viajes',
          'Habitaciones',
          'Escáner',
          'Proveedores',
          'Categorías',
          'Soporte',
          'Explorar',
          'Mapa',
          'Concierge',
          'Tickets',
          'Wallet',
          'Calendario',
          'Reservas',
          'Catálogo / Menú',
          'Catálogo',
          'Eventos',
          'Hostess',
        ];
      default:
        return [];
    }
  }

  static canAccessView(user: User, view: string): boolean {
    if (user.rol === 'admin_hype') {
      return true;
    }
    const allowed = this.getAllowedViews(user.rol);
    return allowed.includes(view);
  }

  static canPerformAction(user: User, action: RoleAction): boolean {
    // Spec §3: No role is ever allowed to charge outside Wallet
    if (action === 'charge_outside_wallet') {
      return false;
    }

    const canonical = this.canonicalizeRole(user.rol);

    // Spec §10 T08: Staff de club NO puede ver pagos, menú ni finanzas, ni crear staff
    if (user.rol === 'staff_club') {
      if (
        action === 'view_payments' ||
        action === 'view_finances' ||
        action === 'view_menu' ||
        action === 'create_staff'
      ) {
        return false;
      }
      if (action === 'scan_tickets' || action === 'grant_entry' || action === 'hostess') {
        return true;
      }
      return false;
    }

    if (user.rol === 'admin_hype') {
      return true;
    }

    switch (canonical) {
      case 'turista':
        return [
          'register',
          'browse',
          'book',
          'pay_wallet',
          'request_taxi',
          'view_my_bookings',
          'view_my_events',
          'track_trip_whatsapp',
        ].includes(action);

      case 'alimentos_bebidas':
        return [
          'upload_dishes_drinks_with_photo_price',
          'receive_bookings',
          'view_reviews_fire',
          'view_payments',
          'view_finances',
          'view_menu',
          'create_staff',
          'scan_tickets',
          'grant_entry',
        ].includes(action);

      case 'transportacion':
        return [
          'receive_trips',
          'accept_trips',
          'track_trip_whatsapp',
          'view_payments',
          'view_finances',
        ].includes(action);

      case 'alojamiento':
        return [
          'upload_accommodations',
          'receive_bookings',
          'view_payments',
          'view_finances',
        ].includes(action);

      case 'xperience':
        return [
          'create_tours_walks_festivals_events',
          'bundle_centers_of_consumption',
          'manage_event_producer_onebypro',
          'book_tables_and_edit_table_map',
          'receive_bookings',
          'view_payments',
          'view_finances',
        ].includes(action);

      default:
        return false;
    }
  }
}
