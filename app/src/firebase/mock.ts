export interface MockAuthUser {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  [key: string]: any;
}

type WhereOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';

interface WhereClause {
  field: string;
  op: WhereOp;
  value: any;
}

interface OrderClause {
  field: string;
  direction: 'asc' | 'desc';
}

const FIELD_VALUE_BRAND = '__hype_field_value__';

export interface FieldValueSentinel {
  [FIELD_VALUE_BRAND]: true;
  type: 'increment' | 'arrayUnion' | 'deleteField';
  value?: any;
}

export const FieldValue = {
  increment(delta: number): FieldValueSentinel {
    return { [FIELD_VALUE_BRAND]: true, type: 'increment', value: delta };
  },
  arrayUnion(...elements: any[]): FieldValueSentinel {
    return { [FIELD_VALUE_BRAND]: true, type: 'arrayUnion', value: elements };
  },
  deleteField(): FieldValueSentinel {
    return { [FIELD_VALUE_BRAND]: true, type: 'deleteField' };
  },
};

function isFieldValue(val: any): val is FieldValueSentinel {
  return Boolean(val && typeof val === 'object' && val[FIELD_VALUE_BRAND] === true);
}

function deepClone<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (isFieldValue(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T;
  }
  const out: Record<string, any> = {};
  for (const key of Object.keys(value as Record<string, any>)) {
    out[key] = deepClone((value as Record<string, any>)[key]);
  }
  return out as T;
}

function getByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') {
      return undefined;
    }
    cur = cur[part];
  }
  return cur;
}

function applyPathValue(target: Record<string, any>, path: string, val: any): void {
  const parts = path.split('.');
  let cur: Record<string, any> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!cur[part] || typeof cur[part] !== 'object' || Array.isArray(cur[part])) {
      cur[part] = {};
    }
    cur = cur[part];
  }
  const last = parts[parts.length - 1];

  if (isFieldValue(val)) {
    if (val.type === 'deleteField') {
      delete cur[last];
    } else if (val.type === 'increment') {
      const existing = typeof cur[last] === 'number' ? cur[last] : 0;
      cur[last] = existing + val.value;
    } else if (val.type === 'arrayUnion') {
      const existing = Array.isArray(cur[last]) ? [...cur[last]] : [];
      for (const el of val.value) {
        if (!existing.some((item) => JSON.stringify(item) === JSON.stringify(el))) {
          existing.push(deepClone(el));
        }
      }
      cur[last] = existing;
    }
    return;
  }

  cur[last] = deepClone(val);
}

function deepMerge(base: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  const out = deepClone(base);
  for (const key of Object.keys(incoming)) {
    const val = incoming[key];
    if (isFieldValue(val)) {
      applyPathValue(out, key, val);
    } else if (
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], val);
    } else {
      out[key] = deepClone(val);
    }
  }
  return out;
}

function sanitizeForCollection(collectionPath: string, rawData: any): any {
  const cloned = deepClone(rawData);
  const isRestrictedPrivate =
    collectionPath === 'allies_private' || collectionPath.endsWith('/allies_private');

  if (isRestrictedPrivate || !cloned || typeof cloned !== 'object') {
    return cloned;
  }

  // Guardrail: full CLABE must never be stored in public/standard collections (spec.md §7, §9)
  if (cloned.bank && typeof cloned.bank === 'object' && 'clabeFull' in cloned.bank) {
    delete cloned.bank.clabeFull;
  }
  if (cloned.payout_config && typeof cloned.payout_config === 'object') {
    if ('spei_clabe_full' in cloned.payout_config) {
      delete cloned.payout_config.spei_clabe_full;
    }
    if ('spei_clabe' in cloned.payout_config) {
      delete cloned.payout_config.spei_clabe;
    }
  }
  if ('clabeFull' in cloned) {
    delete cloned.clabeFull;
  }
  if ('spei_clabe_full' in cloned) {
    delete cloned.spei_clabe_full;
  }

  return cloned;
}

