
const KEY = 'layaDemoMode';

export function setDemoMode(mode) {
  sessionStorage.setItem(KEY, mode);
}

export function getDemoMode() {
  return sessionStorage.getItem(KEY) || '';
}

export function clearDemoMode() {
  sessionStorage.removeItem(KEY);
}
