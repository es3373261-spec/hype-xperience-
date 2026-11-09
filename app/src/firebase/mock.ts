export interface MockAuthUser {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  [key: string]: any;
}

export class FirebaseMockStore {
  private collections: Map<string, Map<string, any>> = new Map();
  private users: Map<string, MockAuthUser> = new Map();
  private nextId = 1;

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
    collection: (collectionName: string) => {
      if (!this.collections.has(collectionName)) {
        this.collections.set(collectionName, new Map());
      }
      const col = this.collections.get(collectionName)!;

      return {
        doc: (docId: string) => ({
          set: async (data: any) => {
            // Guardrail: full CLABE must never be stored per spec.md §7
            const sanitized = { ...data };
            if (sanitized.bank && sanitized.bank.clabeFull) {
              delete sanitized.bank.clabeFull;
            }
            col.set(docId, JSON.parse(JSON.stringify(sanitized)));
          },
          get: async () => {
            const data = col.get(docId);
            return {
              exists: !!data,
              data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
            };
          },
        }),
      };
    },
  };

  public reset() {
    this.collections.clear();
    this.users.clear();
  }
}
