const DEMO_MODE_KEY = 'layaDemoMode';
const RESIDENT_REMEMBER_KEY = 'layaResidentRemember';
const RESIDENT_EMAIL_KEY = 'layaResidentLoginEmail';
const RESIDENT_SESSION_MODE_KEY = 'layaResidentSessionMode';
const RESIDENT_JUST_LOGGED_IN_KEY = 'layaResidentJustLoggedIn';

export function setDemoMode(mode) {
  sessionStorage.setItem(DEMO_MODE_KEY, mode);
}

export function getDemoMode() {
  return sessionStorage.getItem(DEMO_MODE_KEY) || '';
}

export function clearDemoMode() {
  sessionStorage.removeItem(DEMO_MODE_KEY);
}

export function saveResidentLoginPreference({ rememberMe = false, email = '' } = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (rememberMe) {
    localStorage.setItem(RESIDENT_REMEMBER_KEY, '1');
    if (normalizedEmail) localStorage.setItem(RESIDENT_EMAIL_KEY, normalizedEmail);
  } else {
    localStorage.removeItem(RESIDENT_REMEMBER_KEY);
    localStorage.removeItem(RESIDENT_EMAIL_KEY);
  }
}

export function getResidentLoginPreference() {
  return {
    rememberMe: localStorage.getItem(RESIDENT_REMEMBER_KEY) === '1',
    email: localStorage.getItem(RESIDENT_EMAIL_KEY) || '',
  };
}

export function setResidentSessionMode(mode = '') {
  const normalizedMode = String(mode || '').trim().toLowerCase();
  localStorage.removeItem(RESIDENT_SESSION_MODE_KEY);
  sessionStorage.removeItem(RESIDENT_SESSION_MODE_KEY);

  if (!normalizedMode) return;
  if (normalizedMode === 'local') {
    localStorage.setItem(RESIDENT_SESSION_MODE_KEY, 'local');
    return;
  }
  sessionStorage.setItem(RESIDENT_SESSION_MODE_KEY, 'session');
}

export function getResidentSessionMode() {
  return localStorage.getItem(RESIDENT_SESSION_MODE_KEY)
    || sessionStorage.getItem(RESIDENT_SESSION_MODE_KEY)
    || '';
}

export function clearResidentSessionMode() {
  localStorage.removeItem(RESIDENT_SESSION_MODE_KEY);
  sessionStorage.removeItem(RESIDENT_SESSION_MODE_KEY);
}

export function markResidentJustLoggedIn() {
  sessionStorage.setItem(RESIDENT_JUST_LOGGED_IN_KEY, '1');
}

export function consumeResidentJustLoggedIn() {
  const flag = sessionStorage.getItem(RESIDENT_JUST_LOGGED_IN_KEY) === '1';
  sessionStorage.removeItem(RESIDENT_JUST_LOGGED_IN_KEY);
  return flag;
}

export function clearResidentJustLoggedIn() {
  sessionStorage.removeItem(RESIDENT_JUST_LOGGED_IN_KEY);
}
