import { $ } from './core/dom.js';
import { state, setMode } from './core/state.js';
import { initFirebaseServices } from './services/firebase-service.js';
import { subscribeAuth } from './services/auth-service.js';
import { loadResidentForUser, loadUserProfile } from './services/member-service.js';
import { bindScreenButtons, setScreen } from './ui/navigation.js';
import { showToast } from './ui/toast.js';
import { renderCards, renderResidentCard, renderTable, updateStatusLabels } from './ui/renderers.js';
import { demoBenefits, demoNews, demoPromotions, demoResident, demoTransactions } from './data/demo.js';
import { bindAuthPage } from './pages/auth-page.js';
import { bindResidentPage, loadResidentDashboard, openDemoResident } from './pages/resident-page.js';
import { bindAdminPage, loadAdminDashboard, openDemoAdmin } from './pages/admin-page.js';

function bootstrapStaticData() {
  renderResidentCard(demoResident);
  renderCards($('benefitsList'), demoBenefits);
  renderCards($('newsList'), demoNews);
  renderCards($('promoList'), demoPromotions);
  renderTable($('transactionsTable'), demoTransactions);
  setScreen('screen-auth');
  updateStatusLabels({ modeState: 'Auth' });
}

async function initApp() {
  bootstrapStaticData();
  bindScreenButtons();
  bindAuthPage({ onDemoResident: openDemoResident, onDemoAdmin: openDemoAdmin });
  bindResidentPage();
  bindAdminPage();

  try {
    initFirebaseServices();
    updateStatusLabels({ firebaseState: 'Connected' });

    subscribeAuth(async (user) => {
      state.currentUser = user;
      updateStatusLabels({ authState: user?.email || 'Not signed in' });
      $('loginBtn').classList.toggle('hidden', !!user);
      $('logoutBtn').classList.toggle('hidden', !user);

      if (!user) {
        if (state.currentMode.includes('live')) {
          setMode('auth');
          updateStatusLabels({ modeState: 'auth' });
          setScreen('screen-auth');
        }
        return;
      }

      const profile = await loadUserProfile(user.uid, user.email);
      if (['admin', 'manager', 'staff'].includes(profile.role)) {
        state.currentRole = profile.role;
        setMode('admin-live');
        updateStatusLabels({ modeState: 'admin-live' });
        setScreen('screen-admin');
        await loadAdminDashboard();
      } else {
        state.currentRole = profile.role || 'resident';
        state.currentResident = await loadResidentForUser(user.uid, user.email, profile.memberCode);
        setMode('resident-live');
        updateStatusLabels({ modeState: 'resident-live' });
        setScreen('screen-resident');
        await loadResidentDashboard();
      }
    });
  } catch (error) {
    console.error(error);
    updateStatusLabels({ firebaseState: 'Error' });
    showToast('Firebase init failed, using demo mode', 'error');
  }
}

initApp();
