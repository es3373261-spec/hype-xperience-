import { AuthService } from '../auth/AuthService';
import { RBAC } from '../auth/rbac';
import { getAccountDashboardPermissions } from '../screens/DashboardRouter';
import { initializeFirebase, resetFirebaseInstance } from '../firebase/config';
import { mockStore } from '../firebase/mock';
import { clearOddLogs, getOddLogs } from '../observability/oddLogger';

describe('M1 — Auth, Single-Account Modes, Hidden Concierge, Guide & Staff RBAC (T01, T02, T15, T34, T39, T42)', () => {
  let authService: AuthService;

  beforeEach(() => {
    resetFirebaseInstance();
    mockStore.reset();
    clearOddLogs();
    initializeFirebase({ mode: 'mock' });
    authService = new AuthService();
  });

  describe('T42 & T01: Minimalist Registration & Mandatory Terms Gate', () => {
    it('blocks registration when terms_accepted is false', async () => {
      await expect(
        authService.registerMinimalAccount({
          display_name: 'Sofía',
          email: 'sofia@ejemplo.com',
          phone: '7441112233',
          terms_accepted: false,
        })
      ).rejects.toThrow(/términos|terms/i);
    });

    it('creates an immediately active Explorer account without email verification when terms_accepted is true, ignoring injected concierge_access', async () => {
      const result = await authService.registerMinimalAccount({
        display_name: 'Sofía',
        email: 'sofia@ejemplo.com',
        phone: '7441112233',
        terms_accepted: true,
        concierge_access: true, // adversarial injection attempt
      } as any);

      expect(result.success).toBe(true);
      expect(result.user.display_name).toBe('Sofía');
      expect(result.user.email).toBe('sofia@ejemplo.com');
      expect(result.user.phone).toBe('7441112233');
      expect(result.user.terms_accepted).toBe(true);
      expect(result.user.account_status).toBe('active');
      expect(result.user.mode).toBe('viajero');
      expect(result.user.roles).toEqual(['explorer']);
      expect(result.user.concierge_access).toBe(false);
    });

    it('rejects duplicate email registration', async () => {
      await authService.registerMinimalAccount({
        display_name: 'Sofía',
        email: 'sofia@ejemplo.com',
        phone: '7441112233',
        terms_accepted: true,
      });

      await expect(
        authService.registerMinimalAccount({
          display_name: 'Sofía 2',
          email: 'sofia@ejemplo.com',
          phone: '7449998877',
          terms_accepted: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('T01: Single-Account Explorer <-> Ally Mode Toggle & 900ms Splash', () => {
    it('switches single account between viajero and aliado, emits account.mode_switched, and returns 900ms black/red suitcase splash', async () => {
      const { user } = await authService.registerMinimalAccount({
        display_name: 'Carlos',
        email: 'carlos@ejemplo.com',
        phone: '7442223344',
        terms_accepted: true,
      });

      const toAlly = await authService.switchMode(user.uid, 'aliado');
      expect(toAlly.user.uid).toBe(user.uid);
      expect(toAlly.user.mode).toBe('aliado');
      expect(toAlly.splash.durationMs).toBe(900);
      expect(toAlly.splash.backgroundColor.toUpperCase()).toBe('#000000');
      expect(toAlly.splash.suitcaseColor.toUpperCase()).toBe('#E62E3D');
      expect(toAlly.splash.showProgressBar).toBe(false);
      expect(toAlly.splash.showText).toBe(false);

      const toViajero = await authService.switchMode(user.uid, 'viajero');
      expect(toViajero.user.uid).toBe(user.uid);
      expect(toViajero.user.mode).toBe('viajero');
      expect(toViajero.splash.durationMs).toBe(900);

      const modeLogs = getOddLogs('account.mode_switched');
      expect(modeLogs.length).toBe(2);
    });
  });

  describe('T02: Hidden Concierge Mode & Admin Bootstrap (es3373261@gmail.com & pedro@hypexperience.demo)', () => {
    it('rejects non-permitted users from enterConciergeMode and switchMode(uid, concierge) with clear error', async () => {
      const { user } = await authService.registerMinimalAccount({
        display_name: 'Turista Común',
        email: 'turista@ejemplo.com',
        phone: '7443334455',
        terms_accepted: true,
      });

      await expect(authService.enterConciergeMode(user.uid)).rejects.toThrow(
        /concierge|autorizad|permiso/i
      );
      await expect(authService.switchMode(user.uid, 'concierge' as any)).rejects.toThrow(
        /concierge|autorizad|permiso/i
      );
    });

    it('bootstraps Concierge admin accounts only for es3373261@gmail.com and pedro@hypexperience.demo and allows Concierge entry', async () => {
      await expect(
        authService.bootstrapAdminAccount({
          email: 'hacker@ejemplo.com',
          display_name: 'Intruso',
          phone: '7440000000',
        })
      ).rejects.toThrow(/autorizad|admin|whitelist/i);

      const oneX = await authService.bootstrapAdminAccount({
        email: 'es3373261@gmail.com',
        display_name: 'One Xperience',
        phone: '7440000001',
      });
      expect(oneX.user.concierge_access).toBe(true);

      const pedro = await authService.bootstrapAdminAccount({
        email: 'pedro@hypexperience.demo',
        display_name: 'Pedro Legacy',
        phone: '7440000002',
      });
      expect(pedro.user.concierge_access).toBe(true);

      const entryOneX = await authService.enterConciergeMode(oneX.user.uid);
      expect(entryOneX.authorized).toBe(true);
      expect(entryOneX.mode).toBe('concierge');

      const entryPedro = await authService.enterConciergeMode(pedro.user.uid);
      expect(entryPedro.authorized).toBe(true);
    });
  });

  describe('T15: Guide & Staff Roles Isolation', () => {
    it('allows only Concierge to create Guide and assign tours; Guide sees only assigned_tour_ids, no finances, cannot switch mode', async () => {
      const { user: concierge } = await authService.bootstrapAdminAccount({
        email: 'es3373261@gmail.com',
        display_name: 'One Xperience',
      });
      const { user: explorer } = await authService.registerMinimalAccount({
        display_name: 'Ana',
        email: 'ana@ejemplo.com',
        phone: '7444445566',
        terms_accepted: true,
      });

      // Explorer cannot create a Guide
      await expect(
        authService.createGuideAccount(explorer.uid, {
          display_name: 'Guía No Autorizado',
          email: 'guia_bad@ejemplo.com',
          phone: '7440001111',
        })
      ).rejects.toThrow();

      // Concierge creates Guide
      const { user: guide } = await authService.createGuideAccount(concierge.uid, {
        display_name: 'Luis Guía',
        email: 'luis.guia@ejemplo.com',
        phone: '7445556677',
        assigned_tour_ids: ['tour_1'],
      });

      expect(guide.roles).toContain('guide');
      expect(guide.concierge_access).toBe(false);

      // Concierge assigns tour_2; non-Concierge cannot assign
      await expect(
        authService.assignGuideToTour(explorer.uid, guide.uid, 'tour_2')
      ).rejects.toThrow();

      const updatedGuide = await authService.assignGuideToTour(concierge.uid, guide.uid, 'tour_2');
      expect(updatedGuide.assigned_tour_ids).toEqual(['tour_1', 'tour_2']);
      expect(getOddLogs('guide.assigned').length).toBe(1);

      const allTours = [
        { id: 'tour_1', title: 'Bahía Sunset', priceMxn: 1500 },
        { id: 'tour_2', title: 'Isla La Roqueta', priceMxn: 900 },
        { id: 'tour_3', title: 'Yate Privado VIP', priceMxn: 8000 },
      ];
      const visibleTours = RBAC.filterGuideTours(updatedGuide, allTours);
      expect(visibleTours.map((t: any) => t.id)).toEqual(['tour_1', 'tour_2']);

      // Guide cannot view finances or switch mode
      const perms = getAccountDashboardPermissions(updatedGuide);
      expect(perms.canViewFinances).toBe(false);
      expect(perms.canSwitchMode).toBe(false);
      await expect(authService.switchMode(guide.uid, 'aliado')).rejects.toThrow();
    });

    it('allows only Ally owner or Concierge to create Staff, scopes QR scanning to own ally, and blocks finances/editing/mode-switch', async () => {
      const { user: concierge } = await authService.bootstrapAdminAccount({
        email: 'es3373261@gmail.com',
        display_name: 'One Xperience',
      });
      const { user: ownerA } = await authService.registerMinimalAccount({
        display_name: 'Dueño Rulo',
        email: 'rulo@ejemplo.com',
        phone: '7441110001',
        terms_accepted: true,
      });
      const { user: ownerB } = await authService.registerMinimalAccount({
        display_name: 'Dueño Otro',
        email: 'otro@ejemplo.com',
        phone: '7441110002',
        terms_accepted: true,
      });

      await mockStore.firestore.collection('allies').doc('ally_rulos').set({
        allyId: 'ally_rulos',
        owner_uid: ownerA.uid,
        status: 'active',
      });

      // Wrong owner rejected
      await expect(
        authService.createStaffAccount(ownerB.uid, {
          allyId: 'ally_rulos',
          display_name: 'Intruso Staff',
          email: 'staff_bad@ejemplo.com',
          phone: '7440009999',
        })
      ).rejects.toThrow();

      // Ally owner creates Staff
      const { user: staff } = await authService.createStaffAccount(ownerA.uid, {
        allyId: 'ally_rulos',
        display_name: 'Puerta Rulo',
        email: 'puerta.rulo@ejemplo.com',
        phone: '7441110003',
      });

      expect(staff.roles).toContain('staff');
      expect(staff.staff_ally_id).toBe('ally_rulos');
      expect(staff.concierge_access).toBe(false);
      expect(getOddLogs('staff.created').length).toBe(1);

      // Staff cannot create another Staff account
      await expect(
        authService.createStaffAccount(staff.uid, {
          allyId: 'ally_rulos',
          display_name: 'Sub Staff',
          email: 'substaff@ejemplo.com',
          phone: '7441110004',
        })
      ).rejects.toThrow();

      // Concierge can also create Staff for an ally
      const { user: staffByConcierge } = await authService.createStaffAccount(concierge.uid, {
        allyId: 'ally_rulos',
        display_name: 'Muelle Rulo',
        email: 'muelle.rulo@ejemplo.com',
        phone: '7441110005',
      });
      expect(staffByConcierge.staff_ally_id).toBe('ally_rulos');

      // QR scan scoping
      expect(RBAC.canScanTicketForAlly(staff, 'ally_rulos')).toBe(true);
      expect(RBAC.canScanTicketForAlly(staff, 'ally_onebypro')).toBe(false);

      // No finances, no editing, no mode-switch
      const perms = getAccountDashboardPermissions(staff);
      expect(perms.canViewFinances).toBe(false);
      expect(perms.canEditCatalog).toBe(false);
      expect(perms.canSwitchMode).toBe(false);
      await expect(authService.switchMode(staff.uid, 'viajero')).rejects.toThrow();
    });
  });

  describe('T39 & T34: "Cuentas registradas" Concierge-Only Guard & Welcome Banner', () => {
    it('allows listRegisteredAccounts and "Cuentas registradas" ONLY for concierge_access === true', async () => {
      const { user: concierge } = await authService.bootstrapAdminAccount({
        email: 'es3373261@gmail.com',
        display_name: 'One Xperience',
      });
      const { user: explorer } = await authService.registerMinimalAccount({
        display_name: 'Sofía',
        email: 'sofia@ejemplo.com',
        phone: '7441112233',
        terms_accepted: true,
      });
      const { user: ally } = await authService.switchMode(explorer.uid, 'aliado');
      const { user: guide } = await authService.createGuideAccount(concierge.uid, {
        display_name: 'Guía',
        email: 'guia@ejemplo.com',
        phone: '7442223344',
      });
      await mockStore.firestore.collection('allies').doc('ally_test').set({
        allyId: 'ally_test',
        owner_uid: ally.uid,
        status: 'active',
      });
      const { user: staff } = await authService.createStaffAccount(concierge.uid, {
        allyId: 'ally_test',
        display_name: 'Staff',
        email: 'staff@ejemplo.com',
        phone: '7443334455',
      });

      const explorerPerms = getAccountDashboardPermissions({ ...explorer, mode: 'viajero' });
      const allyPerms = getAccountDashboardPermissions(ally);
      const guidePerms = getAccountDashboardPermissions(guide);
      const staffPerms = getAccountDashboardPermissions(staff);
      const conciergePerms = getAccountDashboardPermissions(concierge);

      expect(RBAC.canViewRegisteredAccounts({ ...explorer, mode: 'viajero' })).toBe(false);
      expect(RBAC.canViewRegisteredAccounts(ally)).toBe(false);
      expect(RBAC.canViewRegisteredAccounts(guide)).toBe(false);
      expect(RBAC.canViewRegisteredAccounts(staff)).toBe(false);
      expect(RBAC.canViewRegisteredAccounts(concierge)).toBe(true);

      expect(explorerPerms.canViewRegisteredAccounts).toBe(false);
      expect(allyPerms.canViewRegisteredAccounts).toBe(false);
      expect(guidePerms.canViewRegisteredAccounts).toBe(false);
      expect(staffPerms.canViewRegisteredAccounts).toBe(false);
      expect(conciergePerms.canViewRegisteredAccounts).toBe(true);

      await expect(authService.listRegisteredAccounts(explorer.uid)).rejects.toThrow();
      await expect(authService.listRegisteredAccounts(guide.uid)).rejects.toThrow();
      await expect(authService.listRegisteredAccounts(staff.uid)).rejects.toThrow();

      const accounts = await authService.listRegisteredAccounts(concierge.uid);
      expect(accounts.length).toBeGreaterThanOrEqual(4);
    });

    it('formats welcome banner as "Bienvenido a la Saga del Sol, <name>" and never includes "MODO TURISTA"', async () => {
      const { user } = await authService.registerMinimalAccount({
        display_name: 'Sofía',
        email: 'sofia@ejemplo.com',
        phone: '7441112233',
        terms_accepted: true,
      });

      const perms = getAccountDashboardPermissions(user);
      expect(perms.welcomeBanner).toBe('Bienvenido a la Saga del Sol, Sofía');
      expect(perms.welcomeBanner.toUpperCase()).not.toContain('MODO TURISTA');
      expect(JSON.stringify(perms).toUpperCase()).not.toContain('MODO TURISTA');
    });
  });
});
