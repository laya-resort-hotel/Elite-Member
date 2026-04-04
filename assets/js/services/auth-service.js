import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { doc, setDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js?v=20260405residentlux2';
import { setResidentSessionMode } from '../core/session.js?v=20260405residentlux2';

const EMPLOYEE_DOMAIN = 'employee.layaresident.local';

export function subscribeAuth(callback) {
  return onAuthStateChanged(state.auth, callback);
}

export function employeeIdToEmail(employeeId) {
  const normalized = String(employeeId || '').trim().toLowerCase();
  if (!normalized) throw new Error('Employee ID is required');
  if (normalized.includes('@')) return normalized;
  return `${normalized}@${EMPLOYEE_DOMAIN}`;
}

export function normalizeLoginIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (!value) throw new Error('Login identifier is required');
  if (value.includes('@')) return value.toLowerCase();
  return employeeIdToEmail(value);
}

export async function loginWithEmail(identifier, password, options = {}) {
  if (!state.firebaseReady || !state.auth) {
    throw new Error('Firebase Auth is not ready');
  }

  const { rememberMe = false } = options;
  const email = normalizeLoginIdentifier(identifier);

  await setPersistence(state.auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  setResidentSessionMode(rememberMe ? 'local' : 'session');
  return signInWithEmailAndPassword(state.auth, email, password);
}

export async function sendLoginResetEmail(identifier) {
  if (!state.firebaseReady || !state.auth) {
    throw new Error('Firebase Auth is not ready');
  }
  const email = normalizeLoginIdentifier(identifier);
  await sendPasswordResetEmail(state.auth, email);
  return email;
}

export async function signUpWithEmployeeId({ employeeId, fullName, password }) {
  if (!state.firebaseReady || !state.auth || !state.db) {
    throw new Error('Firebase is not ready');
  }

  const cleanedEmployeeId = String(employeeId || '').trim();
  if (!cleanedEmployeeId) throw new Error('Employee ID is required');
  if (!fullName || !String(fullName).trim()) throw new Error('Full name is required');
  if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters');

  const email = employeeIdToEmail(cleanedEmployeeId);
  const cred = await createUserWithEmailAndPassword(state.auth, email, password);

  try {
    await updateProfile(cred.user, { displayName: String(fullName || '').trim() });
  } catch (error) {
    console.warn('profile update failed', error);
  }

  const userRef = doc(state.db, 'users', cred.user.uid);
  await setDoc(userRef, {
    uid: cred.user.uid,
    displayName: String(fullName || '').trim(),
    email,
    role: 'staff',
    employeeId: cleanedEmployeeId,
    memberId: null,
    publicCardCode: '',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }, { merge: true });

  return cred;
}

export async function touchLastLogin(uid) {
  if (!uid || !state.db) return;
  try {
    await updateDoc(doc(state.db, 'users', uid), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('touchLastLogin failed', error);
  }
}

export async function logoutCurrentUser() {
  if (!state.auth?.currentUser) return;
  return signOut(state.auth);
}
