import { UserRole, User, UserAccount } from '../types/user';
import { getFirebaseInstance } from '../firebase/config';
import { welcomeTokens } from '../theme/tokens';

export type DashboardType =
  | 'tourist_dashboard'
  | 'alimentos_bebidas_dashboard'
  | 'transportacion_dashboard'
  | 'alojamiento_dashboard'
  | 'xperience_dashboard'
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
    case 'alimentos_bebidas':
      return 'alimentos_bebidas_dashboard';
    case 'transportacion':
      return 'transportacion_dashboard';
    case 'alojamiento':
      return 'alojamiento_dashboard';
    case 'xperience':
      return 'xperience_dashboard';
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
    case 'alimentos_bebidas':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: true,
        allowedViews: ['Panel', 'Reservas', 'Catálogo / Menú'],
      };
    case 'transportacion':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Viajes', 'Mapa', 'Wallet'],
      };
    case 'alojamiento':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Panel', 'Reservas', 'Habitaciones'],
      };
    case 'xperience':
      return {
        canViewTouristFeed: false,
        canViewRestaurantPanel: false,
        allowedViews: ['Panel', 'Reservas', 'Eventos', 'Catálogo'],
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

export interface AccountDashboardPermissions {
  mode: UserAccount['mode'];
  welcomeBanner: string;
  canViewFinances: boolean;
  canEditCatalog: boolean;
  canSwitchMode: boolean;
  canViewRegisteredAccounts: boolean;
  allowedViews: string[];
}

export function getAccountDashboardPermissions(
  account: UserAccount
): AccountDashboardPermissions {
  const isGuide = account.roles.includes('guide') && !account.concierge_access;
  const isStaff = account.roles.includes('staff') && !account.concierge_access;

  const canViewRegisteredAccounts = account.concierge_access === true;
  const canSwitchMode = !isGuide && !isStaff;
  const canViewFinances =
    !isGuide && !isStaff && (account.concierge_access || account.mode === 'aliado');
  const canEditCatalog =
    !isGuide && !isStaff && (account.concierge_access || account.mode === 'aliado');

  let allowedViews: string[];
  if (isStaff) {
    allowedViews = ['Escáner QR'];
  } else if (isGuide) {
    allowedViews = ['Mis Tours Asignados'];
  } else if (account.concierge_access && account.mode === 'concierge') {
    allowedViews = ['Concierge', 'Bandeja Aura', 'Inventario', 'Cuentas registradas', 'Resumen'];
  } else if (account.mode === 'aliado') {
    allowedViews = ['Hoy', 'Calendario', 'Anuncios', 'Mensajes', 'Menú'];
  } else {
    allowedViews = ['Feed', 'Explorar', 'Tickets', 'Taxi', 'Wallet'];
  }

  return {
    mode: account.mode,
    welcomeBanner: `${welcomeTokens.greetingPrefix}, ${account.display_name}`,
    canViewFinances,
    canEditCatalog,
    canSwitchMode,
    canViewRegisteredAccounts,
    allowedViews,
  };
}
