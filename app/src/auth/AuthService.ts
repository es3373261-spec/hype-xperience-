import {
  User,
  UserRole,
  UserBankInfo,
  UserSocialLinks,
  UserAccount,
  AccountMode,
} from '../types/user';
import { getFirebaseInstance } from '../firebase/config';
import { RBAC } from './rbac';
import { emitOddLog } from '../observability/oddLogger';
import { splashTokens } from '../theme/tokens';

export const CONCIERGE_ADMIN_WHITELIST = [
  'es3373261@gmail.com',
  'pedro@hypexperience.demo',
] as const;

export interface RegisterWithRoleParams {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  rol: UserRole;
  tema?: 'oscuro' | 'claro';
  bank: {
    clabeLast4: string;
    titular: string;
    clabeFull?: string;
  };
  socialLinks?: UserSocialLinks;
}

export interface MinimalRegisterParams {
  display_name: string;
  email: string;
  phone: string;
  terms_accepted: boolean;
}

export interface BootstrapAdminParams {
  email: string;
  display_name: string;
  phone?: string;
}

export interface CreateGuideParams {
  display_name: string;
  email: string;
  phone: string;
  assigned_tour_ids?: string[];
}

export interface CreateStaffParams {
  allyId: string;
  display_name: string;
  email: string;
  phone: string;
}

export interface ModeSwitchSplash {
  durationMs: number;
  backgroundColor: string;
  suitcaseColor: string;
  showProgressBar: boolean;
  showText: boolean;
}

