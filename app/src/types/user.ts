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
