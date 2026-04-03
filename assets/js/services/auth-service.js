import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { state } from '../core/state.js';
import { getSecondaryAuthInstance } from './firebase-service.js';

export function subscribeAuth(callback) {
  return onAuthStateChanged(state.auth, callback);
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(state.auth, email, password);
}

export async function logoutCurrentUser() {
  if (!state.auth?.currentUser) return;
  return signOut(state.auth);
}


export async function registerResidentLoginAccountByAdmin({ email, password, displayName = '' }) {
  const safeEmail = String(email || '').trim();
  const safePassword = String(password || '');

  if (!safeEmail) throw new Error('Email is required');
  if (safePassword.length < 6) throw new Error('Password must be at least 6 characters');

  const secondaryAuth = getSecondaryAuthInstance();
  const credential = await createUserWithEmailAndPassword(secondaryAuth, safeEmail, safePassword);

  if (displayName) {
    try {
      await updateProfile(credential.user, { displayName });
    } catch (error) {
      console.warn('updateProfile failed', error);
    }
  }

  try {
    await signOut(secondaryAuth);
  } catch (error) {
    console.warn('secondary signOut failed', error);
  }

  return credential.user;
}
