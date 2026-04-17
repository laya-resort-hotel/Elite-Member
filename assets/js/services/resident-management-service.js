import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  orderBy,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { residentManagementDemo } from '../data/resident-management-demo.js';

const STORAGE_KEY = 'laya-resident-management-starter-v2';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/\n|,/).map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

function parseUnitCodes(payload = {}) {
  if (Array.isArray(payload.unitCodes)) return asArray(payload.unitCodes);
  return asArray(payload.unitCodesText || payload.unitsText || payload.primaryUnitCode || '');
}

function nextNumberFromCodes(codes = [], prefix = 'RES') {
  const numbers = codes
    .map((code) => String(code || '').match(/(\d+)$/)?.[1])
    .filter(Boolean)
    .map((value) => Number(value));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

function normalizeResidentPayload(payload = {}, existing = {}, context = {}) {
  const firstName = String(payload.firstName ?? existing.firstName ?? '').trim();
  const lastName = String(payload.lastName ?? existing.lastName ?? '').trim();
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = String((payload.displayName ?? existing.displayName ?? fallbackName) || 'Resident Member').trim();
  const unitCodes = parseUnitCodes({
    unitCodes: payload.unitCodes,
    unitCodesText: payload.unitCodesText,
    unitsText: payload.unitsText,
    primaryUnitCode: payload.primaryUnitCode || existing.primaryUnitCode,
  });
  const primaryUnitCode = String(payload.primaryUnitCode ?? existing.primaryUnitCode ?? unitCodes[0] ?? '').trim();
  const memberCode = String(payload.memberCode ?? existing.memberCode ?? context.memberCode ?? '').trim();
  const qrCodeValue = String(payload.qrCodeValue ?? existing.qrCodeValue ?? (memberCode ? `LAYA-${memberCode}` : '')).trim();
  const cardNumber = String(payload.cardNumber ?? existing.cardNumber ?? context.cardNumber ?? '').trim();
  const linkedUserUid = String(payload.linkedUserUid ?? payload.authUid ?? existing.linkedUserUid ?? existing.authUid ?? '').trim();
  const loginEmail = String(payload.loginEmail ?? existing.loginEmail ?? payload.email ?? existing.email ?? '').trim();

  return {
    id: String(payload.id ?? existing.id ?? context.id ?? makeId('resident')).trim(),
    memberCode,
    qrCodeValue,
    cardNumber,
    firstName,
    lastName,
    displayName,
    email: String(payload.email ?? existing.email ?? '').trim(),
    loginEmail,
    loginEmailLower: loginEmail.toLowerCase(),
    linkedUserUid,
    authUid: linkedUserUid,
    phone: String(payload.phone ?? existing.phone ?? '').trim(),
    status: String(payload.status ?? existing.status ?? 'active').trim() || 'active',
    tier: String(payload.tier ?? existing.tier ?? 'elite_black').trim() || 'elite_black',
    ownerType: String(payload.ownerType ?? existing.ownerType ?? 'resident_owner').trim() || 'resident_owner',
    primaryUnitCode,
    unitCodes: unitCodes.length ? unitCodes : (primaryUnitCode ? [primaryUnitCode] : []),
    notes: String(payload.notes ?? existing.notes ?? '').trim(),
    totalSpend: Number(payload.totalSpend ?? existing.totalSpend ?? 0),
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

function buildDefaultWallet(residentId) {
  return {
    residentId,
    currentPoints: 0,
    pendingPoints: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    updatedAt: nowIso(),
  };
}

function buildDefaultCard(record) {
  return {
    residentId: record.id,
    memberCode: record.memberCode,
    cardNumber: record.cardNumber,
    qrCodeValue: record.qrCodeValue,
    status: record.status === 'inactive' ? 'inactive' : 'active',
    issuedAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortTransactions(rows = []) {
  return [...rows].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

function normalizeSnapshot(raw = {}) {
  const residents = Array.isArray(raw.residents) ? raw.residents : [];
  const wallets = raw.wallets || {};
  const cards = raw.cards || {};
  const pointTransactions = sortTransactions(Array.isArray(raw.pointTransactions) ? raw.pointTransactions : []);
  const residentRows = residents.map((resident) => {
    const wallet = wallets[resident.id] || buildDefaultWallet(resident.id);
    const card = cards[resident.id] || buildDefaultCard(resident);
    return {
      ...resident,
      wallet,
      card,
      points: Number(wallet.currentPoints || 0),
      transactionCount: pointTransactions.filter((item) => item.residentId === resident.id).length,
    };
  });

  const totalPoints = residentRows.reduce((sum, row) => sum + Number(row.wallet?.currentPoints || 0), 0);
  return {
    residents: residentRows.sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''))),
    wallets,
    cards,
    pointTransactions,
    metrics: {
      totalResidents: residentRows.length,
      activeResidents: residentRows.filter((row) => row.status === 'active').length,
      totalPoints,
      activeCards: Object.values(cards).filter((card) => card?.status !== 'inactive').length,
    },
  };
}

function loadLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(residentManagementDemo);
    const parsed = JSON.parse(raw);
    if (!parsed?.residents?.length) return deepClone(residentManagementDemo);
    return parsed;
  } catch (error) {
    console.warn('local resident store parse failed', error);
    return deepClone(residentManagementDemo);
  }
}

function saveLocalStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
}

