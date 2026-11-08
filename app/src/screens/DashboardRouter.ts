import { UserRole, User } from '../types/user';
import { getFirebaseInstance } from '../firebase/config';

export type DashboardType =
  | 'tourist_dashboard'
  | 'restaurant_dashboard'
  | 'beach_dashboard'
  | 'club_dashboard'
  | 'staff_dashboard'
  | 'hotel_dashboard'
  | 'taxi_dashboard'
  | 'admin_dashboard';

export interface DashboardPermissions {
  canViewTouristFeed: boolean;
  canViewRestaurantPanel: boolean;
  allowedViews: string[];
}

export function resolveDashboard(role: UserRole): DashboardType {
  switch (role) {
    case 'turista':
      return 'tourist_dashboard';
    case 'restaurante':
      return 'restaurant_dashboard';
    case 'playa':
      return 'beach_dashboard';
    case 'club':
      return 'club_dashboard';
    case 'staff_club':
      return 'staff_dashboard';
    case 'hotel':
      return 'hotel_dashboard';
    case 'taxista':
      return 'taxi_dashboard';
    case 'admin_hype':
      return 'admin_dashboard';
    default:
      throw new Error(`Rol desconocido: ${role}`);
  }
}

export function getDashboardPermissions(role: UserRole): DashboardPermissions {
  switch (role) {
    case 'turista':
      return {
        canViewTouristFeed: true,
        canViewRestaurantPanel: false,
        allowedViews: ['Feed', 'Explorar', 'Concierge', 'Tickets', 'Wallet', 'Calendario'],
      };
    case 'restaurante':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: true,
        allowedViews: ['Panel', 'Reservas', 'Catálogo / Menú'],
      };
    case 'playa':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Panel', 'Reservas', 'Catálogo'],
      };
    case 'club':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Panel', 'Reservas', 'Escáner', 'Catálogo / Carta'],
      };
    case 'staff_club':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Escáner', 'Hostess'],
      };
    case 'hotel':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Panel', 'Reservas', 'Habitaciones'],
      };
    case 'taxista':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Viajes', 'Mapa', 'Wallet'],
      };
    case 'admin_hype':
      return {
        canViewTouristFeed: true,
        canViewRestaurantPanel: true,
        allowedViews: ['Panel', 'Proveedores', 'Categorías', 'Soporte', 'Todos los paneles'],
      };
    default:
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: [],
      };
  }
}

export interface RegisterUserData {
  nombre: string;
  email: string;
  telefono: string;
  rol: UserRole;
  tema?: 'oscuro' | 'claro';
  bank: {
    clabeLast4: string;
    titular: string;
  };
}

export async function registerUser(data: RegisterUserData): Promise<{ success: boolean; user: User }> {
  const fb = getFirebaseInstance();

  const authUser = await fb.auth.createUser(data.email, 'temp_password', {
    nombre: data.nombre,
    rol: data.rol,
  });

  const newUser: User = {
    id: authUser.id,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    rol: data.rol,
    tema: data.tema || 'oscuro',
    bank: {
      clabeLast4: data.bank.clabeLast4,
      titular: data.bank.titular,
    },
  };

  await fb.firestore.collection('users').doc(newUser.id).set(newUser);

  return {
    success: true,
    user: newUser,
  };
}