function matchesWhere(docData: any, clause: WhereClause): boolean {
  const fieldVal = getByPath(docData, clause.field);
  switch (clause.op) {
    case '==':
      return fieldVal === clause.value;
    case '!=':
      return fieldVal !== clause.value;
    case '<':
      return fieldVal !== undefined && fieldVal < clause.value;
    case '<=':
      return fieldVal !== undefined && fieldVal <= clause.value;
    case '>':
      return fieldVal !== undefined && fieldVal > clause.value;
    case '>=':
      return fieldVal !== undefined && fieldVal >= clause.value;
    case 'in':
      return Array.isArray(clause.value) && clause.value.includes(fieldVal);
    case 'array-contains':
      return Array.isArray(fieldVal) && fieldVal.includes(clause.value);
    default:
      return false;
  }
}

export class FirebaseMockStore {
  private collections: Map<string, Map<string, any>> = new Map();
  private users: Map<string, MockAuthUser> = new Map();
  private nextId = 1;
  private txQueue: Promise<any> = Promise.resolve();

  private getCollectionMap(collectionPath: string): Map<string, any> {
    if (!this.collections.has(collectionPath)) {
      this.collections.set(collectionPath, new Map());
    }
    return this.collections.get(collectionPath)!;
  }

  private createDocRef(collectionPath: string, docId: string) {
    const store = this;
    const ref: any = {
      id: docId,
      collectionPath,
      path: `${collectionPath}/${docId}`,
      collection: (subCollectionName: string) =>
        store.createCollectionRef(`${collectionPath}/${docId}/${subCollectionName}`),
      set: async (data: any, options?: { merge?: boolean }) => {
        const col = store.getCollectionMap(collectionPath);
        const sanitized = sanitizeForCollection(collectionPath, data);
        if (options?.merge && col.has(docId)) {
          const merged = deepMerge(col.get(docId), sanitized);
          col.set(docId, sanitizeForCollection(collectionPath, merged));
        } else {
          col.set(docId, sanitized);
        }
      },
      update: async (data: Record<string, any>) => {
        const col = store.getCollectionMap(collectionPath);
        if (!col.has(docId)) {
          throw new Error(`Document not found: ${collectionPath}/${docId}`);
        }
        const current = deepClone(col.get(docId));
        for (const key of Object.keys(data)) {
          applyPathValue(current, key, data[key]);
        }
        col.set(docId, sanitizeForCollection(collectionPath, current));
      },
      delete: async () => {
        const col = store.getCollectionMap(collectionPath);
        col.delete(docId);
      },
      get: async () => {
        const col = store.getCollectionMap(collectionPath);
        const data = col.get(docId);
        return {
          id: docId,
          exists: data !== undefined,
          data: () => (data !== undefined ? deepClone(data) : undefined),
        };
      },
    };
    return ref;
  }

