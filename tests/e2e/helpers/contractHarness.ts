// Opaque-box contract harness for Hype Xperience v2 E2E tests.
// Uses strictly erasable TypeScript syntax (zero `enum`, zero parameter properties).
// Resolves real implementation targets from PROJECT.md § Code Layout or Firebase Emulators.
// NEVER fakes or stubs business logic results.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

export type ContractTargetKey =
  | 'auth'
  | 'catalog'
  | 'odd'
  | 'wallet'
  | 'club'
  | 'taxi'
  | 'reviews'
  | 'concierge'
  | 'tokens'
  | 'rules'
  | 'admin';

export type E2ETargetMode = 'module' | 'emulator';

export interface ContractTargetSpec {
  readonly key: ContractTargetKey;
  readonly milestone: string;
  readonly kind: 'module' | 'file';
  readonly candidates: readonly string[];
  readonly defaultExports: readonly string[];
}

export const CONTRACT_TARGETS: Record<ContractTargetKey, ContractTargetSpec> = {
  auth: {
    key: 'auth',
    milestone: 'M1',
    kind: 'module',
    candidates: ['app/src/auth/AuthService', 'app/src/auth/rbac'],
    defaultExports: ['registerUser', 'switchMode', 'canAccessRegisteredAccounts'],
  },
  catalog: {
    key: 'catalog',
    milestone: 'M1',
    kind: 'module',
    candidates: ['app/src/catalog/CatalogManager'],
    defaultExports: ['publishListing', 'getActiveCategories'],
  },
  odd: {
    key: 'odd',
    milestone: 'M1',
    kind: 'module',
    candidates: [
      'app/src/observability/oddLogger',
      'functions/src/odd',
      'app/src/release/PilotQAService',
    ],
    defaultExports: ['emitOddLog'],
  },
  wallet: {
    key: 'wallet',
    milestone: 'M2',
    kind: 'module',
    candidates: ['app/src/wallet/WalletService', 'functions/src/wallet'],
    defaultExports: ['payBooking'],
  },
  club: {
    key: 'club',
    milestone: 'M2',
    kind: 'module',
    candidates: ['app/src/club/ClubService', 'functions/src/qr', 'functions/src/bookings'],
    defaultExports: ['closeFinalTicket', 'scanTicketQR'],
  },
  taxi: {
    key: 'taxi',
    milestone: 'M2',
    kind: 'module',
    candidates: ['app/src/taxi/TaxiService', 'functions/src/taxi'],
    defaultExports: ['quoteTaxi'],
  },
  reviews: {
    key: 'reviews',
    milestone: 'M2',
    kind: 'module',
    candidates: ['app/src/reviews/ReviewService', 'app/src/tourist/TouristService'],
    defaultExports: ['createReview'],
  },
  concierge: {
    key: 'concierge',
    milestone: 'M3',
    kind: 'module',
    candidates: [
      'app/src/concierge/ConciergeAuraService',
      'functions/src/aura',
      'functions/src/concierge',
    ],
    defaultExports: ['chatWithAura', 'cancelPackageBeforeAcceptance'],
  },
  tokens: {
    key: 'tokens',
    milestone: 'M1/M4',
    kind: 'module',
    candidates: ['app/src/theme/tokens'],
    defaultExports: [],
  },
  rules: {
    key: 'rules',
    milestone: 'M3',
    kind: 'file',
    candidates: ['firestore.rules', 'firestore.indexes.json'],
    defaultExports: [],
  },
  admin: {
    key: 'admin',
    milestone: 'M5',
    kind: 'module',
    candidates: [
      'admin/src/services/adminService',
      'admin/src/services/hypeControl',
      'admin/src/App',
    ],
    defaultExports: [],
  },
} as const;

export interface EmulatorConfig {
  readonly projectId: string;
  readonly region: string;
  readonly authHost: string;
  readonly firestoreHost: string;
  readonly functionsHost: string;
  readonly authUrl: string;
  readonly firestoreUrl: string;
  readonly functionsBaseUrl: string;
}

