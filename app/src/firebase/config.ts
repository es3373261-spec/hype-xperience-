import { FirebaseMockStore } from './mock';

export interface FirebaseConfigOptions {
  useMocks?: boolean;
  useMock?: boolean;
}

export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseInstance {
  isMock: boolean;
  auth: any;
  firestore: any;
  projectId: string;
  emulatorPorts: {
    auth: number;
    firestore: number;
    functions: number;
    ui?: number;
  };
}

let currentInstance: FirebaseInstance | null = null;
export const mockStore = new FirebaseMockStore();

export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  ui: 4000,
};

function readEnv(key: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[key];
}

export function getFirebaseEnvConfig(): FirebaseEnvConfig {
  const projectId = readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || 'es3373261';
  return {
    apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY') || '',
    authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') || `${projectId}.appspot.com`,
    messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID') || '',
  };
}

export function initializeFirebase(options?: FirebaseConfigOptions): FirebaseInstance {
  const envMockFlag = readEnv('EXPO_PUBLIC_USE_FIREBASE_MOCKS');
  const defaultUseMocks = envMockFlag === 'false' ? false : true;
  const useMocks = options?.useMocks ?? options?.useMock ?? defaultUseMocks;
  const envConfig = getFirebaseEnvConfig();

  if (useMocks) {
    currentInstance = {
      isMock: true,
      auth: mockStore.auth,
      firestore: mockStore.firestore,
      projectId: envConfig.projectId,
      emulatorPorts: EMULATOR_PORTS,
    };
  } else {
    currentInstance = {
      isMock: false,
      auth: {
        ...mockStore.auth,
        emulatorHost: `127.0.0.1:${EMULATOR_PORTS.auth}`,
      },
      firestore: {
        ...mockStore.firestore,
        emulatorHost: `127.0.0.1:${EMULATOR_PORTS.firestore}`,
      },
      projectId: envConfig.projectId,
      emulatorPorts: EMULATOR_PORTS,
    };
  }

  return currentInstance;
}

export function getFirebaseInstance(): FirebaseInstance {
  if (!currentInstance) {
    return initializeFirebase();
  }
  return currentInstance;
}
