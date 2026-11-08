export type UserRole =
  | 'turista'
  | 'restaurante'
  | 'playa'
  | 'club'
  | 'staff_club'
  | 'hotel'
  | 'taxista'
  | 'admin_hype';

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
