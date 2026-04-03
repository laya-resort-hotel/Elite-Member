
import { $ } from '../core/dom.js';
import { state, setMode } from '../core/state.js';
import { loginWithEmail, logoutCurrentUser } from '../services/auth-service.js';
import { showToast } from '../ui/toast.js';
import { updateStatusLabels } from '../ui/renderers.js';
import { clearDemoMode, setDemoMode } from '../core/session.js';

function go(url) {
  window.location.href = url;
}

export function bindAuthPage() {
  if ($('loginBtn')) {
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
        clearDemoMode();
        await loginWithEmail(email, password);
        showToast('Login success');
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Login failed', 'error');
      }
    });
  }

  if ($('logoutBtn')) {
    $('logoutBtn').addEventListener('click', async () => {
      try {
        await logoutCurrentUser();
        clearDemoMode();
        setMode('auth');
        updateStatusLabels({ authState: 'Not signed in', modeState: 'auth' });
        go('./index.html');
      } catch (error) {
        showToast('Logout failed', 'error');
      }
    });
  }

  if ($('demoResidentBtn')) {
    $('demoResidentBtn').addEventListener('click', () => {
      setDemoMode('resident');
      go('./resident.html');
    });
  }

  if ($('demoAdminBtn')) {
    $('demoAdminBtn').addEventListener('click', () => {
      setDemoMode('admin');
      go('./admin.html');
    });
  }
}
