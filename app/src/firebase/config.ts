import { FirebaseMockStore } from './mock';

export interface FirebaseConfigOptions {
  useMocks?: boolean;
}

export interface FirebaseInstance {
  isMock: boolean;
  auth: any;
  firestore: any;
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

export function initializeFirebase(options?: FirebaseConfigOptions): FirebaseInstance {
  const useMocks = options?.useMocks ?? true;

  if (useMocks) {
    currentInstance = {
      isMock: true,
      auth: mockStore.auth,
      firestore: mockStore.firestore,
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
      emulatorPorts: EMULATOR_PORTS,
    };
  }

  return currentInstance;
}

export function getFirebaseInstance(): FirebaseInstance {
  if (!currentInstance) {
    return initializeFirebase({ useMocks: true });
  }
  return currentInstance;
}
