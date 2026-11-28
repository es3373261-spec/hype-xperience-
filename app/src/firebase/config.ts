import { FirebaseMockStore, mockStore } from './mock';

export type FirebaseMode = 'mock' | 'emulator' | 'sdk';

export interface FirebaseEmulatorConfig {
  host?: string;
  authPort?: number;
  firestorePort?: number;
  functionsPort?: number;
  uiPort?: number;
}

export interface FirebaseSdkConfig {
  apiKey: string;
  projectId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface FirebaseConfigOptions {
  mode?: FirebaseMode;
  useMocks?: boolean;
  useMock?: boolean;
  emulatorConfig?: FirebaseEmulatorConfig;
  sdkConfig?: FirebaseSdkConfig;
  /** Set true in runtime Expo app to bind the live Firebase JS SDK client */
  useLiveSdkClient?: boolean;
}

export interface FirebaseInstance {
  mode: FirebaseMode;
  isMock: boolean;
  auth: any;
  firestore: any;
  functions?: any;
  emulatorPorts: {
    auth: number;
    firestore: number;
    functions: number;
    ui?: number;
  };
  sdkConfig?: FirebaseSdkConfig;
}

let currentInstance: FirebaseInstance | null = null;
export { FirebaseMockStore, mockStore };

export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  ui: 4000,
};

export function resetFirebaseInstance(): void {
  currentInstance = null;
}

/**
 * Loads public Firebase client configuration from Expo environment variables
 * (never hardcoding credentials in source code, spec.md §18).
 */
export function getEnvFirebaseSdkConfig(): FirebaseSdkConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'onebypro-b0d7d';
  if (!apiKey) {
    return null;
  }
  return {
    apiKey,
    projectId,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

export function initializeFirebase(options?: FirebaseConfigOptions): FirebaseInstance {
  let mode: FirebaseMode;
  if (options?.mode) {
    mode = options.mode;
  } else {
    const useMocks = options?.useMocks ?? options?.useMock ?? true;
    mode = useMocks ? 'mock' : 'emulator';
  }

  const host = options?.emulatorConfig?.host || '127.0.0.1';
  const ports = {
    auth: options?.emulatorConfig?.authPort ?? EMULATOR_PORTS.auth,
    firestore: options?.emulatorConfig?.firestorePort ?? EMULATOR_PORTS.firestore,
    functions: options?.emulatorConfig?.functionsPort ?? EMULATOR_PORTS.functions,
    ui: options?.emulatorConfig?.uiPort ?? EMULATOR_PORTS.ui,
  };

  if (mode === 'mock') {
    currentInstance = {
      mode: 'mock',
      isMock: true,
      auth: mockStore.auth,
      firestore: mockStore.firestore,
      emulatorPorts: ports,
    };
  } else if (mode === 'emulator') {
    currentInstance = {
      mode: 'emulator',
      isMock: false,
      auth: {
        ...mockStore.auth,
        emulatorHost: `${host}:${ports.auth}`,
      },
      firestore: {
        ...mockStore.firestore,
        emulatorHost: `${host}:${ports.firestore}`,
      },
      emulatorPorts: ports,
    };
  } else {
    const sdkConfig = options?.sdkConfig || getEnvFirebaseSdkConfig() || undefined;
    let liveAuth: any = mockStore.auth;
    let liveFirestore: any = mockStore.firestore;
    let liveFunctions: any = undefined;

    if (options?.useLiveSdkClient && sdkConfig) {
      // Lazy-load Firebase JS SDK only when running against live project (onebypro-b0d7d)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const firebaseApp = require('firebase/app');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const firebaseAuth = require('firebase/auth');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const firebaseFirestore = require('firebase/firestore');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const firebaseFunctions = require('firebase/functions');

      const app = firebaseApp.getApps().length
        ? firebaseApp.getApp()
        : firebaseApp.initializeApp(sdkConfig);
      liveAuth = firebaseAuth.getAuth(app);
      liveFirestore = firebaseFirestore.getFirestore(app);
      liveFunctions = firebaseFunctions.getFunctions(app, 'us-central1');
    }

    currentInstance = {
      mode: 'sdk',
      isMock: false,
      auth: liveAuth,
      firestore: liveFirestore,
      functions: liveFunctions,
      emulatorPorts: ports,
      sdkConfig,
    };
  }

  return currentInstance;
}

export function getFirebaseInstance(): FirebaseInstance {
  if (!currentInstance) {
    return initializeFirebase({ mode: 'mock' });
  }
  return currentInstance;
}
