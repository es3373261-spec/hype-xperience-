import { User } from '../types/user';
import {
  ThemeMode,
  ThemePalette,
  ProfileHeaderPositionConfig,
  FloatingProfileCardState,
} from '../types/profile';
import { emitOddLog } from '../observability/oddLogger';
import { getFirebaseInstance } from '../firebase/config';

export const THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  oscuro: {
    mode: 'oscuro',
    background: '#000000', // Super AMOLED (spec §6, design-system.md §2)
    cardBackground: '#080808',
    elevatedSurface: '#0a0a0a',
    textPrimary: '#ffffff',
    textSecondary: '#a9b1d6',
    accentGold: '#d4af37',
    blueMaleta: '#46578f',
    fontFamily: 'Montserrat',
  },
  claro: {
    mode: 'claro',
    background: '#f5f2ea',
    cardBackground: '#ffffff',
    elevatedSurface: '#ffffff',
    textPrimary: '#1a1b26',
    textSecondary: '#565f89',
    accentGold: '#d4af37',
    blueMaleta: '#46578f',
    coralSombrilla: '#ff8a5c',
    fontFamily: 'Montserrat',
  },
};

export class FloatingProfileService {
  private userStore: Map<string, User> = new Map();
  private cardState: FloatingProfileCardState | null = null;

  getHeaderPositionConfig(): ProfileHeaderPositionConfig {
    return {
      position: 'top-right',
      showsAvatar: true,
      showsRole: true,
      opensFloatingCard: true,
    };
  }

  getThemePalette(mode: ThemeMode): ThemePalette {
    return THEME_PALETTES[mode] || THEME_PALETTES.oscuro;
  }

  openProfileCard(user: User): FloatingProfileCardState {
    this.userStore.set(user.id, user);
    this.cardState = {
      isOpen: true,
      user: { ...user },
      palette: this.getThemePalette(user.tema),
    };
    return this.cardState;
  }

  closeProfileCard(): void {
    if (this.cardState) {
      this.cardState.isOpen = false;
    }
  }

  getCardState(): FloatingProfileCardState | null {
    return this.cardState;
  }

  // Criterio T11: Cambio de tema en Perfil con persistencia (spec §2, §6, §10 T11)
  async updateUserTheme(user: User, newTheme: ThemeMode): Promise<User> {
    const updatedUser: User = {
      ...user,
      tema: newTheme,
    };

    this.userStore.set(user.id, updatedUser);

    if (this.cardState && this.cardState.user.id === user.id) {
      this.cardState.user = updatedUser;
      this.cardState.palette = this.getThemePalette(newTheme);
    }

    const fb = getFirebaseInstance();
    await fb.firestore.collection('users').doc(user.id).set(updatedUser);

    // ODD Observabilidad (§11)
    emitOddLog('profile.theme_updated', {
      userId: user.id,
      newTheme,
    });

    return updatedUser;
  }

  async getUserProfile(userId: string): Promise<User | null> {
    if (this.userStore.has(userId)) {
      return this.userStore.get(userId) || null;
    }

    const fb = getFirebaseInstance();
    const doc = await fb.firestore.collection('users').doc(userId).get();
    if (doc && doc.data) {
      return doc.data as User;
    }

    return null;
  }
}
