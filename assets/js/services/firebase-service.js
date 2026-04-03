import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';
import { firebaseConfig } from '../config/firebase-config.js';
import { state } from '../core/state.js';

export function initFirebaseServices() {
  state.app = initializeApp(firebaseConfig);
  state.db = getFirestore(state.app);
  state.auth = getAuth(state.app);
  state.storage = getStorage(state.app);
  state.firebaseReady = true;
  return state;
}


export function getSecondaryAuthInstance() {
  const secondaryName = 'admin-member-signup';
  const existing = getApps().find((app) => app.name === secondaryName);
  const secondaryApp = existing || initializeApp(firebaseConfig, secondaryName);
  return getAuth(secondaryApp);
}