export class AuthService {
  async registerWithRole(params: RegisterWithRoleParams): Promise<{ success: boolean; user: User }> {
    if (!RBAC.isValidRole(params.rol)) {
      throw new Error(`Rol no válido: ${params.rol}`);
    }

    const fb = getFirebaseInstance();

    const authUser = await fb.auth.createUser(params.email, params.password, {
      nombre: params.nombre,
      rol: params.rol,
    });

    // Sanitización estricta: la CLABE completa jamás se almacena (Spec §7)
    const sanitizedBank: UserBankInfo = {
      clabeLast4: params.bank.clabeLast4,
      titular: params.bank.titular,
    };

    const newUser: User = {
      id: authUser.id,
      nombre: params.nombre,
      email: params.email,
      telefono: params.telefono,
      rol: params.rol,
      tema: params.tema || 'oscuro',
      bank: sanitizedBank,
      socialLinks: params.socialLinks,
    };

    await fb.firestore.collection('users').doc(newUser.id).set(newUser);

    // ODD Observabilidad: emitir log obligatorio auth.role_assigned (Spec §11)
    emitOddLog('auth.role_assigned', {
      userId: newUser.id,
      rol: newUser.rol,
    });

    return {
      success: true,
      user: newUser,
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; user: User }> {
    const fb = getFirebaseInstance();

    try {
      const authUser = await fb.auth.signIn(email, password);
      const docSnap = await fb.firestore.collection('users').doc(authUser.id).get();
      const userData = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;

      if (!userData) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      return {
        success: true,
        user: userData as User,
      };
    } catch (err: any) {
      // ODD Observabilidad: emitir log obligatorio auth.login_failed (Spec §11)
      emitOddLog('auth.login_failed', {
        email,
        error: err.message || 'Error de autenticación',
      });
      throw err;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const fb = getFirebaseInstance();
    const docSnap = await fb.firestore.collection('users').doc(id).get();
    if (!docSnap) return null;
    const userData = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
    return (userData as User) || null;
  }

  switchRoleInProduction(_user: User, _newRole: UserRole): void {
    throw new Error('El cambio de rol en producción requiere verificación por rol');
  }

  // --- Borrador v3 / Documento Maestro v2.0 Single-Account Auth & Modes ---

  private async getAccountOrThrow(uid: string): Promise<UserAccount> {
    const fb = getFirebaseInstance();
    const snap = await fb.firestore.collection('users').doc(uid).get();
    if (!snap || !snap.exists) {
      throw new Error(`Cuenta no encontrada: ${uid}`);
    }
    return snap.data() as UserAccount;
  }

  async registerMinimalAccount(
    params: MinimalRegisterParams
  ): Promise<{ success: boolean; user: UserAccount }> {
    if (!params.terms_accepted) {
      throw new Error('Debes aceptar los términos y condiciones para registrarte');
    }

    const fb = getFirebaseInstance();
    const normalizedEmail = params.email.trim().toLowerCase();

    const existing = await fb.firestore
      .collection('users')
      .where('email', '==', normalizedEmail)
      .get();
    if (!existing.empty) {
      throw new Error(`El correo ya está registrado: ${normalizedEmail}`);
    }

    const authUser = await fb.auth.createUser(normalizedEmail, undefined, {
      display_name: params.display_name,
    });

    const now = new Date().toISOString();
    const account: UserAccount = {
      uid: authUser.id,
      display_name: params.display_name,
      email: normalizedEmail,
      phone: params.phone,
      terms_accepted: true,
      account_status: 'active',
      roles: ['explorer'],
      mode: 'viajero',
      concierge_access: false, // Never assignable via self-registration
      allergies: [],
      theme: 'dark',
      wallet: {
        balance_mxn: 0,
        currency: 'MXN',
        is_closed_loop: true,
        updated_at: now,
      },
      created_at: now,
    };

    await fb.firestore.collection('users').doc(account.uid).set(account);

    emitOddLog({
      event: 'auth.role_assigned',
      actorUid: account.uid,
      entityId: account.uid,
      metadata: { roles: account.roles, mode: account.mode },
    });

    return { success: true, user: account };
  }

  async switchMode(
    uid: string,
    targetMode: AccountMode
  ): Promise<{ user: UserAccount; splash: ModeSwitchSplash }> {
    const account = await this.getAccountOrThrow(uid);

    if (targetMode === 'concierge') {
      if (!account.concierge_access) {
        throw new Error('No autorizado: se requiere permiso explícito de Concierge');
      }
    }

    const isRestrictedSubAccount =
      (account.roles.includes('guide') || account.roles.includes('staff')) &&
      !account.concierge_access;

    if (isRestrictedSubAccount) {
      throw new Error('No autorizado: las cuentas de Guía o Staff no pueden cambiar de modo');
    }

    const updatedRoles = [...account.roles];
    if (targetMode === 'aliado' && !updatedRoles.includes('ally')) {
      updatedRoles.push('ally');
    }

    const updated: UserAccount = {
      ...account,
      mode: targetMode,
      roles: updatedRoles,
    };

    const fb = getFirebaseInstance();
    await fb.firestore.collection('users').doc(uid).set(updated);

    emitOddLog({
      event: 'account.mode_switched',
      actorUid: uid,
      entityId: uid,
      metadata: { from: account.mode, to: targetMode },
    });

    return {
      user: updated,
      splash: {
        durationMs: splashTokens.modeSwitchDurationMs,
        backgroundColor: splashTokens.backgroundColor,
        suitcaseColor: splashTokens.suitcaseColor,
        showProgressBar: splashTokens.showProgressBar,
        showText: splashTokens.showText,
      },
    };
  }

  async bootstrapAdminAccount(
    params: BootstrapAdminParams
  ): Promise<{ success: boolean; user: UserAccount }> {
    const normalizedEmail = params.email.trim().toLowerCase();
    if (!(CONCIERGE_ADMIN_WHITELIST as readonly string[]).includes(normalizedEmail)) {
      throw new Error(`No autorizado: ${normalizedEmail} no está en la whitelist de admin`);
    }

    const fb = getFirebaseInstance();
    const authUser = await fb.auth.createUser(normalizedEmail, undefined, {
      display_name: params.display_name,
    });

    const now = new Date().toISOString();
    const adminAccount: UserAccount = {
      uid: authUser.id,
      display_name: params.display_name,
      email: normalizedEmail,
      phone: params.phone || '',
      terms_accepted: true,
      account_status: 'active',
      roles: ['explorer', 'ally'],
      mode: 'viajero',
      concierge_access: true,
      allergies: [],
      theme: 'dark',
      wallet: {
        balance_mxn: 0,
        currency: 'MXN',
        is_closed_loop: true,
        updated_at: now,
      },
      created_at: now,
    };

    await fb.firestore.collection('users').doc(adminAccount.uid).set(adminAccount);

    emitOddLog({
      event: 'auth.role_assigned',
      actorUid: adminAccount.uid,
      entityId: adminAccount.uid,
      metadata: { concierge_access: true },
    });

    return { success: true, user: adminAccount };
  }

  async enterConciergeMode(
    uid: string
  ): Promise<{ authorized: true; mode: 'concierge'; user: UserAccount }> {
    const account = await this.getAccountOrThrow(uid);
    if (!account.concierge_access) {
      throw new Error('No autorizado: esta cuenta no tiene permiso de Concierge');
    }
    return {
      authorized: true,
      mode: 'concierge',
      user: account,
    };
  }

  async createGuideAccount(
    actorUid: string,
    params: CreateGuideParams
  ): Promise<{ success: boolean; user: UserAccount }> {
    const actor = await this.getAccountOrThrow(actorUid);
    if (!actor.concierge_access) {
      throw new Error('No autorizado: solo Concierge puede crear cuentas de Guía');
    }

    const fb = getFirebaseInstance();
    const normalizedEmail = params.email.trim().toLowerCase();
    const authUser = await fb.auth.createUser(normalizedEmail, undefined, {
      display_name: params.display_name,
    });

    const now = new Date().toISOString();
    const guideAccount: UserAccount = {
      uid: authUser.id,
      display_name: params.display_name,
      email: normalizedEmail,
      phone: params.phone,
      terms_accepted: true,
      account_status: 'active',
      roles: ['guide'],
      mode: 'viajero',
      concierge_access: false,
      allergies: [],
      theme: 'dark',
      assigned_tour_ids: params.assigned_tour_ids ? [...params.assigned_tour_ids] : [],
      wallet: {
        balance_mxn: 0,
        currency: 'MXN',
        is_closed_loop: true,
        updated_at: now,
      },
      created_at: now,
    };

    await fb.firestore.collection('users').doc(guideAccount.uid).set(guideAccount);
    return { success: true, user: guideAccount };
  }

  async assignGuideToTour(
    actorUid: string,
    guideUid: string,
    tourId: string
  ): Promise<UserAccount> {
    const actor = await this.getAccountOrThrow(actorUid);
    if (!actor.concierge_access) {
      throw new Error('No autorizado: solo Concierge puede asignar tours a un Guía');
    }

    const guide = await this.getAccountOrThrow(guideUid);
    const currentTours = guide.assigned_tour_ids || [];
    const updatedTours = currentTours.includes(tourId)
      ? currentTours
      : [...currentTours, tourId];

    const updated: UserAccount = {
      ...guide,
      assigned_tour_ids: updatedTours,
    };

    const fb = getFirebaseInstance();
    await fb.firestore.collection('users').doc(guideUid).set(updated);

    emitOddLog({
      event: 'guide.assigned',
      actorUid,
      entityId: guideUid,
      metadata: { tourId },
    });

    return updated;
  }

  async createStaffAccount(
    actorUid: string,
    params: CreateStaffParams
  ): Promise<{ success: boolean; user: UserAccount }> {
    const actor = await this.getAccountOrThrow(actorUid);
    const fb = getFirebaseInstance();

    const allySnap = await fb.firestore.collection('allies').doc(params.allyId).get();
    const allyData = allySnap?.exists ? allySnap.data() : null;

    const isOwner = Boolean(allyData && allyData.owner_uid === actorUid);
    const isStaffActor = actor.roles.includes('staff') && !actor.concierge_access;

    if (isStaffActor || (!actor.concierge_access && !isOwner)) {
      throw new Error('No autorizado: solo el dueño del Aliado o Concierge puede crear Staff');
    }

    const normalizedEmail = params.email.trim().toLowerCase();
    const authUser = await fb.auth.createUser(normalizedEmail, undefined, {
      display_name: params.display_name,
    });

    const now = new Date().toISOString();
    const staffAccount: UserAccount = {
      uid: authUser.id,
      display_name: params.display_name,
      email: normalizedEmail,
      phone: params.phone,
      terms_accepted: true,
      account_status: 'active',
      roles: ['staff'],
      mode: 'aliado',
      concierge_access: false,
      staff_ally_id: params.allyId,
      allergies: [],
      theme: 'dark',
      wallet: {
        balance_mxn: 0,
        currency: 'MXN',
        is_closed_loop: true,
        updated_at: now,
      },
      created_at: now,
    };

    await fb.firestore.collection('users').doc(staffAccount.uid).set(staffAccount);

    emitOddLog({
      event: 'staff.created',
      actorUid,
      entityId: staffAccount.uid,
      metadata: { allyId: params.allyId },
    });

    return { success: true, user: staffAccount };
  }

  async listRegisteredAccounts(actorUid: string): Promise<UserAccount[]> {
    const actor = await this.getAccountOrThrow(actorUid);
    if (!actor.concierge_access) {
      throw new Error('No autorizado: solo Concierge puede consultar Cuentas registradas');
    }

    const fb = getFirebaseInstance();
    const snap = await fb.firestore.collection('users').get();
    return snap.docs.map((d: any) => d.data() as UserAccount);
  }
}