function ensureLocalStore() {
  const store = loadLocalStore();
  saveLocalStore(store);
  return store;
}

function setLocalResident(payload = {}) {
  const store = ensureLocalStore();
  const existingIndex = store.residents.findIndex((row) => row.id === payload.id);
  const existing = existingIndex >= 0 ? store.residents[existingIndex] : {};
  const nextMemberCode = payload.memberCode || existing.memberCode || nextNumberFromCodes(store.residents.map((row) => row.memberCode), 'RES');
  const nextCardNumber = payload.cardNumber || existing.cardNumber || nextNumberFromCodes(store.residents.map((row) => row.cardNumber), 'CARD');
  const record = normalizeResidentPayload(payload, existing, {
    id: payload.id || existing.id || makeId('resident'),
    memberCode: nextMemberCode,
    cardNumber: nextCardNumber,
  });

  if (existingIndex >= 0) {
    store.residents.splice(existingIndex, 1, record);
  } else {
    store.residents.push(record);
  }

  store.wallets[record.id] = {
    ...(store.wallets[record.id] || buildDefaultWallet(record.id)),
    residentId: record.id,
    updatedAt: nowIso(),
  };

  store.cards[record.id] = {
    ...(store.cards[record.id] || buildDefaultCard(record)),
    residentId: record.id,
    memberCode: record.memberCode,
    cardNumber: record.cardNumber,
    qrCodeValue: record.qrCodeValue,
    status: record.status === 'inactive' ? 'inactive' : 'active',
    updatedAt: nowIso(),
  };

  saveLocalStore(store);
  return normalizeSnapshot(store);
}

function deleteLocalResident(residentId) {
  const store = ensureLocalStore();
  store.residents = store.residents.filter((row) => row.id !== residentId);
  delete store.wallets[residentId];
  delete store.cards[residentId];
  store.pointTransactions = store.pointTransactions.filter((row) => row.residentId !== residentId);
  saveLocalStore(store);
  return normalizeSnapshot(store);
}

function addLocalPointTransaction(payload = {}) {
  const store = ensureLocalStore();
  const resident = store.residents.find((row) => row.id === payload.residentId);
  if (!resident) throw new Error('Resident not found');
  const wallet = store.wallets[resident.id] || buildDefaultWallet(resident.id);
  const points = Math.abs(Number(payload.points || payload.pointsDelta || 0));
  if (!points) throw new Error('Points are required');

  const type = payload.type === 'redeem' ? 'redeem' : 'earn';
  const delta = type === 'redeem' ? -points : points;
  const balanceAfter = Number(wallet.currentPoints || 0) + delta;
  wallet.currentPoints = balanceAfter;
  wallet.pendingPoints = Number(wallet.pendingPoints || 0);
  wallet.lifetimeEarned = Number(wallet.lifetimeEarned || 0) + (type === 'earn' ? points : 0);
  wallet.lifetimeRedeemed = Number(wallet.lifetimeRedeemed || 0) + (type === 'redeem' ? points : 0);
  wallet.updatedAt = nowIso();
  store.wallets[resident.id] = wallet;

  store.pointTransactions.push({
    id: makeId('ptx'),
    residentId: resident.id,
    memberCode: resident.memberCode,
    type,
    pointsDelta: delta,
    balanceAfter,
    source: String(payload.source || 'manual_adjustment').trim() || 'manual_adjustment',
    referenceNo: String(payload.referenceNo || '').trim(),
    note: String(payload.note || '').trim(),
    createdByName: String(payload.createdByName || state.currentUser?.email || 'Admin Demo').trim(),
    createdAt: nowIso(),
  });

  saveLocalStore(store);
  return normalizeSnapshot(store);
}

