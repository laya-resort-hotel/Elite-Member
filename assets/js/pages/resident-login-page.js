import { $ } from '../core/dom.js?v=20260405residentlux2';
import { state } from '../core/state.js?v=20260405residentlux2';
import { loginWithEmail, sendLoginResetEmail } from '../services/auth-service.js?v=20260405residentlux2';
import {
  getResidentLoginPreference,
  saveResidentLoginPreference,
  getResidentSessionMode,
  markResidentJustLoggedIn,
  consumeResidentJustLoggedIn,
} from '../core/session.js?v=20260405residentlux2';
import { showToast } from '../ui/toast.js?v=20260404fix5';

function setText(id, value) {
  const node = $(id);
  if (node) node.textContent = value;
}

function toggleHidden(id, hidden) {
  const node = $(id);
  if (node) node.classList.toggle('hidden', !!hidden);
}

function setSessionAppearance(active) {
  const shell = $('residentLoginShell');
  if (!shell) return;
  shell.classList.toggle('is-session-live', !!active);
  shell.classList.toggle('is-session-empty', !active);
}

function renderRememberState() {
  const pref = getResidentLoginPreference();
  const remember = $('residentRememberMe');
  const email = $('residentLoginIdentifier');
  if (remember) remember.checked = !!pref.rememberMe;
  if (email && pref.email && !email.value.trim()) email.value = pref.email;
}

function renderSessionCard() {
  const activeResident = state.currentUser && state.currentRole === 'resident';
  const resident = state.currentResident || {};
  const sessionMode = getResidentSessionMode();
  const sessionLabel = sessionMode === 'local'
    ? 'Remember Me · ใช้งานต่อเนื่องบนอุปกรณ์นี้'
    : 'Session only · อยู่ได้จนกว่าจะปิดเบราว์เซอร์';

  setSessionAppearance(activeResident);
  toggleHidden('residentSessionCard', !activeResident);
  toggleHidden('residentSessionEmptyCard', activeResident);
  toggleHidden('residentSessionActions', !activeResident);

  setText('residentSessionStatus', activeResident ? 'Session Active' : 'No Active Session');
  setText('residentSessionName', resident.fullName || resident.displayName || state.currentUser?.displayName || 'Resident Member');
  setText('residentSessionEmail', state.currentUser?.email || resident.loginEmail || resident.email || '-');
  setText('residentSessionMode', activeResident ? sessionLabel : 'ยังไม่มี session ของ Resident ในอุปกรณ์นี้');
  setText('residentSessionCode', resident.memberCode || resident.qrCodeValue || resident.cardNumber || '-');
  setText('residentSessionResidence', resident.residence || resident.primaryUnitCode || '-');

  const submitBtn = $('residentLoginSubmitBtn');
  if (submitBtn) submitBtn.textContent = activeResident ? 'Switch account' : 'Log in';

  const loginHint = $('residentLoginHint');
  if (loginHint) {
    loginHint.textContent = activeResident
      ? 'ขณะนี้มี Resident session อยู่แล้ว คุณสามารถกด Continue to Home หรือใช้ฟอร์มนี้เพื่อสลับบัญชีได้'
      : 'ใช้ Email และ Password ของลูกค้า Resident ที่ผูกไว้ใน Firebase Authentication';
  }

  const forgotHint = $('forgotPasswordHelper');
  if (forgotHint) {
    forgotHint.textContent = activeResident
      ? 'หากต้องการเปลี่ยนรหัสผ่านของบัญชีนี้ สามารถส่งลิงก์รีเซ็ตได้จากด้านล่าง'
      : 'ลิงก์รีเซ็ตรหัสผ่านจะถูกส่งไปยังอีเมลของ Resident';
  }
}

