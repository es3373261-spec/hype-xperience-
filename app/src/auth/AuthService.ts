import { User, UserRole, UserBankInfo, UserSocialLinks } from '../types/user';
import { getFirebaseInstance } from '../firebase/config';
import { RBAC } from './rbac';
import { emitOddLog } from '../observability/oddLogger';

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

  switchRoleInProduction(user: User, newRole: UserRole): void {
    // Spec §3: Regla: un usuario tiene un rol principal. Cambiar de rol en la demo es solo para probar;
    // en producción el cambio de rol requiere registro / verificación por rol.
    throw new Error('El cambio de rol en producción requiere verificación por rol');
  }
}
