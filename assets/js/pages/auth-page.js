import { $ } from '../core/dom.js';
import { state, setMode } from '../core/state.js';
import { loginWithEmail, logoutCurrentUser } from '../services/auth-service.js';
import { setScreen } from '../ui/navigation.js';
import { showToast } from '../ui/toast.js';
import { updateStatusLabels } from '../ui/renderers.js';

export function bindAuthPage({ onDemoResident, onDemoAdmin }) {
  $('loginBtn').addEventListener('click', async () => {
    if (!state.firebaseReady) {
      showToast('Firebase not ready', 'error');
      return;
    }
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
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

  $('logoutBtn').addEventListener('click', async () => {
    try {
      await logoutCurrentUser();
      setMode('auth');
      updateStatusLabels({ authState: 'Not signed in', modeState: 'auth' });
      setScreen('screen-auth');
    } catch (error) {
      showToast('Logout failed', 'error');
    }
  });

  $('demoResidentBtn').addEventListener('click', onDemoResident);
  $('demoAdminBtn').addEventListener('click', onDemoAdmin);
}
