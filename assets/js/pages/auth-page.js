
import { $ } from '../core/dom.js';
import { state, setMode } from '../core/state.js';
import { loginWithEmail, logoutCurrentUser } from '../services/auth-service.js';
import { showToast } from '../ui/toast.js';
import { updateStatusLabels } from '../ui/renderers.js';

function go(url) {
  window.location.href = url;
}

export function bindAuthPage() {
  if ($('demoResidentBtn')) $('demoResidentBtn').classList.add('hidden');
  if ($('demoAdminBtn')) $('demoAdminBtn').classList.add('hidden');

  if ($('loginBtn') && !$('loginBtn').dataset.bound) {
    $('loginBtn').dataset.bound = '1';
    $('loginBtn').addEventListener('click', async () => {
      if (!state.firebaseReady) {
        showToast('Firebase not ready', 'error');
        return;
      }
      const email = $('loginEmail')?.value.trim();
      const password = $('loginPassword')?.value;
      if (!email || !password) {
        showToast('กรอก email และ password ก่อน', 'error');
        return;
      }
      try {
        await loginWithEmail(email, password);
        showToast('Login success');
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Login failed', 'error');
      }
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
