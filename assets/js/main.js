import { state, setMode } from './core/state.js';
import { highlightCurrentNav } from './core/app-shell.js';
import { initFirebaseServices } from './services/firebase-service.js';
import { subscribeAuth, touchLastLogin, logoutCurrentUser } from './services/auth-service.js';
import { loadResidentForUser, loadUserProfile } from './services/member-service.js';
import { showToast } from './ui/toast.js';
import { renderResidentCard, updateStatusLabels } from './ui/renderers.js';
import { bindFlipCards } from './ui/card-flip.js';
import { clearResidentJustLoggedIn, clearResidentSessionMode } from './core/session.js';
import { initLanguage, applyTranslations, openLanguagePicker, t } from './core/i18n.js';

const page = document.body?.dataset?.page || 'index';
initLanguage();
const contentType = document.body?.dataset?.contentType || '';
const ADMIN_PAGES = new Set(['admin', 'members', 'resident-management', 'invite-codes', 'resident-points']);
const RESIDENT_PAGES = new Set(['resident', 'home', 'member', 'settings', 'redemption', 'about', 'contact', 'faq']);
const RESIDENT_LOADER_PAGES = new Set(['resident-login', 'signup', 'resident', 'home', 'member', 'settings', 'redemption', 'about', 'contact', 'faq', 'news', 'promotions', 'benefits', 'news-detail', 'promotions-detail', 'benefits-detail']);
const pageBindings = new Set();

const LAYA_PWA_VERSION = '20260420-settings1';
let deferredInstallPrompt = null;

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
}

function isStandaloneApp() {
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
}

function rememberDeferredInstallPrompt(event) {
  deferredInstallPrompt = event;
  window.dispatchEvent(new CustomEvent('laya-pwa-install-available'));
}

function updatePwaStatusText() {
  const status = document.getElementById('pwaStatusText');
  const version = document.getElementById('pwaVersionText');
  if (version) version.textContent = `Version: ${LAYA_PWA_VERSION}`;
  if (!status) return;
  if (isStandaloneApp()) {
    status.textContent = 'Installed on this device. You can tap Update App Version to refresh to the newest build.';
    return;
  }
  if (deferredInstallPrompt) {
    status.textContent = 'Ready to install on this device. Tap Install LAYA Resident.';
    return;
  }
  if (isIosDevice()) {
    status.textContent = 'On iPhone/iPad, tap Install LAYA Resident to see Add to Home Screen instructions.';
    return;
  }
  status.textContent = 'If install is not ready yet, open this page in Chrome and use the app for a moment, then try again.';
}

async function promptInstallFromSettings() {
  if (isStandaloneApp()) {
    showToast('ติดตั้ง LAYA Resident บนเครื่องนี้แล้ว', 'success');
    updatePwaStatusText();
    return;
  }

  if (deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (error) {
      console.warn('Install prompt failed:', error);
    }
    window.setTimeout(updatePwaStatusText, 300);
    return;
  }

  if (isIosDevice()) {
    window.alert('ติดตั้ง LAYA Resident\n\nบน iPhone / iPad ให้กดปุ่ม Share ของ Safari แล้วเลือก Add to Home Screen');
    return;
  }

  showToast('ระบบยังไม่เปิด install prompt ในตอนนี้ ลองเปิดผ่าน Chrome แล้วใช้งานหน้าเว็บสักครู่ก่อนกดใหม่', 'error');
}