  private createQuery(
    collectionPath: string,
    wheres: WhereClause[] = [],
    orders: OrderClause[] = [],
    limitCount?: number
  ) {
    const store = this;
    return {
      where: (field: string, op: WhereOp, value: any) =>
        store.createQuery(collectionPath, [...wheres, { field, op, value }], orders, limitCount),
      orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') =>
        store.createQuery(collectionPath, wheres, [...orders, { field, direction }], limitCount),
      limit: (count: number) => store.createQuery(collectionPath, wheres, orders, count),
      get: async () => {
        const col = store.getCollectionMap(collectionPath);
        let entries = Array.from(col.entries()).filter(([, data]) =>
          wheres.every((w) => matchesWhere(data, w))
        );

        if (orders.length > 0) {
          entries.sort(([, a], [, b]) => {
            for (const o of orders) {
              const av = getByPath(a, o.field);
              const bv = getByPath(b, o.field);
              if (av === bv) continue;
              const cmp = av < bv ? -1 : 1;
              return o.direction === 'desc' ? -cmp : cmp;
            }
            return 0;
          });
        }

        if (typeof limitCount === 'number') {
          entries = entries.slice(0, limitCount);
        }

        const docs = entries.map(([id, data]) => ({
          id,
          exists: true,
          data: () => deepClone(data),
        }));

        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
          forEach: (cb: (doc: any) => void) => {
            for (const d of docs) {
              cb(d);
            }
          },
        };
      },
    };
  }

  private createCollectionRef(collectionPath: string) {
    const store = this;
    const baseQuery = store.createQuery(collectionPath);
    return {
      path: collectionPath,
      doc: (docId?: string) => {
        const id = docId || `doc_${Date.now()}_${store.nextId++}`;
        return store.createDocRef(collectionPath, id);
      },
      add: async (data: any) => {
        const id = `auto_${Date.now()}_${store.nextId++}`;
        const ref = store.createDocRef(collectionPath, id);
        await ref.set(data);
        return ref;
      },
      where: baseQuery.where,
      orderBy: baseQuery.orderBy,
      limit: baseQuery.limit,
      get: baseQuery.get,
    };
  }

  public auth = {
    createUser: async (
      email: string,
      _password?: string,
      extra?: { nombre?: string; rol?: string; [key: string]: any }
    ): Promise<MockAuthUser> => {
      const id = `user_${Date.now()}_${this.nextId++}`;
      const user: MockAuthUser = {
        id,
        email,
        ...extra,
      };
      this.users.set(id, user);
      return user;
    },
    getUser: async (id: string): Promise<MockAuthUser | null> => {
      return this.users.get(id) || null;
    },
    signIn: async (email: string, _password?: string): Promise<MockAuthUser> => {
      for (const u of this.users.values()) {
        if (u.email === email) {
          return u;
        }
      }
      throw new Error('Usuario o contraseña incorrectos');
    },
  };

  public firestore = {
    collection: (collectionName: string) => this.createCollectionRef(collectionName),
    runTransaction: async <T>(updateFn: (tx: any) => Promise<T>): Promise<T> => {
      const execute = async (): Promise<T> => {
        // Snapshot current state for atomic rollback on failure
        const snapshot = new Map<string, Map<string, any>>();
        for (const [colPath, colMap] of this.collections.entries()) {
          const clonedCol = new Map<string, any>();
          for (const [docId, docVal] of colMap.entries()) {
            clonedCol.set(docId, deepClone(docVal));
          }
          snapshot.set(colPath, clonedCol);
        }

        const stagedOps: Array<() => Promise<void>> = [];

        const tx = {
          get: async (docRef: any) => docRef.get(),
          set: (docRef: any, data: any, options?: { merge?: boolean }) => {
            const dataCopy = deepClone(data);
            stagedOps.push(() => docRef.set(dataCopy, options));
            return tx;
          },
          update: (docRef: any, data: Record<string, any>) => {
            const dataCopy = deepClone(data);
            stagedOps.push(() => docRef.update(dataCopy));
            return tx;
          },
          delete: (docRef: any) => {
            stagedOps.push(() => docRef.delete());
            return tx;
          },
        };

        try {
          const result = await updateFn(tx);
          for (const op of stagedOps) {
            await op();
          }
          return result;
        } catch (err) {
          this.collections = snapshot;
          throw err;
        }
      };

      const next = this.txQueue.then(execute, execute);
      this.txQueue = next.then(
        () => undefined,
        () => undefined
      );
      return next;
    },
  };

  public reset() {
    this.collections.clear();
    this.users.clear();
    this.nextId = 1;
  }

  public getRawCollectionSnapshot(collectionPath: string): Array<{ id: string; data: any }> {
    const col = this.collections.get(collectionPath);
    if (!col) return [];
    return Array.from(col.entries()).map(([id, data]) => ({ id, data: deepClone(data) }));
  }
}

export const mockStore = new FirebaseMockStore();
