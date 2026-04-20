import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { collection, doc, setDoc, serverTimestamp, updateDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { t } from '../core/i18n.js';
import { setResidentSessionMode } from '../core/session.js';
import { getResidentInviteByCode, normalizeInviteCode, normalizeUnitCode, parseUnitCodes } from './resident-invite-service.js';

const EMPLOYEE_DOMAIN = 'employee.layaresident.local';

export function subscribeAuth(callback) {
  return onAuthStateChanged(state.auth, callback);
}

export function employeeIdToEmail(employeeId) {
  const normalized = String(employeeId || '').trim().toLowerCase();
  if (!normalized) throw new Error('Employee ID is required');
  if (normalized.includes('@')) return normalized;
  return `${normalized}@${EMPLOYEE_DOMAIN}`;
}

export function normalizeLoginIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (!value) throw new Error('Login identifier is required');
  if (value.includes('@')) return value.toLowerCase();
  return employeeIdToEmail(value);
}

export async function loginWithEmail(identifier, password, options = {}) {
  if (!state.firebaseReady || !state.auth) {
    throw new Error('Firebase Auth is not ready');
  }

  const { rememberMe = false } = options;
  const email = normalizeLoginIdentifier(identifier);

  await setPersistence(state.auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  setResidentSessionMode(rememberMe ? 'local' : 'session');
  return signInWithEmailAndPassword(state.auth, email, password);
}

export async function sendLoginResetEmail(identifier) {
  if (!state.firebaseReady || !state.auth) {
    throw new Error('Firebase Auth is not ready');
  }
  const email = normalizeLoginIdentifier(identifier);
  await sendPasswordResetEmail(state.auth, email);
  return email;
}

export async function signUpWithEmployeeId({ employeeId, fullName, password }) {
  if (!state.firebaseReady || !state.auth || !state.db) {
    throw new Error('Firebase is not ready');
  }

  const cleanedEmployeeId = String(employeeId || '').trim();
  if (!cleanedEmployeeId) throw new Error('Employee ID is required');
  if (!fullName || !String(fullName).trim()) throw new Error('Full name is required');
  if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters');

  const email = employeeIdToEmail(cleanedEmployeeId);
  const cred = await createUserWithEmailAndPassword(state.auth, email, password);

  try {
    await updateProfile(cred.user, { displayName: String(fullName || '').trim() });
  } catch (error) {
    console.warn('profile update failed', error);
  }

  const userRef = doc(state.db, 'users', cred.user.uid);
  await setDoc(userRef, {
    uid: cred.user.uid,
    displayName: String(fullName || '').trim(),
    email,
    role: 'staff',
    employeeId: cleanedEmployeeId,
    memberId: null,
    publicCardCode: '',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }, { merge: true });

  return cred;
}

export async function touchLastLogin(uid) {
  if (!uid || !state.db) return;
  try {
    await updateDoc(doc(state.db, 'users', uid), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('touchLastLogin failed', error);
  }
}

export async function logoutCurrentUser() {
  if (!state.auth?.currentUser) return;
  return signOut(state.auth);
}


function buildResidentDisplayName(email = '', primaryUnitCode = '', firstName = '', lastName = '') {
  const manualName = [String(firstName || '').trim(), String(lastName || '').trim()].filter(Boolean).join(' ').trim();
  if (manualName) return manualName;
  const localPart = String(email || '').split('@')[0] || '';
  const prettified = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return prettified || `Resident ${primaryUnitCode || ''}`.trim() || t('common.residentMember');
}

function makeResidentCode(prefix = 'RES') {
  return `${prefix}-${String(Date.now()).slice(-6)}`;
}

function makePublicCardCode() {
  return `LAYA-${Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 8)}`;
}

function makeCardNumber() {
  return `ECB-${String(Date.now()).slice(-6)}`;
}

export async function signUpResidentWithInvite(payload = {}) {
  if (!state.firebaseReady || !state.auth || !state.db) {
    throw new Error('Firebase is not ready');
  }

  const email = normalizeLoginIdentifier(payload.email || '');
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const password = String(payload.password || payload.pin || '').trim();
  const inviteCode = normalizeInviteCode(payload.inviteCode || '');
  const primaryUnitCode = normalizeUnitCode(payload.primaryUnitCode || '');
  const additionalUnitCodes = parseUnitCodes(payload.additionalUnitCodes || payload.additionalUnits || []).filter((code) => code && code !== primaryUnitCode);

  if (!email) throw new Error('Email is required');
  if (!firstName || !lastName) throw new Error('First name and last name are required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  if (!inviteCode) throw new Error('Invite code is required');
  if (!primaryUnitCode) throw new Error('Primary room is required');

  const invite = await getResidentInviteByCode(inviteCode);
  if (!invite) throw new Error('Invite code not found');
  if (invite.status !== 'active') throw new Error('Invite code is not active');
  if (invite.claimedByUid) throw new Error('Invite code has already been used');
  if (invite.primaryUnitCode && invite.primaryUnitCode !== primaryUnitCode) {
    throw new Error('Invite code does not match the primary room entered');
  }

  await setPersistence(state.auth, browserLocalPersistence);
  setResidentSessionMode('local');

  const cred = await createUserWithEmailAndPassword(state.auth, email, password);
  const residentId = doc(collection(state.db, 'residents')).id;
  const memberCode = makeResidentCode('RES');
  const publicCardCode = makePublicCardCode();
  const cardNumber = makeCardNumber();
  const displayName = buildResidentDisplayName(email, primaryUnitCode, firstName, lastName);

  try {
    await updateProfile(cred.user, { displayName });
  } catch (error) {
    console.warn('resident profile update failed', error);
  }

  const batch = writeBatch(state.db);
  const residentRef = doc(state.db, 'residents', residentId);
  const walletRef = doc(state.db, 'resident_wallets', residentId);
  const cardRef = doc(state.db, 'resident_cards', residentId);
  const userRef = doc(state.db, 'users', cred.user.uid);
  const inviteRef = doc(state.db, 'resident_invite_codes', inviteCode);

  const unitCodes = [primaryUnitCode, ...additionalUnitCodes];
  const residentPayload = {
    id: residentId,
    memberCode,
    qrCodeValue: publicCardCode,
    cardNumber,
    firstName,
    lastName,
    displayName,
    email,
    loginEmail: email,
    loginEmailLower: email.toLowerCase(),
    linkedUserUid: cred.user.uid,
    authUid: cred.user.uid,
    phone: '',
    status: 'active',
    tier: 'elite_black',
    ownerType: 'resident_owner',
    primaryUnitCode,
    unitCodes,
    notes: `Self sign-up via invite ${inviteCode}`,
    totalSpend: 0,
    inviteCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(residentRef, residentPayload, { merge: false });
  batch.set(walletRef, {
    residentId,
    currentPoints: 0,
    pendingPoints: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    updatedAt: serverTimestamp(),
  }, { merge: false });
  batch.set(cardRef, {
    residentId,
    memberCode,
    cardNumber,
    qrCodeValue: publicCardCode,
    status: 'active',
    issuedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: false });
  batch.set(userRef, {
    uid: cred.user.uid,
    displayName,
    email,
    role: 'resident',
    employeeId: '',
    memberId: residentId,
    memberCode,
    publicCardCode,
    residentId,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }, { merge: false });
  batch.update(inviteRef, {
    status: 'claimed',
    claimedAt: serverTimestamp(),
    claimedByUid: cred.user.uid,
    claimedByEmail: email,
    claimedResidentId: residentId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error('resident signup batch failed', error);
    try {
      await deleteUser(cred.user);
    } catch (rollbackError) {
      console.warn('resident signup auth rollback failed', rollbackError);
    }
    throw error;
  }

  return {
    cred,
    residentId,
    memberCode,
    publicCardCode,
    primaryUnitCode,
    inviteCode,
  };
}