async function refreshPwaVersion() {
  const registration = await navigator.serviceWorker?.getRegistration?.();
  if (registration) {
    await registration.update().catch(() => undefined);
    if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    if (registration.installing) {
      registration.installing.addEventListener('statechange', () => {
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => /^laya-/i.test(key)).map((key) => caches.delete(key)));
  }

  const url = new URL(window.location.href);
  url.searchParams.set('refresh', Date.now().toString());
  window.location.replace(url.toString());
}

function bindSettingsPwaControls() {
  const installBtn = document.getElementById('installAppBtn');
  const updateBtn = document.getElementById('updateAppBtn');

  if (installBtn && !installBtn.dataset.bound) {
    installBtn.dataset.bound = '1';
    installBtn.addEventListener('click', async () => {
      installBtn.disabled = true;
      try {
        await promptInstallFromSettings();
      } finally {
        installBtn.disabled = false;
        updatePwaStatusText();
      }
    });
  }

  if (updateBtn && !updateBtn.dataset.bound) {
    updateBtn.dataset.bound = '1';
    updateBtn.addEventListener('click', async () => {
      const original = updateBtn.querySelector('span:last-child')?.textContent || 'Update App Version';
      updateBtn.disabled = true;
      const label = updateBtn.querySelector('span:last-child');
      if (label) label.textContent = 'Updating...';
      try {
        showToast('กำลังอัปเดตเวอร์ชันล่าสุด...', 'success');
        await refreshPwaVersion();
      } catch (error) {
        console.error('Update app failed:', error);
        showToast(error?.message || 'Update app failed', 'error');
      } finally {
        updateBtn.disabled = false;
        if (label) label.textContent = original;
      }
    });
  }

  updatePwaStatusText();
  window.addEventListener('laya-pwa-install-available', updatePwaStatusText);
  window.addEventListener('appinstalled', () => {
    showToast('ติดตั้ง LAYA Resident สำเร็จ', 'success');
    updatePwaStatusText();
  }, { once: true });
}

function registerPwaSupport() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    rememberDeferredInstallPrompt(event);
  });

  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`./sw.js?v=${LAYA_PWA_VERSION}`);
      if (typeof registration.update === 'function') {
        registration.update().catch(() => undefined);
      }
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      updatePwaStatusText();
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }, { once: true });
}

const RESIDENT_LOADER_MIN_MS = 900;
let residentLoaderShownAt = 0;
let residentLoaderHideTimer = null;

function pageUsesResidentLoader() {
  return RESIDENT_LOADER_PAGES.has(page);
}

function showResidentLoader() {
  const loader = document.getElementById('residentRouteLoader');
  if (!loader) return;
  if (residentLoaderHideTimer) {
    window.clearTimeout(residentLoaderHideTimer);
    residentLoaderHideTimer = null;
  }
  residentLoaderShownAt = window.performance?.now?.() || Date.now();
  loader.classList.remove('is-hidden');
  document.documentElement.classList.add('resident-loader-active');
}

function hideResidentLoader() {
  const loader = document.getElementById('residentRouteLoader');
  if (!loader) return;
  const now = window.performance?.now?.() || Date.now();
  const elapsed = residentLoaderShownAt ? now - residentLoaderShownAt : RESIDENT_LOADER_MIN_MS;
  const delay = Math.max(0, RESIDENT_LOADER_MIN_MS - elapsed);
  if (residentLoaderHideTimer) window.clearTimeout(residentLoaderHideTimer);
  residentLoaderHideTimer = window.setTimeout(() => {
    loader.classList.add('is-hidden');
    document.documentElement.classList.remove('resident-loader-active');
    residentLoaderHideTimer = null;
  }, delay);
}

function bindResidentLoaderNavigation() {
  if (!pageUsesResidentLoader() || document.body?.dataset?.residentLoaderBound === '1') return;
  document.body.dataset.residentLoaderBound = '1';

  document.addEventListener('click', (event) => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    if (anchor.hasAttribute('download') || anchor.target === '_blank' || anchor.dataset.noLoader === '1') return;
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      showResidentLoader();
    } catch (_) {
      /* no-op */
    }
  }, true);

  window.addEventListener('beforeunload', () => {
    showResidentLoader();
  });

  window.__showResidentLoader = showResidentLoader;
  window.__hideResidentLoader = hideResidentLoader;
}

function bindPageOnce(key, binder) {
  if (!key || typeof binder !== 'function' || pageBindings.has(key)) return;
  binder();
  pageBindings.add(key);
}

function getSignedOutTarget() {
  if (state.currentRole === 'resident' || page === 'resident-login' || RESIDENT_PAGES.has(page)) {
    return 'resident-login.html';
  }
  return 'index.html';
}

function syncAuthActionButtons(user) {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.classList.toggle('hidden', !user);

  const residentLoginBtn = document.getElementById('residentLoginBtn');
  if (residentLoginBtn) residentLoginBtn.classList.toggle('hidden', !!user);
}

function bindGlobalLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn || logoutBtn.dataset.bound) return;

  logoutBtn.dataset.bound = '1';
  logoutBtn.addEventListener('click', async () => {
    try {
      logoutBtn.disabled = true;
      await logoutCurrentUser();
      clearResidentJustLoggedIn();
      clearResidentSessionMode();
      state.currentUser = null;
      state.currentRole = null;
      state.currentResident = null;
      state.memberCode = '';
      state.residentId = '';
      setMode('auth');
      updateStatusLabels({ authState: 'Not signed in', modeState: 'auth' });
      go(getSignedOutTarget());
    } catch (error) {
      console.error('Logout failed:', error);
      showToast(error?.message || 'Logout failed', 'error');
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

function go(url) {
  const target = `./${url}`;
  if (window.location.href.endsWith(target) || window.location.pathname.endsWith(url)) return;
  if (pageUsesResidentLoader()) showResidentLoader();
  window.location.href = target;
}

function emptyResident() {
  return {
    fullName: t('common.residentMember'),
    tier: 'Elite Black',
    status: 'INACTIVE',
    residence: '-',
    memberCode: '-',
    publicCardCode: '-',
    qrCodeValue: '-',
    cardNumber: '-',
    points: 0,
    totalSpend: 0,
    pendingPoints: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    email: '',
  };
}

async function initCurrentPage(isLive = false) {
  try {
    switch (page) {
      case 'index': {
        const { bindAuthPage } = await import('./pages/auth-page.js');
        bindPageOnce('index', bindAuthPage);
        break;
      }
      case 'signup': {
        const { bindSignupPage } = await import('./pages/signup-page.js');
        bindPageOnce('signup', bindSignupPage);
        break;
      }
      case 'resident-login': {
        const { bindResidentLoginPage } = await import('./pages/resident-login-page.js');
        bindPageOnce('resident-login', bindResidentLoginPage);
        break;
      }
      case 'resident':
      case 'home':
      case 'member': {
        const mod = await import('./pages/resident-page.js?v=20260405promoall1');
        bindPageOnce(page, mod.bindResidentPage);
        await mod.loadResidentDashboard();
        break;
      }
      case 'redemption': {
        const mod = await import('./pages/redemption-page.js?v=20260405cms4b');
        await mod.loadRedemptionPage();
        break;
      }

case 'settings': {
  renderResidentCard(state.currentResident || emptyResident());
  const btn = document.getElementById('changeLanguageBtn');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => openLanguagePicker());
  }
  bindSettingsPwaControls();
  break;
}
case 'about':
case 'contact':
case 'faq': {
  renderResidentCard(state.currentResident || emptyResident());
  const mod = await import('./pages/static-page.js?v=20260405static1');
  await mod.loadStaticPage(page);
  break;
}
      case 'news':
      case 'promotions':
      case 'benefits': {
        const mod = await import('./pages/content-page.js?v=20260405cms4b');
        mod.applyContentPageState(contentType);
        bindPageOnce(`content:${page}:${contentType}`, () => mod.bindContentPage(contentType));
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
        const mod = await import('./pages/detail-page.js?v=20260405cms4b');
        bindPageOnce(`detail:${page}:${contentType}`, () => mod.bindDetailPage(contentType));
        await mod.loadDetailPage(contentType);
        break;
      }
      case 'admin': {
        const mod = await import('./pages/admin-page.js?v=20260405static1');
        bindPageOnce('admin', mod.bindAdminPage);
        await mod.loadAdminDashboard();
        break;
      }
      case 'invite-codes': {
        const mod = await import('./pages/admin-page.js?v=20260405static1');
        bindPageOnce('invite-codes', mod.bindInviteCodeManagerPage);
        await mod.loadInviteCodeManagerPage();
        break;
      }
      case 'members': {
        const mod = await import('./pages/members-page.js');
        bindPageOnce('members', mod.bindMembersPage);
        await mod.loadMembersPage();
        break;
      }
      case 'resident-management': {
        const mod = await import('./pages/resident-management-page.js');
        bindPageOnce('resident-management', mod.bindResidentManagementPage);
        await mod.loadResidentManagementPage();
        break;
      }
      case 'resident-points': {
        const mod = await import('./pages/resident-points-page.js?v=20260405rewardcode2');
        bindPageOnce('resident-points', mod.bindResidentPointScannerPage);
        await mod.loadResidentPointScannerPage();
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Page init failed:', error);
    updateStatusLabels({ modeState: 'Page Error' });
    showToast(error?.message || error?.toString?.() || 'Page init failed', 'error');
  } finally {
    applyTranslations(page);
    hideResidentLoader();
  }
}

async function renderPageForRole(role, user, profile = {}) {
  if (['admin', 'manager', 'staff'].includes(role)) {
    state.currentRole = role;
    state.currentResident = null;
    setMode('admin-live');
    updateStatusLabels({ modeState: 'admin-live' });
    if (page === 'index' || page === 'resident-login' || RESIDENT_PAGES.has(page)) {
      go('admin.html');
      return;
    }
    await initCurrentPage(true);
    return;
  }

  state.currentRole = role || 'resident';
  state.currentProfile = profile || null;
  state.currentResident = await loadResidentForUser(user.uid, user.email, profile);
  setMode('resident-live');
  updateStatusLabels({ modeState: 'resident-live' });

  if (!state.currentResident && RESIDENT_PAGES.has(page)) {
    showToast('บัญชีนี้ยังไม่ได้ link กับ Resident profile ในระบบ', 'error');
  }

  if (page === 'index') {
    go('home.html');
    return;
  }
  if (ADMIN_PAGES.has(page)) {
    showToast('บัญชีนี้ไม่มีสิทธิ์เข้า Admin Dashboard', 'error');
    go('home.html');
    return;
  }
  await initCurrentPage(true);
}

async function handleSignedOut() {
  clearResidentJustLoggedIn();
  state.currentUser = null;
  state.currentRole = null;
  state.currentResident = null;
  state.currentProfile = null;
  state.memberCode = '';
  state.residentId = '';
  syncAuthActionButtons(null);
  updateStatusLabels({ authState: 'Not signed in', modeState: 'auth' });
  setMode('auth');

  if (page === 'index' || page === 'resident-login') {
    await initCurrentPage(true);
    return;
  }

  if (ADMIN_PAGES.has(page)) {
    showToast('กรุณา login ก่อนใช้งานหลังบ้าน', 'error');
    go('index.html');
    return;
  }

  if (RESIDENT_PAGES.has(page)) {
    showToast('กรุณา log in ผ่านหน้า Resident ก่อนใช้งาน', 'error');
    go('resident-login.html');
    return;
  }

  await initCurrentPage(true);
}

async function initApp() {
  highlightCurrentNav();
  bindFlipCards();
  bindGlobalLogout();
  bindResidentLoaderNavigation();
  if (pageUsesResidentLoader()) showResidentLoader();
  updateStatusLabels({ firebaseState: 'Connecting...', authState: 'Checking...', modeState: 'Booting' });

  try {
    initFirebaseServices();
    updateStatusLabels({ firebaseState: 'Connected' });

    subscribeAuth(async (user) => {
      try {
        state.currentUser = user || null;
        syncAuthActionButtons(user);

        if (!user) {
          await handleSignedOut();
          return;
        }

        updateStatusLabels({ authState: user.email || user.uid || 'Signed in' });
        await touchLastLogin(user.uid);
        const profile = await loadUserProfile(user.uid, user.email || '');
        state.memberCode = profile.publicCardCode || profile.memberCode || profile.memberId || '';
        state.residentId = profile.residentId || '';
        await renderPageForRole(profile.role, user, profile);
      } catch (callbackError) {
        console.error('Auth callback error:', callbackError);
        updateStatusLabels({ modeState: 'Auth Error' });
        showToast(callbackError?.message || callbackError?.toString?.() || 'Auth callback failed', 'error');
        hideResidentLoader();
      }
    });
  } catch (error) {
    console.error('Firebase init failed:', error);
    updateStatusLabels({ firebaseState: 'Error', authState: '-', modeState: 'Firebase Error' });
    showToast(error?.message || error?.toString?.() || 'Firebase init failed', 'error');
    hideResidentLoader();
  }
}

registerPwaSupport();

initApp();
