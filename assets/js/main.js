
import { $ } from './core/dom.js';
import { state, setMode } from './core/state.js';
import { getDemoMode, clearDemoMode } from './core/session.js';
import { highlightCurrentNav } from './core/app-shell.js';
import { initFirebaseServices } from './services/firebase-service.js';
import { subscribeAuth } from './services/auth-service.js';
import { loadResidentForUser, loadUserProfile } from './services/member-service.js';
import { showToast } from './ui/toast.js';
import { updateStatusLabels } from './ui/renderers.js';
import { bindAuthPage } from './pages/auth-page.js';
import { bindResidentPage, loadResidentDashboard, openDemoResident } from './pages/resident-page.js';
import { loadRedemptionPage } from './pages/redemption-page.js';
import { bindAdminPage, loadAdminDashboard, openDemoAdmin } from './pages/admin-page.js';
import { applyContentPageState, bindContentPage, loadContentPage } from './pages/content-page.js';
import { bindDetailPage, loadDetailPage } from './pages/detail-page.js';
import { bindMembersPage, loadMembersPage } from './pages/members-page.js';
import { bindFlipCards } from './ui/card-flip.js';

const page = document.body?.dataset?.page || 'index';
const contentType = document.body?.dataset?.contentType || '';

function go(url) {
  if (window.location.pathname.endsWith(url)) return;
  window.location.href = `./${url}`;
}

async function renderPageForRole(role, user) {
  if (['admin', 'manager', 'staff'].includes(role)) {
    state.currentRole = role;
    setMode('admin-live');
    updateStatusLabels({ modeState: 'admin-live' });
    if (page === 'index') {
      go('admin.html');
      return;
    }
    await initCurrentPage(true);
    return;
  }

  state.currentRole = role || 'resident';
  state.currentResident = await loadResidentForUser(user.uid, user.email, state.memberCode);
  setMode('resident-live');
  updateStatusLabels({ modeState: 'resident-live' });
  if (page === 'index') {
    go('home.html');
    return;
  }
  await initCurrentPage(true);
}

async function initCurrentPage(isLive = false) {
  switch (page) {
    case 'index':
      break;
    case 'resident':
    case 'home':
    case 'member':
      bindResidentPage();
      if (isLive) await loadResidentDashboard();
      else openDemoResident();
      break;
    case 'redemption':
      await loadRedemptionPage();
      break;
    case 'settings':
      if ($('changeLanguageBtn')) {
        $('changeLanguageBtn').addEventListener('click', () => showToast('ระบบสลับภาษาจะทำต่อได้ในรอบถัดไป'));
      }
      break;
    case 'news':
    case 'promotions':
    case 'benefits':
      applyContentPageState(contentType);
      bindContentPage(contentType);
      await loadContentPage(contentType);
      if ($('cmsReadOnlyNote')) {
        $('cmsReadOnlyNote').textContent = isLive && ['admin', 'manager', 'staff'].includes(state.currentRole)
          ? 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลจริงผ่าน Firebase'
          : 'หน้านี้อ่านข้อมูลได้ แต่การบันทึกจะใช้ได้เมื่อ login เป็น admin/staff';
      }
      break;
    case 'news-detail':
    case 'promotions-detail':
    case 'benefits-detail':
      bindDetailPage(contentType);
      await loadDetailPage(contentType);
      break;
    case 'admin':
      bindAdminPage();
      if (isLive) await loadAdminDashboard();
      else openDemoAdmin();
      break;
    case 'members':
      bindMembersPage();
      await loadMembersPage();
      break;
    default:
      break;
  }
}

async function initApp() {
  highlightCurrentNav();
  bindAuthPage();
  bindFlipCards();

  try {
    initFirebaseServices();
    updateStatusLabels({ firebaseState: 'Connected' });

    subscribeAuth(async (user) => {
      state.currentUser = user;
      updateStatusLabels({ authState: user?.email || 'Not signed in' });
      if ($('logoutBtn')) $('logoutBtn').classList.toggle('hidden', !user && !getDemoMode());

      if (!user) {
        const demoMode = getDemoMode();
        if (demoMode === 'admin') {
          state.currentRole = 'admin';
          setMode('demo-admin');
          updateStatusLabels({ modeState: 'demo-admin' });
          await initCurrentPage(false);
          return;
        }
        if (demoMode === 'resident') {
          state.currentRole = 'resident';
          setMode('demo-resident');
          updateStatusLabels({ modeState: 'demo-resident' });
          await initCurrentPage(false);
          return;
        }
        setMode(page === 'index' ? 'auth' : 'guest');
        updateStatusLabels({ modeState: page === 'index' ? 'auth' : 'guest' });
        await initCurrentPage(false);
        return;
      }

      clearDemoMode();
      const profile = await loadUserProfile(user.uid, user.email);
      state.memberCode = profile.memberCode || '';
      await renderPageForRole(profile.role, user);
    });
  } catch (error) {
    console.error(error);
    updateStatusLabels({ firebaseState: 'Error' });
    showToast('Firebase init failed, using demo mode', 'error');
    await initCurrentPage(false);
  }
}

initApp();
