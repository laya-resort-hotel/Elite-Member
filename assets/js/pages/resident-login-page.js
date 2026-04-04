import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { loginWithEmail, sendLoginResetEmail, signUpResidentWithInvite } from '../services/auth-service.js';
import {
  getResidentLoginPreference,
  saveResidentLoginPreference,
  getResidentSessionMode,
  markResidentJustLoggedIn,
  consumeResidentJustLoggedIn,
} from '../core/session.js';
import { normalizeInviteCode, normalizeUnitCode, parseUnitCodes } from '../services/resident-invite-service.js';
import { showToast } from '../ui/toast.js';

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

function setAuthMode(mode = 'login') {
  const isSignup = mode === 'signup';
  $('authModeLoginBtn')?.classList.toggle('active', !isSignup);
  $('authModeSignupBtn')?.classList.toggle('active', isSignup);
  $('residentLoginModePanel')?.classList.toggle('hidden', isSignup);
  $('residentSignupModePanel')?.classList.toggle('hidden', !isSignup);
  $('residentAuthSwitchLabel') && ( $('residentAuthSwitchLabel').textContent = isSignup ? 'First-time Resident Registration' : 'Resident Login');
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
    ? 'Remembered on this device'
    : 'Session only · until browser closes';

  setSessionAppearance(activeResident);
  toggleHidden('residentSessionCard', !activeResident);
  toggleHidden('residentSessionEmptyCard', activeResident);
  toggleHidden('residentSessionActions', !activeResident);

  setText('residentSessionStatus', activeResident ? 'Resident Session Ready' : 'No Active Session');
  setText('residentSessionName', resident.fullName || resident.displayName || state.currentUser?.displayName || 'Resident Member');
  setText('residentSessionEmail', state.currentUser?.email || resident.loginEmail || resident.email || '-');
  setText('residentSessionMode', activeResident ? sessionLabel : 'ยังไม่มี resident session บนอุปกรณ์นี้');
  setText('residentSessionCode', resident.memberCode || resident.qrCodeValue || resident.cardNumber || '-');
  setText('residentSessionResidence', resident.residence || resident.primaryUnitCode || '-');

  const submitBtn = $('residentLoginSubmitBtn');
  if (submitBtn) submitBtn.textContent = activeResident ? 'Switch account' : 'Log in';
}

async function attemptLogin() {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }

  const identifier = $('residentLoginIdentifier')?.value.trim();
  const password = $('residentLoginPassword')?.value.trim();
  const rememberMe = !!$('residentRememberMe')?.checked;
  const submitBtn = $('residentLoginSubmitBtn');

  if (!identifier || !password) {
    showToast('กรอก Email และรหัส 6 ตัวก่อน', 'error');
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

async function attemptSignup() {
  if (!state.firebaseReady) {
    showToast('Firebase not ready', 'error');
    return;
  }

  const email = $('residentSignupEmail')?.value.trim();
  const pin = $('residentSignupPin')?.value.trim();
  const inviteCode = normalizeInviteCode($('residentSignupInviteCode')?.value || '');
  const primaryUnitCode = normalizeUnitCode($('residentSignupPrimaryUnit')?.value || '');
  const additionalUnits = parseUnitCodes($('residentSignupAdditionalUnits')?.value || '').filter((code) => code !== primaryUnitCode);
  const submitBtn = $('residentSignupSubmitBtn');

  if (!email || !pin || !inviteCode || !primaryUnitCode) {
    showToast('กรอก Email, รหัส 6 ตัว, รหัสแนะนำ และห้องหลักก่อน', 'error');
    return;
  }
  if (!/^\d{6}$/.test(pin)) {
    showToast('รหัส 6 ตัวต้องเป็นตัวเลข 6 หลัก', 'error');
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    await signUpResidentWithInvite({
      email,
      pin,
      inviteCode,
      primaryUnitCode,
      additionalUnitCodes: additionalUnits,
    });
    saveResidentLoginPreference({ rememberMe: true, email });
    markResidentJustLoggedIn();
    showToast('สมัครสมาชิกสำเร็จ');
    window.setTimeout(() => {
      window.location.href = './home.html';
    }, 400);
  } catch (error) {
    console.error(error);
    let message = error?.message || 'สมัครสมาชิกไม่สำเร็จ';
    if (error?.code === 'auth/email-already-in-use') message = 'อีเมลนี้ถูกสมัครแล้ว';
    if (error?.code === 'auth/invalid-email') message = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (error?.code === 'permission-denied') message = 'Firestore Rules ยังไม่เปิดให้สมัคร Resident ผ่าน invite code';
    if (error?.message === 'Invite code does not match the primary room entered') message = 'รหัสแนะนำไม่ตรงกับห้องหลักที่กรอก';
    showToast(message, 'error');
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
  trigger.textContent = willShow ? 'Hide reset options' : 'Forgot PIN?';
}

function bindEnterKeys() {
  ['residentLoginPassword', 'residentLoginIdentifier'].forEach((id) => {
    const el = $(id);
    if (el && !el.dataset.boundEnter) {
      el.dataset.boundEnter = '1';
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') attemptLogin();
      });
    }
  });

  ['residentSignupEmail', 'residentSignupPin', 'residentSignupInviteCode', 'residentSignupPrimaryUnit', 'residentSignupAdditionalUnits'].forEach((id) => {
    const el = $(id);
    if (el && !el.dataset.boundEnter) {
      el.dataset.boundEnter = '1';
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') attemptSignup();
      });
    }
  });
}

function bindButtons() {
  const loginBtn = $('residentLoginSubmitBtn');
  if (loginBtn && !loginBtn.dataset.bound) {
    loginBtn.dataset.bound = '1';
    loginBtn.addEventListener('click', attemptLogin);
  }

  const signupBtn = $('residentSignupSubmitBtn');
  if (signupBtn && !signupBtn.dataset.bound) {
    signupBtn.dataset.bound = '1';
    signupBtn.addEventListener('click', attemptSignup);
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

  $('authModeLoginBtn')?.addEventListener('click', () => setAuthMode('login'));
  $('authModeSignupBtn')?.addEventListener('click', () => setAuthMode('signup'));
  $('authModeSignupBtnInline')?.addEventListener('click', () => setAuthMode('signup'));
  $('residentGoLoginBtn')?.addEventListener('click', () => setAuthMode('login'));
}

function bindFieldFormatters() {
  ['residentSignupInviteCode', 'residentSignupPrimaryUnit'].forEach((id) => {
    const el = $(id);
    if (el && !el.dataset.boundFormat) {
      el.dataset.boundFormat = '1';
      el.addEventListener('blur', () => {
        if (id === 'residentSignupInviteCode') el.value = normalizeInviteCode(el.value);
        if (id === 'residentSignupPrimaryUnit') el.value = normalizeUnitCode(el.value);
      });
    }
  });

  const extra = $('residentSignupAdditionalUnits');
  if (extra && !extra.dataset.boundFormat) {
    extra.dataset.boundFormat = '1';
    extra.addEventListener('blur', () => {
      extra.value = parseUnitCodes(extra.value).join(', ');
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
  bindFieldFormatters();
  renderSessionCard();
  renderJustLoggedInHint();
  setAuthMode('login');
}
