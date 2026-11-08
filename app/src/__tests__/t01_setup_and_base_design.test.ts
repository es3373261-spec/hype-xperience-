import { themeTokens } from '../theme/tokens';
import { initializeFirebase, getFirebaseInstance } from '../firebase/config';
import { FirebaseMockStore } from '../firebase/mock';
import { resolveDashboard, registerUser, getDashboardPermissions } from '../screens/DashboardRouter';
import { FloatingBottomNavConfig } from '../components/FloatingBottomNav';
import { ProfileHeaderConfig } from '../components/ProfileHeader';
import { UserRole } from '../types/user';

describe('T-01: Base Repository, Firebase Setup, and Base Design for Image 0', () => {
  describe('Image 0 Base Design & Tokens (spec.md §6)', () => {
    it('implements black dark background, gold/amber accent, white text, light gray secondary', () => {
      expect(themeTokens.colors.background.toLowerCase()).toMatch(/^#(000000|0a0a0a|121212)$/);
      expect(themeTokens.colors.accent.toLowerCase()).toMatch(/^#(d4af37|e5b842|f59e0b|d97706)$/);
      expect(themeTokens.colors.textPrimary.toLowerCase()).toBe('#ffffff');
      expect(themeTokens.colors.textSecondary.toLowerCase()).toMatch(/^#(9ca3af|a1a1aa|cccccc)$/);
    });

    it('implements rounded card with hero photo area on top', () => {
      expect(themeTokens.card.borderRadius).toBeGreaterThanOrEqual(12);
      expect(themeTokens.card.hasHeroPhoto).toBe(true);
      expect(themeTokens.card.backgroundColor).toBeDefined();
    });

    it('implements primary button with gold background and dark text', () => {
      expect(themeTokens.primaryButton.backgroundColor.toLowerCase()).toMatch(/^#(d4af37|e5b842|f59e0b|d97706)$/);
      expect(themeTokens.primaryButton.textColor.toLowerCase()).toMatch(/^#(000000|0a0a0a|121212|1a1a1a)$/);
      expect(themeTokens.primaryButton.borderRadius).toBeGreaterThanOrEqual(8);
    });

    it('configures floating bottom nav with exactly 4 buttons and NO Profile button', () => {
      expect(FloatingBottomNavConfig.buttons).toHaveLength(4);
      expect(FloatingBottomNavConfig.buttons).not.toContain('Perfil');
      expect(FloatingBottomNavConfig.buttons).not.toContain('Profile');
      expect(FloatingBottomNavConfig.isFloating).toBe(true);
      expect(FloatingBottomNavConfig.buttons).toEqual(['Feed', 'Explorar', 'Concierge', 'Tickets']);
    });

    it('configures Profile at top right with avatar, role badge, and opens floating card', () => {
      expect(ProfileHeaderConfig.position).toBe('top-right');
      expect(ProfileHeaderConfig.showsAvatar).toBe(true);
      expect(ProfileHeaderConfig.showsRole).toBe(true);
      expect(ProfileHeaderConfig.opensFloatingCard).toBe(true);
    });

    it('restricts calendar exclusively to Feed with weekly default and 1-click monthly toggle', () => {
      expect(themeTokens.calendar.location).toBe('feed-only');
      expect(themeTokens.calendar.defaultView).toBe('weekly');
      expect(themeTokens.calendar.canSwitchToMonthly).toBe(true);
    });
  });

  describe('Firebase Emulator and Mock Setup (spec.md §9, §12)', () => {
    it('initializes Firebase in mock/emulator mode', async () => {
      const fb = initializeFirebase({ useMocks: true });
      expect(fb).toBeDefined();
      expect(fb.isMock).toBe(true);
      expect(fb.auth).toBeDefined();
      expect(fb.firestore).toBeDefined();
    });

    it('supports mock Auth and Firestore operations locally', async () => {
      const fb = getFirebaseInstance();
      const user = await fb.auth.createUser('chef@restaurant.com', 'secret123', {
        nombre: 'Mario Rossi',
        rol: 'restaurante',
      });
      expect(user).toBeDefined();
      expect(user.email).toBe('chef@restaurant.com');
      expect(user.rol).toBe('restaurante');

      await fb.firestore.collection('users').doc(user.id).set({
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        bank: { clabeLast4: '1234', titular: 'Mario Rossi' },
      });

      const doc = await fb.firestore.collection('users').doc(user.id).get();
      expect(doc.exists).toBe(true);
      expect(doc.data().rol).toBe('restaurante');
      expect(doc.data().bank.clabeLast4).toBe('1234');
      // Full CLABE must never be stored (spec.md §7)
      expect(doc.data().bank.clabeFull).toBeUndefined();
    });

    it('exposes correct emulator connection ports matching firebase.json', () => {
      const fb = initializeFirebase({ useMocks: false });
      expect(fb.emulatorPorts.auth).toBe(9099);
      expect(fb.emulatorPorts.firestore).toBe(8080);
      expect(fb.emulatorPorts.functions).toBe(5001);
    });
  });

  describe('Spec §10 T01 Acceptance: Role-Based Registration & Dashboard Resolution', () => {
    it('T01: given registration as Restaurante, dashboard is Restaurant Dashboard and cannot view Tourist Dashboard', async () => {
      const regResult = await registerUser({
        nombre: 'Mario Rossi',
        email: 'restaurante@acapulco.com',
        telefono: '7441234567',
        rol: 'restaurante',
        tema: 'oscuro',
        bank: { clabeLast4: '5678', titular: 'Mario Rossi' },
      });

      expect(regResult.success).toBe(true);
      expect(regResult.user.rol).toBe('restaurante');

      const dashboard = resolveDashboard(regResult.user.rol);
      expect(dashboard).toBe('restaurant_dashboard');
      expect(dashboard).not.toBe('tourist_dashboard');

      const permissions = getDashboardPermissions(regResult.user.rol);
      expect(permissions.canViewRestaurantPanel).toBe(true);
      expect(permissions.canViewTouristFeed).toBe(false);
      expect(permissions.allowedViews).toContain('Panel');
      expect(permissions.allowedViews).toContain('Reservas');
      expect(permissions.allowedViews).toContain('Catálogo / Menú');
      expect(permissions.allowedViews).not.toContain('Explorar');
      expect(permissions.allowedViews).not.toContain('Concierge');
    });

    it('T01: given registration as Turista, dashboard is Tourist Dashboard and cannot view Provider Dashboards', async () => {
      const regResult = await registerUser({
        nombre: 'Ana Lopez',
        email: 'ana@turista.com',
        telefono: '5512345678',
        rol: 'turista',
        tema: 'oscuro',
        bank: { clabeLast4: '9999', titular: 'Ana Lopez' },
      });

      expect(regResult.success).toBe(true);
      expect(regResult.user.rol).toBe('turista');

      const dashboard = resolveDashboard(regResult.user.rol);
      expect(dashboard).toBe('tourist_dashboard');
      expect(dashboard).not.toBe('restaurant_dashboard');

      const permissions = getDashboardPermissions(regResult.user.rol);
      expect(permissions.canViewTouristFeed).toBe(true);
      expect(permissions.canViewRestaurantPanel).toBe(false);
      expect(permissions.allowedViews).toContain('Feed');
      expect(permissions.allowedViews).toContain('Explorar');
      expect(permissions.allowedViews).toContain('Concierge');
      expect(permissions.allowedViews).toContain('Tickets');
      expect(permissions.allowedViews).toContain('Wallet');
    });

    it('resolves all 8 roles defined in spec.md §3 strictly without inventing extra roles', () => {
      const validRoles: UserRole[] = [
        'turista',
        'restaurante',
        'playa',
        'club',
        'staff_club',
        'hotel',
        'taxista',
        'admin_hype',
      ];

      for (const role of validRoles) {
        const dashboard = resolveDashboard(role);
        expect(dashboard).toBeDefined();
        const permissions = getDashboardPermissions(role);
        expect(permissions).toBeDefined();
        expect(permissions.allowedViews.length).toBeGreaterThan(0);
      }
    });
  });
});
