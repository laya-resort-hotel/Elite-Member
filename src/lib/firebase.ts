import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyAncX8VGUjkegO4oLC6KWHAlWiSqhycVYw',
  authDomain: 'elite-black-card.firebaseapp.com',
  projectId: 'elite-black-card',
  storageBucket: 'elite-black-card.firebasestorage.app',
  messagingSenderId: '922581419999',
  appId: '1:922581419999:web:1d5fb7801e11cf2762666a',
  measurementId: 'G-JH9LJNE78M'
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId
};

function hasRequiredConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );
}

export const useMock = import.meta.env.VITE_USE_MOCK === 'true' || !hasRequiredConfig();
export const firebaseApp = useMock ? null : getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
