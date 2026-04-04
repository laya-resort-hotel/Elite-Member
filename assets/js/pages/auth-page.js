import { $ } from '../core/dom.js?v=20260404fix4';
import { state, setMode } from '../core/state.js?v=20260404fix4';
import { loginWithEmail, logoutCurrentUser } from '../services/auth-service.js?v=20260404fix4';
import { showToast } from '../ui/toast.js?v=20260404fix4';
import { updateStatusLabels } from '../ui/renderers.js?v=20260404fix4';

function go(url) {
  window.location.href = url;
}

export function bindAuthPage() {
  if ($('loginBtn') && !$('loginBtn').dataset.bound) {
    $('loginBtn').dataset.bound = '1';
    $('loginBtn').addEventListener('click', async () => {
      if (!state.firebaseReady) {
        showToast('Firebase not ready', 'error');
        return;
      }
      const identifier = $('loginEmail')?.value.trim();
      const password = $('loginPassword')?.value;
      if (!identifier || !password) {
        showToast('กรอกรหัสพนักงานหรือ email และ password ก่อน', 'error');
        return;
      }
      try {
        await loginWithEmail(identifier, password);
        showToast('Login success');
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Login failed', 'error');
      }
    });
  }

  if ($('goSignupBtn') && !$('goSignupBtn').dataset.bound) {
    $('goSignupBtn').dataset.bound = '1';
    $('goSignupBtn').addEventListener('click', () => {
      go('./signup.html');
    });
  }

  if ($('logoutBtn') && !$('logoutBtn').dataset.bound) {
    $('logoutBtn').dataset.bound = '1';
    $('logoutBtn').addEventListener('click', async () => {
      try {
        await logoutCurrentUser();
        setMode('auth');
        updateStatusLabels({ authState: 'Not signed in', modeState: 'auth' });
        go('./index.html');
      } catch (error) {
        console.error(error);
        showToast('Logout failed', 'error');
      }
    });
  }
}
