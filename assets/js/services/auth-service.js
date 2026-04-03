import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { state } from '../core/state.js';

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