export interface ProbeResult {
  readonly available: boolean;
  readonly targetKey: ContractTargetKey;
  readonly milestone: string;
  readonly searchedPaths: readonly string[];
  readonly resolvedFiles: readonly string[];
  readonly missingExports: readonly string[];
  readonly loadErrors: readonly string[];
  readonly api: Record<string, unknown>;
}

export interface HttpInvokeOptions {
  readonly method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  readonly region?: string;
  readonly callable?: boolean;
  readonly timeoutMs?: number;
}

export interface HttpInvokeResult<T = unknown> {
  readonly status: number;
  readonly ok: boolean;
  readonly data: T;
  readonly rawText: string;
  readonly url: string;
}

export interface ContractErrorDetails {
  readonly targetKey: ContractTargetKey;
  readonly milestone: string;
  readonly searchedPaths: readonly string[];
  readonly missingExports: readonly string[];
  readonly detail?: string;
}

export class ContractNotImplementedError extends Error {
  public readonly targetKey: ContractTargetKey;
  public readonly milestone: string;
  public readonly searchedPaths: readonly string[];
  public readonly missingExports: readonly string[];
  public readonly detail: string | undefined;

  constructor(details: ContractErrorDetails) {
    const missingPart =
      details.missingExports.length > 0
        ? ` missingExports=[${details.missingExports.join(', ')}]`
        : '';
    const detailPart = details.detail ? ` detail=${details.detail}` : '';
    super(
      `Contract "${details.targetKey}" (${details.milestone}) is not implemented or incomplete.` +
        ` searched=[${details.searchedPaths.join(', ')}]${missingPart}${detailPart}`
    );
    this.name = 'ContractNotImplementedError';
    this.targetKey = details.targetKey;
    this.milestone = details.milestone;
    this.searchedPaths = details.searchedPaths;
    this.missingExports = details.missingExports;
    this.detail = details.detail;
  }
}

