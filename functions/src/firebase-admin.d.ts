declare module 'firebase-admin/app' {
  export function getApps(): any[];
  export function initializeApp(options?: any): any;
}

declare module 'firebase-admin/firestore' {
  export function getFirestore(): any;
}