async function attemptLogin() {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }

  const identifier = $('residentLoginIdentifier')?.value.trim();
  const password = $('residentLoginPassword')?.value;
  const rememberMe = !!$('residentRememberMe')?.checked;
  const submitBtn = $('residentLoginSubmitBtn');

  if (!identifier || !password) {
    showToast('กรอก Email และ Password ก่อน', 'error');
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    await loginWithEmail(identifier, password, { rememberMe });
    saveResidentLoginPreference({ rememberMe, email: identifier });
    markResidentJustLoggedIn();
    showToast('Resident login success');
    window.setTimeout(() => {
      window.location.href = './home.html';
    }, 260);
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Resident login failed', 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function sendResetLink() {
  const identifier = $('residentLoginIdentifier')?.value.trim() || getResidentLoginPreference().email || state.currentUser?.email || '';
  const btn = $('sendResetLinkBtn');

  if (!identifier) {
    showToast('กรอก Email ของ Resident ก่อนส่งลิงก์รีเซ็ต', 'error');
    return;
  }

  try {
    if (btn) btn.disabled = true;
    const email = await sendLoginResetEmail(identifier);
    showToast(`ส่งลิงก์รีเซ็ตไปที่ ${email}`);
    const status = $('forgotPasswordStatus');
    if (status) {
      status.textContent = `ส่ง Password Reset ไปที่ ${email} แล้ว`; 
      status.classList.remove('hidden');
    }
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'ส่งลิงก์รีเซ็ตไม่สำเร็จ', 'error');
    const status = $('forgotPasswordStatus');
    if (status) {
      status.textContent = error?.message || 'ส่งลิงก์รีเซ็ตไม่สำเร็จ';
      status.classList.remove('hidden');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function toggleForgotPasswordPanel() {
  const panel = $('forgotPasswordPanel');
  const trigger = $('forgotPasswordBtn');
  if (!panel || !trigger) return;

  const willShow = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !willShow);
  trigger.textContent = willShow ? 'Hide reset options' : 'Forgot Password?';
}

function bindEnterKeys() {
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

function bindButtons() {
  const loginBtn = $('residentLoginSubmitBtn');
  if (loginBtn && !loginBtn.dataset.bound) {
    loginBtn.dataset.bound = '1';
    loginBtn.addEventListener('click', attemptLogin);
  }

  const resetBtn = $('sendResetLinkBtn');
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', sendResetLink);
  }

  const forgotBtn = $('forgotPasswordBtn');
  if (forgotBtn && !forgotBtn.dataset.bound) {
    forgotBtn.dataset.bound = '1';
    forgotBtn.addEventListener('click', toggleForgotPasswordPanel);
  }

  const continueBtn = $('residentContinueBtn');
  if (continueBtn && !continueBtn.dataset.bound) {
    continueBtn.dataset.bound = '1';
    continueBtn.addEventListener('click', () => {
      window.location.href = './home.html';
    });
  }

  const sessionLogoutBtn = $('residentSessionLogoutBtn');
  if (sessionLogoutBtn && !sessionLogoutBtn.dataset.bound) {
    sessionLogoutBtn.dataset.bound = '1';
    sessionLogoutBtn.addEventListener('click', () => {
      $('logoutBtn')?.click();
    });
  }

  const remember = $('residentRememberMe');
  if (remember && !remember.dataset.bound) {
    remember.dataset.bound = '1';
    remember.addEventListener('change', () => {
      const email = $('residentLoginIdentifier')?.value.trim() || getResidentLoginPreference().email;
      saveResidentLoginPreference({ rememberMe: remember.checked, email });
    });
  }

  const email = $('residentLoginIdentifier');
  if (email && !email.dataset.rememberBound) {
    email.dataset.rememberBound = '1';
    email.addEventListener('change', () => {
      saveResidentLoginPreference({ rememberMe: !!$('residentRememberMe')?.checked, email: email.value.trim() });
    });
  }
}

function renderJustLoggedInHint() {
  const notice = $('residentSessionFlash');
  if (!notice) return;

  if (consumeResidentJustLoggedIn()) {
    notice.classList.remove('hidden');
    notice.textContent = 'Resident session ready · กำลังเปิดหน้า Home ให้ทันที';
    window.setTimeout(() => {
      notice.classList.add('hidden');
    }, 2200);
    return;
  }

  notice.classList.add('hidden');
}

export function bindResidentLoginPage() {
  renderRememberState();
  bindButtons();
  bindEnterKeys();
  renderSessionCard();
  renderJustLoggedInHint();
}
