import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, useMock } from '../firebase';
import { mockAdminUser, mockUser } from '../mockData';
import type { AppUser } from '../types';

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (useMock) {
    if (email.toLowerCase().includes('admin')) return mockAdminUser;
    return { ...mockUser, email };
  }

  if (!auth || !db) throw new Error('Firebase is not configured.');

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return await getAppUserFromFirebaseUser(credential.user);
}

export async function signOut(): Promise<void> {
  if (useMock) return;
  if (!auth) return;
  await firebaseSignOut(auth);
}

export async function getAppUserFromFirebaseUser(user: User): Promise<AppUser> {
  if (useMock) {
    return { ...mockUser, uid: user.uid, email: user.email ?? mockUser.email };
  }

  if (!db) throw new Error('Firestore is not configured.');

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const fallbackUser: AppUser = {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? user.email ?? 'Resident User',
      role: 'resident',
      isActive: true
    };

    await setDoc(
      userRef,
      {
        ...fallbackUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return fallbackUser;
  }

  const data = snap.data() as Omit<AppUser, 'uid'>;
  return {
    uid: user.uid,
    email: data.email || user.email || '',
    displayName: data.displayName || user.displayName || 'Resident User',
    role: data.role || 'resident',
    residentId: data.residentId,
    isActive: data.isActive ?? true
  };
}
