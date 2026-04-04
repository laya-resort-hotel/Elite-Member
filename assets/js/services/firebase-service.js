import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';
import { firebaseConfig } from '../config/firebase-config.js?v=20260404fix5';
import { state } from '../core/state.js?v=20260404fix5';

export function initFirebaseServices() {
  state.app = initializeApp(firebaseConfig);
  state.db = getFirestore(state.app);
  state.auth = getAuth(state.app);
  state.storage = getStorage(state.app);
  state.firebaseReady = true;
  return state;
}
