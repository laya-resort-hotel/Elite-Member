
import { state, setMode } from './core/state.js';
import { highlightCurrentNav } from './core/app-shell.js';
import { initFirebaseServices } from './services/firebase-service.js';
import { subscribeAuth, touchLastLogin } from './services/auth-service.js';
import { loadResidentForUser, loadUserProfile } from './services/member-service.js';
import { showToast } from './ui/toast.js';
import { renderResidentCard, updateStatusLabels } from './ui/renderers.js';
import { bindFlipCards } from './ui/card-flip.js';

const page = document.body?.dataset?.page || 'index';
const contentType = document.body?.dataset?.contentType || '';
const PROTECTED_PAGES = new Set(['admin', 'members', 'resident', 'home', 'member', 'settings', 'redemption']);

function go(url) {
  const target = `./${url}`;
  if (window.location.href.endsWith(target) || window.location.pathname.endsWith(url)) return;
  window.location.href = target;
}

function emptyResident() {
  return {
    fullName: 'No member linked',
    tier: 'Elite Black',
    status: 'INACTIVE',
    residence: '-',
    memberCode: '-',
    publicCardCode: '-',
    points: 0,
    totalSpend: 0,
  };
}

async function initCurrentPage(isLive = false) {
  try {
    switch (page) {
      case 'index': {
        const { bindAuthPage } = await import('./pages/auth-page.js');
        bindAuthPage();
        break;
      }
      case 'signup': {
        const { bindSignupPage } = await import('./pages/signup-page.js');
        bindSignupPage();
        break;
      }
      case 'resident':
      case 'home':
      case 'member': {
        const mod = await import('./pages/resident-page.js');
        mod.bindResidentPage();
        await mod.loadResidentDashboard();
        break;
      }
      case 'redemption': {
        const mod = await import('./pages/redemption-page.js');
        await mod.loadRedemptionPage();
        break;
      }
      case 'settings': {
        renderResidentCard(state.currentResident || emptyResident());
        const btn = document.getElementById('changeLanguageBtn');
        if (btn && !btn.dataset.bound) {
          btn.dataset.bound = '1';
          btn.addEventListener('click', () => showToast('ระบบสลับภาษาจะทำต่อในรอบถัดไป'));
        }
        break;
      }
      case 'news':
      case 'promotions':
      case 'benefits': {
        const mod = await import('./pages/content-page.js');
        mod.applyContentPageState(contentType);
        mod.bindContentPage(contentType);
        await mod.loadContentPage(contentType);
        const note = document.getElementById('cmsReadOnlyNote');
        if (note) {
          note.textContent = isLive && ['admin', 'manager', 'staff'].includes(state.currentRole)
            ? 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลจริงผ่าน Firebase'
            : 'หน้านี้อ่านข้อมูลจาก Firebase เท่านั้น';
        }
        break;
      }
      case 'news-detail':
      case 'promotions-detail':
      case 'benefits-detail': {
        const mod = await import('./pages/detail-page.js');
        mod.bindDetailPage(contentType);
        await mod.loadDetailPage(contentType);
        break;
      }
      case 'admin': {
        const mod = await import('./pages/admin-page.js');
        mod.bindAdminPage();
        await mod.loadAdminDashboard();
        break;
      }
      case 'members': {
        const mod = await import('./pages/members-page.js');
        mod.bindMembersPage();
        await mod.loadMembersPage();
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Page init failed:', error);
    updateStatusLabels({ modeState: 'Page Error' });
    showToast(error?.message || 'Page init failed', 'error');
  }
}

async function renderPageForRole(role, user) {
  if (['admin', 'manager', 'staff'].includes(role)) {
    state.currentRole = role;
    state.currentResident = null;
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

async function handleSignedOut() {
  state.currentUser = null;
  state.currentRole = null;
  state.currentResident = null;
  state.memberCode = '';
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.classList.add('hidden');
  updateStatusLabels({ authState: 'Not signed in', modeState: 'auth' });
  setMode('auth');

  if (page === 'index') {
    await initCurrentPage(true);
    return;
  }

  if (PROTECTED_PAGES.has(page)) {
    showToast('กรุณา login ก่อนใช้งาน', 'error');
    go('index.html');
    return;
  }

  await initCurrentPage(true);
}

async function initApp() {
  highlightCurrentNav();
  bindFlipCards();
  updateStatusLabels({ firebaseState: 'Connecting...', authState: 'Checking...', modeState: 'Booting' });

  try {
    initFirebaseServices();
    updateStatusLabels({ firebaseState: 'Connected' });

    subscribeAuth(async (user) => {
      try {
        state.currentUser = user || null;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.classList.toggle('hidden', !user);

        if (!user) {
          await handleSignedOut();
          return;
        }

        updateStatusLabels({ authState: user.email || user.uid || 'Signed in' });
        await touchLastLogin(user.uid);
        const profile = await loadUserProfile(user.uid, user.email || '');
        state.memberCode = profile.publicCardCode || profile.memberCode || profile.memberId || '';
        await renderPageForRole(profile.role, user);
      } catch (callbackError) {
        console.error('Auth callback error:', callbackError);
        updateStatusLabels({ modeState: 'Auth Error' });
        showToast(callbackError?.message || 'Auth callback failed', 'error');
      }
    });
  } catch (error) {
    console.error('Firebase init failed:', error);
    updateStatusLabels({ firebaseState: 'Error', authState: '-', modeState: 'Firebase Error' });
    showToast(error?.message || 'Firebase init failed', 'error');
  }
}

initApp();
