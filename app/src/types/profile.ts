import { User } from './user';

export type ThemeMode = 'oscuro' | 'claro';

export interface ThemePalette {
  mode: ThemeMode;
  background: string;
  cardBackground: string;
  elevatedSurface: string;
  textPrimary: string;
  textSecondary: string;
  accentGold: string;
  blueMaleta: string;
  coralSombrilla?: string;
  fontFamily: string;
}

export interface ProfileHeaderPositionConfig {
  position: 'top-right';
  showsAvatar: boolean;
  showsRole: boolean;
  opensFloatingCard: boolean;
}

export interface FloatingProfileCardState {
  isOpen: boolean;
  user: User;
  palette: ThemePalette;
}
