// E2E Jest setup: environment defaults and deterministic cleanup hooks.
// Uses strictly erasable TypeScript syntax.

export const E2E_DEFAULT_ENV = {
  E2E_TARGET: 'module',
  GCLOUD_PROJECT: 'es3373261',
  FIREBASE_PROJECT_ID: 'es3373261',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FUNCTIONS_EMULATOR_HOST: '127.0.0.1:5001',
} as const;

export function applyE2EEnvDefaults(): void {
  if (!process.env.E2E_TARGET) {
    process.env.E2E_TARGET = E2E_DEFAULT_ENV.E2E_TARGET;
  }
  if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = E2E_DEFAULT_ENV.GCLOUD_PROJECT;
  }
  if (!process.env.FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = E2E_DEFAULT_ENV.FIREBASE_PROJECT_ID;
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = E2E_DEFAULT_ENV.FIREBASE_AUTH_EMULATOR_HOST;
  }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = E2E_DEFAULT_ENV.FIRESTORE_EMULATOR_HOST;
  }
  if (!process.env.FUNCTIONS_EMULATOR_HOST) {
    process.env.FUNCTIONS_EMULATOR_HOST = E2E_DEFAULT_ENV.FUNCTIONS_EMULATOR_HOST;
  }
}

applyE2EEnvDefaults();

export type CleanupCallback = () => Promise<void> | void;

const cleanupQueue: CleanupCallback[] = [];

export function registerE2ECleanup(fn: CleanupCallback): void {
  cleanupQueue.push(fn);
}

export async function runE2ECleanups(): Promise<void> {
  while (cleanupQueue.length > 0) {
    const fn = cleanupQueue.pop();
    if (fn) {
      await fn();
    }
  }
}

declare const afterEach: ((fn: () => Promise<void> | void) => void) | undefined;
declare const afterAll: ((fn: () => Promise<void> | void) => void) | undefined;

if (typeof afterEach === 'function') {
  afterEach(async () => {
    await runE2ECleanups();
  });
}

if (typeof afterAll === 'function') {
  afterAll(async () => {
    await runE2ECleanups();
  });
}