async function loadFirebaseSnapshot() {
  const [residentsSnap, walletsSnap, cardsSnap, txSnap] = await Promise.all([
    getDocs(collection(state.db, 'residents')),
    getDocs(collection(state.db, 'resident_wallets')),
    getDocs(collection(state.db, 'resident_cards')),
    getDocs(query(collection(state.db, 'resident_point_transactions'), orderBy('createdAt', 'desc'))),
  ]);

  const residents = residentsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const wallets = Object.fromEntries(walletsSnap.docs.map((item) => [item.id, { residentId: item.id, ...item.data() }]));
  const cards = Object.fromEntries(cardsSnap.docs.map((item) => [item.id, { residentId: item.id, ...item.data() }]));
  const pointTransactions = txSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  return normalizeSnapshot({ residents, wallets, cards, pointTransactions });
}

async function syncLinkedUserDoc(record) {
  const linkedUid = String(record.linkedUserUid || record.authUid || '').trim();
  if (!linkedUid) return;
  await setDoc(doc(state.db, 'users', linkedUid), {
    uid: linkedUid,
    displayName: record.displayName,
    email: record.loginEmail || record.email || '',
    role: 'resident',
    employeeId: '',
    residentId: record.id,
    memberId: record.id,
    memberCode: record.memberCode,
    publicCardCode: record.qrCodeValue,
    isActive: record.status !== 'inactive',
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }, { merge: true });
}

