export type PrimaryRole =
  | 'turista'
  | 'alimentos_bebidas'
  | 'transportacion'
  | 'alojamiento'
  | 'xperience';

export type SubRole = 'staff_club';

export type AdminRole = 'admin_hype';

export type LegacyRole =
  | 'restaurante'
  | 'playa'
  | 'club'
  | 'hotel'
  | 'taxista';

export type UserRole = PrimaryRole | SubRole | AdminRole | LegacyRole;

export interface UserBankInfo {
  clabeLast4: string;
  titular: string;
  clabeFull?: never; // Full CLABE must never be stored (spec.md §7)
}

export interface UserSocialLinks {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: UserRole;
  tema: 'oscuro' | 'claro';
  bank: UserBankInfo;
  socialLinks?: UserSocialLinks;
}

// --- Borrador v3 / Documento Maestro v2.0 Single-Account Types ---

export type AccountRole = 'explorer' | 'ally' | 'guide' | 'staff';

export type AccountMode = 'viajero' | 'aliado' | 'concierge';

export type AccountStatus = 'active' | 'suspended';

export interface UserWalletInfo {
  balance_mxn: number;
  currency: 'MXN';
  is_closed_loop: true;
  updated_at: string;
}

export interface UserAccount {
  uid: string;
  display_name: string;
  email: string;
  phone: string;
  terms_accepted: boolean;
  account_status: AccountStatus;
  roles: AccountRole[];
  mode: AccountMode;
  concierge_access: boolean;
  allergies: string[];
  theme: 'dark' | 'light';
  wallet: UserWalletInfo;
  bank?: UserBankInfo;
  socialLinks?: UserSocialLinks;
  assigned_tour_ids?: string[];
  staff_ally_id?: string;
  is_vip?: boolean;
  created_at?: string;
  custom_note?: string;
}
