import { FirebaseMockStore, mockStore, FieldValue } from '../firebase/mock';
import {
  initializeFirebase,
  getFirebaseInstance,
  resetFirebaseInstance,
} from '../firebase/config';

describe('M1 — FirebaseMockStore & Firebase Config Hooks', () => {
  let store: FirebaseMockStore;

  beforeEach(() => {
    resetFirebaseInstance();
    mockStore.reset();
    store = new FirebaseMockStore();
  });

  describe('Firestore Queries: .where(), dot-paths, chaining, .orderBy(), .limit(), QuerySnapshot', () => {
    beforeEach(async () => {
      const allies = store.firestore.collection('allies');
      await allies.doc('ally_1').set({
        allyId: 'ally_1',
        status: 'active',
        ally_category: 'venue',
        rating: 4.9,
        tags: ['playa', 'mariscos', 'familiar'],
        profile: { business_name: "Mariscos Rulo's", city: 'Acapulco' },
      });
      await allies.doc('ally_2').set({
        allyId: 'ally_2',
        status: 'pending_review',
        ally_category: 'tour',
        rating: 4.2,
        tags: ['bahia', 'yate'],
        profile: { business_name: 'Yates Diamante', city: 'Acapulco' },
      });
      await allies.doc('ally_3').set({
        allyId: 'ally_3',
        status: 'active',
        ally_category: 'accommodation',
        rating: 4.7,
        tags: ['playa', 'alberca'],
        profile: { business_name: 'Villa Costa Azul', city: 'Acapulco' },
      });
      await allies.doc('ally_4').set({
        allyId: 'ally_4',
        status: 'suspended',
        ally_category: 'transport',
        rating: 3.5,
        tags: ['taxi'],
        profile: { business_name: 'Taxi Viejo', city: 'Chilpancingo' },
      });
    });

    it('supports all comparison operators (==, !=, <, <=, >, >=, in, array-contains) and dot-paths', async () => {
      const col = store.firestore.collection('allies');

      const eqSnap = await col.where('status', '==', 'active').get();
      expect(eqSnap.size).toBe(2);
      expect(eqSnap.empty).toBe(false);

      const neqSnap = await col.where('status', '!=', 'active').get();
      expect(neqSnap.size).toBe(2);

      const gtSnap = await col.where('rating', '>', 4.7).get();
      expect(gtSnap.docs.map((d: any) => d.id)).toEqual(['ally_1']);

      const gteSnap = await col.where('rating', '>=', 4.7).get();
      expect(gteSnap.size).toBe(2);

      const ltSnap = await col.where('rating', '<', 4.2).get();
      expect(ltSnap.docs.map((d: any) => d.id)).toEqual(['ally_4']);

      const lteSnap = await col.where('rating', '<=', 4.2).get();
      expect(lteSnap.size).toBe(2);

      const inSnap = await col.where('ally_category', 'in', ['venue', 'tour']).get();
      expect(inSnap.size).toBe(2);

      const arraySnap = await col.where('tags', 'array-contains', 'playa').get();
      expect(arraySnap.size).toBe(2);

      const dotSnap = await col.where('profile.city', '==', 'Chilpancingo').get();
      expect(dotSnap.size).toBe(1);
      expect(dotSnap.docs[0].data().profile.business_name).toBe('Taxi Viejo');
    });

    it('supports chained .where(), .orderBy(), .limit(), and QuerySnapshot.forEach', async () => {
      const snap = await store.firestore
        .collection('allies')
        .where('status', '==', 'active')
        .where('profile.city', '==', 'Acapulco')
        .orderBy('rating', 'asc')
        .limit(1)
        .get();

      expect(snap.empty).toBe(false);
      expect(snap.size).toBe(1);
      expect(snap.docs.length).toBe(1);

      const collected: string[] = [];
      snap.forEach((doc: any) => {
        collected.push(doc.id);
      });
      expect(collected).toEqual(['ally_3']);

      const emptySnap = await store.firestore
        .collection('allies')
        .where('status', '==', 'nonexistent')
        .get();
      expect(emptySnap.empty).toBe(true);
      expect(emptySnap.size).toBe(0);
      expect(emptySnap.docs).toEqual([]);
    });
  });

  describe('CRUD: .add(), .set(merge), .update() with dot-notation & FieldValue, .delete(), subcollections', () => {
    it('supports .add() auto-id generation and .set(..., { merge: true })', async () => {
      const col = store.firestore.collection('listings');
      const ref = await col.add({ title: 'Tour La Roqueta', priceMxn: 350, status: 'en_progreso' });
      expect(ref.id).toBeTruthy();

      const added = await ref.get();
      expect(added.exists).toBe(true);
      expect(added.data().title).toBe('Tour La Roqueta');

      await col.doc(ref.id).set({ status: 'publicado' }, { merge: true });
      const merged = await col.doc(ref.id).get();
      expect(merged.data().title).toBe('Tour La Roqueta');
      expect(merged.data().status).toBe('publicado');
    });

    it('supports .update() with dot-notation and FieldValue.increment, arrayUnion, deleteField, and .delete()', async () => {
      const userRef = store.firestore.collection('users').doc('u_1');
      await userRef.set({
        uid: 'u_1',
        allergies: ['nueces'],
        tempFlag: 'remove_me',
        wallet: { balance_mxn: 1000, currency: 'MXN' },
      });

      await userRef.update({
        'wallet.balance_mxn': FieldValue.increment(-250),
        allergies: FieldValue.arrayUnion('mariscos', 'nueces'),
        tempFlag: FieldValue.deleteField(),
      });

      const updated = (await userRef.get()).data();
      expect(updated.wallet.balance_mxn).toBe(750);
      expect(updated.allergies).toEqual(['nueces', 'mariscos']);
      expect('tempFlag' in updated).toBe(false);

      await expect(
        store.firestore.collection('users').doc('missing_doc').update({ foo: 'bar' })
      ).rejects.toThrow();

      await userRef.delete();
      const afterDelete = await userRef.get();
      expect(afterDelete.exists).toBe(false);
    });

    it('supports nested subcollections via doc(...).collection(...)', async () => {
      const reviewsCol = store.firestore
        .collection('allies')
        .doc('ally_rulos')
        .collection('reviews');

      await reviewsCol.doc('rev_1').set({ rating: 5, comment: 'Delicioso' });
      await reviewsCol.add({ rating: 4, comment: 'Buen ambiente' });

      const snap = await reviewsCol.where('rating', '>=', 5).get();
      expect(snap.size).toBe(1);
      expect(snap.docs[0].data().comment).toBe('Delicioso');
    });
  });

  describe('Atomic runTransaction', () => {
    it('serializes concurrent transactions cleanly without lost updates', async () => {
      const walletRef = store.firestore.collection('users').doc('u_tx');
      await walletRef.set({ uid: 'u_tx', wallet: { balance_mxn: 1000 } });

      await Promise.all([
        store.firestore.runTransaction(async (tx: any) => {
          const snap = await tx.get(walletRef);
          const cur = snap.data().wallet.balance_mxn;
          await new Promise((r) => setTimeout(r, 15));
          tx.update(walletRef, { 'wallet.balance_mxn': cur - 200 });
        }),
        store.firestore.runTransaction(async (tx: any) => {
          const snap = await tx.get(walletRef);
          const cur = snap.data().wallet.balance_mxn;
          await new Promise((r) => setTimeout(r, 5));
          tx.update(walletRef, { 'wallet.balance_mxn': cur - 300 });
        }),
      ]);

      const finalSnap = await walletRef.get();
      expect(finalSnap.data().wallet.balance_mxn).toBe(500);
    });

    it('rolls back all staged writes when an error is thrown inside runTransaction', async () => {
      const userRef = store.firestore.collection('users').doc('u_rb');
      const ledgerRef = store.firestore.collection('wallet_transactions').doc('tx_rb');
      await userRef.set({ uid: 'u_rb', wallet: { balance_mxn: 1000 } });

      await expect(
        store.firestore.runTransaction(async (tx: any) => {
          tx.update(userRef, { 'wallet.balance_mxn': 400 });
          tx.set(ledgerRef, { id: 'tx_rb', amount_mxn: -600 });
          throw new Error('Simulated transaction failure');
        })
      ).rejects.toThrow('Simulated transaction failure');

      const userAfter = await userRef.get();
      const ledgerAfter = await ledgerRef.get();
      expect(userAfter.data().wallet.balance_mxn).toBe(1000);
      expect(ledgerAfter.exists).toBe(false);
    });
  });

  describe('CLABE Sanitization & Input Immutability (spec.md §7, §9)', () => {
    it('does not mutate caller input and strips clabeFull / spei_clabe_full / full spei_clabe on users and allies while preserving last4', async () => {
      const userInput = {
        uid: 'u_clabe',
        bank: {
          clabeLast4: '5678',
          clabeFull: '012345678901235678',
          titular: 'Raul',
        },
      };

      await store.firestore.collection('users').doc('u_clabe').set(userInput);
      // Input object must remain unmutated
      expect(userInput.bank.clabeFull).toBe('012345678901235678');

      const storedUser = (await store.firestore.collection('users').doc('u_clabe').get()).data();
      expect(storedUser.bank.clabeFull).toBeUndefined();
      expect(storedUser.bank.clabeLast4).toBe('5678');

      const allyInput = {
        allyId: 'ally_clabe',
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe: '012345678901234567',
          spei_clabe_full: '012345678901234567',
          spei_clabe_last4: '4567',
          spei_beneficiary_name: 'Mariscos Rulos SA de CV',
        },
      };

      await store.firestore.collection('allies').doc('ally_clabe').set(allyInput);
      expect(allyInput.payout_config.spei_clabe).toBe('012345678901234567');
      expect(allyInput.payout_config.spei_clabe_full).toBe('012345678901234567');

      const storedAlly = (await store.firestore.collection('allies').doc('ally_clabe').get()).data();
      expect(storedAlly.payout_config.spei_clabe_full).toBeUndefined();
      expect(storedAlly.payout_config.spei_clabe).toBeUndefined();
      expect(storedAlly.payout_config.spei_clabe_last4).toBe('4567');
    });

    it('allows spei_clabe_full inside restricted allies_private collection', async () => {
      await store.firestore.collection('allies_private').doc('ally_rulos').set({
        allyId: 'ally_rulos',
        spei_clabe_full: '012345678901234567',
        spei_clabe_last4: '4567',
      });

      const privDoc = (
        await store.firestore.collection('allies_private').doc('ally_rulos').get()
      ).data();
      expect(privDoc.spei_clabe_full).toBe('012345678901234567');
      expect(privDoc.spei_clabe_last4).toBe('4567');
    });
  });

  describe('Firebase config hooks (mock | emulator | sdk)', () => {
    it('supports mode mock, emulator, and sdk with clean resetFirebaseInstance and zero hardcoded secrets', () => {
      const mockFb = initializeFirebase({ mode: 'mock' });
      expect(mockFb.isMock).toBe(true);
      expect(mockFb.mode).toBe('mock');
      expect(getFirebaseInstance()).toBe(mockFb);

      resetFirebaseInstance();
      const emuFb = initializeFirebase({
        mode: 'emulator',
        emulatorConfig: { host: '127.0.0.1', firestorePort: 8080, authPort: 9099 },
      });
      expect(emuFb.isMock).toBe(false);
      expect(emuFb.mode).toBe('emulator');
      expect(emuFb.emulatorPorts.firestore).toBe(8080);

      resetFirebaseInstance();
      const sdkFb = initializeFirebase({
        mode: 'sdk',
        sdkConfig: {
          apiKey: 'test-public-api-key',
          projectId: 'hype-xperience-test',
          authDomain: 'hype-xperience-test.firebaseapp.com',
        },
      });
      expect(sdkFb.isMock).toBe(false);
      expect(sdkFb.mode).toBe('sdk');
      expect(sdkFb.sdkConfig?.projectId).toBe('hype-xperience-test');
    });
  });
});