async function saveFirebaseResident(payload = {}) {
  const current = await loadFirebaseSnapshot().catch(() => ({ residents: [], wallets: {}, cards: {} }));
  const existing = current.residents.find((row) => row.id === payload.id) || {};
  const nextMemberCode = payload.memberCode || existing.memberCode || nextNumberFromCodes(current.residents.map((row) => row.memberCode), 'RES');
  const nextCardNumber = payload.cardNumber || existing.cardNumber || nextNumberFromCodes(current.residents.map((row) => row.cardNumber), 'CARD');
  const record = normalizeResidentPayload(payload, existing, {
    id: payload.id || existing.id || doc(collection(state.db, 'residents')).id,
    memberCode: nextMemberCode,
    cardNumber: nextCardNumber,
  });

  await setDoc(doc(state.db, 'residents', record.id), {
    ...record,
    createdAt: existing.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(doc(state.db, 'resident_wallets', record.id), {
    ...(current.wallets?.[record.id] || buildDefaultWallet(record.id)),
    residentId: record.id,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(doc(state.db, 'resident_cards', record.id), {
    ...(current.cards?.[record.id] || buildDefaultCard(record)),
    residentId: record.id,
    memberCode: record.memberCode,
    cardNumber: record.cardNumber,
    qrCodeValue: record.qrCodeValue,
    status: record.status === 'inactive' ? 'inactive' : 'active',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await syncLinkedUserDoc(record);
  return loadFirebaseSnapshot();
}

async function deleteFirebaseResident(residentId) {
  const txQuery = query(collection(state.db, 'resident_point_transactions'), where('residentId', '==', residentId));
  const txSnap = await getDocs(txQuery);
  const batch = writeBatch(state.db);
  txSnap.docs.forEach((row) => batch.delete(row.ref));
  batch.delete(doc(state.db, 'residents', residentId));
  batch.delete(doc(state.db, 'resident_wallets', residentId));
  batch.delete(doc(state.db, 'resident_cards', residentId));
  await batch.commit();
  return loadFirebaseSnapshot();
}

async function addFirebasePointTransaction(payload = {}) {
  const residentId = String(payload.residentId || '').trim();
  if (!residentId) throw new Error('Resident ID is required');
  const residentRef = doc(state.db, 'residents', residentId);
  const walletRef = doc(state.db, 'resident_wallets', residentId);
  const txRef = doc(collection(state.db, 'resident_point_transactions'));
  const points = Math.abs(Number(payload.points || payload.pointsDelta || 0));
  if (!points) throw new Error('Points are required');
  const type = payload.type === 'redeem' ? 'redeem' : 'earn';
  const delta = type === 'redeem' ? -points : points;

  await runTransaction(state.db, async (transaction) => {
    const [residentSnap, walletSnap] = await Promise.all([
      transaction.get(residentRef),
      transaction.get(walletRef),
    ]);
    if (!residentSnap.exists()) throw new Error('Resident not found');
    const resident = residentSnap.data() || {};
    const wallet = walletSnap.exists() ? walletSnap.data() : buildDefaultWallet(residentId);
    const currentPoints = Number(wallet.currentPoints || 0);
    const nextBalance = currentPoints + delta;

    transaction.set(txRef, {
      residentId,
      memberCode: resident.memberCode || '',
      type,
      pointsDelta: delta,
      balanceAfter: nextBalance,
      source: String(payload.source || 'manual_adjustment').trim() || 'manual_adjustment',
      referenceNo: String(payload.referenceNo || '').trim(),
      note: String(payload.note || '').trim(),
      createdByName: String(payload.createdByName || state.currentUser?.email || 'Admin').trim(),
      createdByUid: state.currentUser?.uid || '',
      createdAt: serverTimestamp(),
    });

    transaction.set(walletRef, {
      residentId,
      currentPoints: nextBalance,
      pendingPoints: Number(wallet.pendingPoints || 0),
      lifetimeEarned: Number(wallet.lifetimeEarned || 0) + (type === 'earn' ? points : 0),
      lifetimeRedeemed: Number(wallet.lifetimeRedeemed || 0) + (type === 'redeem' ? points : 0),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(doc(state.db, 'resident_activity_logs', txRef.id), {
      residentId,
      action: type === 'earn' ? 'points_added' : 'points_redeemed',
      pointsDelta: delta,
      memberCode: resident.memberCode || '',
      createdAt: serverTimestamp(),
      createdByUid: state.currentUser?.uid || '',
      createdByName: String(payload.createdByName || state.currentUser?.email || 'Admin').trim(),
      note: String(payload.note || '').trim(),
      referenceNo: String(payload.referenceNo || '').trim(),
    });
  });

  return loadFirebaseSnapshot();
}

export function seedResidentManagementDemo() {
  saveLocalStore(deepClone(residentManagementDemo));
  return normalizeSnapshot(loadLocalStore());
}

export function resetResidentManagementLocalStore() {
  localStorage.removeItem(STORAGE_KEY);
  return seedResidentManagementDemo();
}

export async function loadResidentManagementDashboard() {
  if (state.db) {
    try {
      const snapshot = await loadFirebaseSnapshot();
      return { ...snapshot, mode: 'firebase' };
    } catch (error) {
      console.error('load firebase resident dashboard failed', error);
      throw error;
    }
  }
  const snapshot = normalizeSnapshot(ensureLocalStore());
  return { ...snapshot, mode: 'demo' };
}

export async function saveResidentManagementRecord(payload = {}) {
  if (state.db) {
    try {
      const snapshot = await saveFirebaseResident(payload);
      return { ...snapshot, mode: 'firebase' };
    } catch (error) {
      console.error('save firebase resident failed', error);
      throw error;
    }
  }
  const snapshot = setLocalResident(payload);
  return { ...snapshot, mode: 'demo' };
}

export async function deleteResidentManagementRecord(residentId) {
  if (!residentId) throw new Error('Resident ID is required');
  if (state.db) {
    try {
      const snapshot = await deleteFirebaseResident(residentId);
      return { ...snapshot, mode: 'firebase' };
    } catch (error) {
      console.error('delete firebase resident failed', error);
      throw error;
    }
  }
  const snapshot = deleteLocalResident(residentId);
  return { ...snapshot, mode: 'demo' };
}

export async function addResidentPointAdjustment(payload = {}) {
  if (state.db) {
    try {
      const snapshot = await addFirebasePointTransaction(payload);
      return { ...snapshot, mode: 'firebase' };
    } catch (error) {
      console.error('add firebase point transaction failed', error);
      throw error;
    }
  }
  const snapshot = addLocalPointTransaction(payload);
  return { ...snapshot, mode: 'demo' };
}
