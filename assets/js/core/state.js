export const state = {
  app: null,
  db: null,
  auth: null,
  storage: null,
  firebaseReady: false,
  currentUser: null,
  currentRole: null,
  currentResident: null,
  currentMode: 'auth',
  memberCode: '',
  residentId: '',
};

export function setMode(mode) {
  state.currentMode = mode;
}
