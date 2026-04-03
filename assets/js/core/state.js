export const state = {
  app: null,
  db: null,
  auth: null,
  firebaseReady: false,
  currentUser: null,
  currentRole: null,
  currentResident: null,
  currentMode: 'auth',
};

export function setMode(mode) {
  state.currentMode = mode;
}
