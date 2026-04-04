import { $ } from '../core/dom.js?v=20260404fix5';
import { state } from '../core/state.js?v=20260404fix5';
import { loginWithEmail } from '../services/auth-service.js?v=20260404fix5';
import { showToast } from '../ui/toast.js?v=20260404fix5';

function attemptLogin() {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }

  const identifier = $('residentLoginIdentifier')?.value.trim();
  const password = $('residentLoginPassword')?.value;

  if (!identifier || !password) {
    showToast('กรอก Email และ Password ก่อน', 'error');
    return;
  }

  loginWithEmail(identifier, password)
    .then(() => showToast('Resident login success'))
    .catch((error) => {
      console.error(error);
      showToast(error?.message || 'Resident login failed', 'error');
    });
}

export function bindResidentLoginPage() {
  const loginBtn = $('residentLoginSubmitBtn');
  if (loginBtn && !loginBtn.dataset.bound) {
    loginBtn.dataset.bound = '1';
    loginBtn.addEventListener('click', attemptLogin);
  }

  const password = $('residentLoginPassword');
  if (password && !password.dataset.bound) {
    password.dataset.bound = '1';
    password.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') attemptLogin();
    });
  }

  const email = $('residentLoginIdentifier');
  if (email && !email.dataset.bound) {
    email.dataset.bound = '1';
    email.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') attemptLogin();
    });
  }
}