export function getRepoRoot(): string {
  if (typeof __dirname === 'string') {
    const candidate = path.resolve(__dirname, '../../..');
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
  }
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) &&
      fs.existsSync(path.join(dir, 'firebase.json'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return process.cwd();
}

export function getE2ETargetMode(): E2ETargetMode {
  if (process.env.E2E_TARGET === 'emulator') {
    return 'emulator';
  }
  if (process.env.E2E_TARGET === 'module') {
    return 'module';
  }
  if (
    process.env.USE_EMULATORS === '1' ||
    process.env.E2E_USE_EMULATOR === '1'
  ) {
    return 'emulator';
  }
  return 'module';
}

export function getEmulatorConfig(): EmulatorConfig {
  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    'es3373261';
  const region = process.env.FIREBASE_FUNCTIONS_REGION || 'us-central1';
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001';

  return {
    projectId,
    region,
    authHost,
    firestoreHost,
    functionsHost,
    authUrl: `http://${authHost}`,
    firestoreUrl: `http://${firestoreHost}`,
    functionsBaseUrl: `http://${functionsHost}/${projectId}/${region}`,
  };
}

export async function invokeHttpEndpoint<T = unknown>(
  fnName: string,
  payload?: unknown,
  headers: Record<string, string> = {},
  options: HttpInvokeOptions = {}
): Promise<HttpInvokeResult<T>> {
  const cfg = getEmulatorConfig();
  const region = options.region || cfg.region;
  const baseUrl =
    process.env.E2E_FUNCTIONS_BASE_URL ||
    `http://${cfg.functionsHost}/${cfg.projectId}/${region}`;
  const cleanFn = fnName.replace(/^\/+/, '');
  const url = `${baseUrl}/${cleanFn}`;
  const method = options.method || 'POST';
  const timeoutMs = options.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    const bodyObject = options.callable ? { data: payload ?? {} } : payload;
    const init: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
    };
    if (method !== 'GET' && bodyObject !== undefined) {
      init.body = JSON.stringify(bodyObject);
    }

    const res = await fetch(url, init);
    const rawText = await res.text();
    let parsed: unknown = rawText;
    if (rawText.length > 0) {
      try {
        const json = JSON.parse(rawText) as Record<string, unknown>;
        parsed =
          options.callable && json && typeof json === 'object' && 'result' in json
            ? json.result
            : json;
      } catch {
        parsed = rawText;
      }
    }

    return {
      status: res.status,
      ok: res.ok,
      data: parsed as T,
      rawText,
      url,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function shouldSkipUnimplemented(): boolean {
  return process.env.E2E_SKIP_UNIMPLEMENTED === '1';
}

const MODULE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'] as const;

function resolveCandidateFile(repoRoot: string, candidate: string, kind: 'module' | 'file'): string | null {
  const absBase = path.resolve(repoRoot, candidate);
  if (fs.existsSync(absBase) && fs.statSync(absBase).isFile()) {
    return absBase;
  }
  if (kind === 'file') {
    return null;
  }
  for (const ext of MODULE_EXTENSIONS) {
    const withExt = `${absBase}${ext}`;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }
  for (const ext of MODULE_EXTENSIONS) {
    const indexFile = path.join(absBase, `index${ext}`);
    if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
      return indexFile;
    }
  }
  return null;
}

function getRuntimeLoader(): NodeRequire {
  if (typeof require === 'function') {
    return require;
  }
  return createRequire(path.join(getRepoRoot(), 'package.json'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function bindMember(owner: Record<string, unknown>, key: string): unknown {
  const val = owner[key];
  if (typeof val === 'function') {
    return (val as (...args: unknown[]) => unknown).bind(owner);
  }
  return val;
}

function collectModuleExports(mod: unknown, api: Record<string, unknown>): void {
  if (!isRecord(mod)) {
    return;
  }

  for (const key of Object.keys(mod)) {
    if (key === '__esModule') {
      continue;
    }
    const val = mod[key];
    if (typeof val === 'function') {
      // Check if it looks like a class constructor with prototype methods
      const proto = (val as { prototype?: Record<string, unknown> }).prototype;
      const protoKeys = proto
        ? Object.getOwnPropertyNames(proto).filter(
            (k) => k !== 'constructor' && typeof proto[k] === 'function'
          )
        : [];
      if (protoKeys.length > 0 && /^[A-Z]/.test(key)) {
        try {
          const Ctor = val as new () => Record<string, unknown>;
          const instance = new Ctor();
          for (const methodName of protoKeys) {
            if (!(methodName in api)) {
              api[methodName] = bindMember(instance, methodName);
            }
          }
          if (!(key in api)) {
            api[key] = val;
          }
          continue;
        } catch {
          // Constructor requires arguments; keep class export as-is
        }
      }
      if (!(key in api)) {
        api[key] = val;
      }
    } else if (isRecord(val)) {
      if (key === 'default') {
        collectModuleExports(val, api);
      } else {
        if (!(key in api)) {
          api[key] = val;
        }
        // Also surface singleton service methods at top level if not colliding
        for (const subKey of Object.keys(val)) {
          if (!(subKey in api) && typeof val[subKey] === 'function') {
            api[subKey] = bindMember(val, subKey);
          }
        }
        const proto = Object.getPrototypeOf(val);
        if (proto && proto !== Object.prototype) {
          for (const methodName of Object.getOwnPropertyNames(proto)) {
            if (
              methodName !== 'constructor' &&
              !(methodName in api) &&
              typeof (val as Record<string, unknown>)[methodName] === 'function'
            ) {
              api[methodName] = bindMember(val, methodName);
            }
          }
        }
      }
    } else if (!(key in api)) {
      api[key] = val;
    }
  }
}

export function probeTarget(
  targetKey: ContractTargetKey,
  requiredExports?: readonly string[]
): ProbeResult {
  const spec = CONTRACT_TARGETS[targetKey];
  const repoRoot = getRepoRoot();
  const expected = requiredExports ?? spec.defaultExports;
  const resolvedFiles: string[] = [];
  const loadErrors: string[] = [];
  const api: Record<string, unknown> = {};

  for (const candidate of spec.candidates) {
    const resolved = resolveCandidateFile(repoRoot, candidate, spec.kind);
    if (!resolved) {
      continue;
    }
    resolvedFiles.push(path.relative(repoRoot, resolved));

    if (spec.kind === 'file') {
      try {
        const content = fs.readFileSync(resolved, 'utf8');
        const baseName = path.basename(resolved);
        api[baseName] = content;
        if (!('content' in api)) {
          api.content = content;
        }
        if (!('rulesText' in api) && baseName === 'firestore.rules') {
          api.rulesText = content;
        }
        if (!('indexesJson' in api) && baseName === 'firestore.indexes.json') {
          api.indexesJson = JSON.parse(content);
        }
      } catch (err) {
        loadErrors.push(`${resolved}: ${err instanceof Error ? err.message : String(err)}`);
      }
      continue;
    }

    try {
      const loader = getRuntimeLoader();
      const mod = loader(resolved) as unknown;
      collectModuleExports(mod, api);
    } catch (err) {
      loadErrors.push(`${resolved}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const missingExports = expected.filter((name) => !(name in api));
  const available =
    resolvedFiles.length > 0 &&
    loadErrors.length === 0 &&
    missingExports.length === 0;

  return {
    available,
    targetKey,
    milestone: spec.milestone,
    searchedPaths: spec.candidates,
    resolvedFiles,
    missingExports,
    loadErrors,
    api,
  };
}

export function requireContract(
  targetKey: ContractTargetKey,
  requiredExports?: readonly string[]
): Record<string, unknown> {
  const probe = probeTarget(targetKey, requiredExports);
  if (probe.available) {
    return probe.api;
  }

  throw new ContractNotImplementedError({
    targetKey: probe.targetKey,
    milestone: probe.milestone,
    searchedPaths: probe.searchedPaths,
    missingExports: probe.missingExports,
    detail: probe.loadErrors.length > 0 ? probe.loadErrors.join(' | ') : undefined,
  });
}

type JestDescribeFn = ((name: string, fn: () => void) => void) & {
  skip: (name: string, fn: () => void) => void;
};

type JestItFn = ((name: string, fn: () => Promise<void> | void, timeout?: number) => void) & {
  skip: (name: string, fn: () => Promise<void> | void, timeout?: number) => void;
};

declare const describe: JestDescribeFn | undefined;
declare const it: JestItFn | undefined;

export function describeContract(
  targetKey: ContractTargetKey,
  requiredExports: readonly string[],
  title: string,
  suiteFn: () => void
): void {
  if (typeof describe !== 'function') {
    throw new Error(`describeContract("${title}") must be called inside a Jest test file.`);
  }
  const mode = getE2ETargetMode();
  if (mode === 'module' && shouldSkipUnimplemented()) {
    const probe = probeTarget(targetKey, requiredExports);
    if (!probe.available) {
      describe.skip(`${title} [SKIPPED: ${targetKey} pending ${probe.milestone}]`, suiteFn);
      return;
    }
  }
  describe(title, suiteFn);
}

export function testContract(
  targetKey: ContractTargetKey,
  requiredExports: readonly string[],
  title: string,
  testFn: (api: Record<string, unknown>) => Promise<void> | void,
  timeoutMs?: number
): void {
  if (typeof it !== 'function') {
    throw new Error(`testContract("${title}") must be called inside a Jest test file.`);
  }
  const mode = getE2ETargetMode();
  if (mode === 'module' && shouldSkipUnimplemented()) {
    const probe = probeTarget(targetKey, requiredExports);
    if (!probe.available) {
      it.skip(
        `${title} [SKIPPED: ${targetKey} pending ${probe.milestone}]`,
        async () => {},
        timeoutMs
      );
      return;
    }
  }
  it(
    title,
    async () => {
      const api = requireContract(targetKey, requiredExports);
      await testFn(api);
    },
    timeoutMs
  );
}
