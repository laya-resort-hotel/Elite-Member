import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js?v=20260404fix5';

const EMPLOYEE_DOMAIN = 'employee.layaresident.local';

function fullNameFromRecord(record = {}) {
  return record.displayName
    || record.fullName
    || [record.firstName, record.lastName].filter(Boolean).join(' ').trim()
    || 'Resident Member';
}

function normalizeStatus(value = 'active') {
  return String(value || 'active').replace(/_/g, ' ').toUpperCase();
}

function primaryResidenceFromRecord(record = {}) {
  if (record.primaryUnitCode) return record.primaryUnitCode;
  if (Array.isArray(record.unitCodes) && record.unitCodes.length) return record.unitCodes[0];
  const ownedUnits = Array.isArray(record.ownedUnits) ? record.ownedUnits : [];
  return ownedUnits[0]?.unitNo || ownedUnits[0]?.roomNo || record.residence || '-';
}

function normalizeResidentRecord(record = {}, id = '', wallet = {}, card = {}) {
  const fullName = fullNameFromRecord(record);
  const qrCodeValue = card.qrCodeValue || record.qrCodeValue || record.publicCardCode || record.memberCode || record.memberId || id || '';
  const memberCode = record.memberCode || record.publicCardCode || record.memberId || id || '';
  const primaryUnitCode = primaryResidenceFromRecord(record);
  const unitCodes = Array.isArray(record.unitCodes)
    ? record.unitCodes.filter(Boolean)
    : (Array.isArray(record.ownedUnits) ? record.ownedUnits.map((item) => item?.unitNo || item?.roomNo).filter(Boolean) : []);

  return {
    id: id || record.memberId || record.publicCardCode || 'resident',
    residentId: id || record.residentId || record.memberId || '',
    memberId: record.memberId || id || '',
    memberCode,
    publicCardCode: qrCodeValue,
    qrCodeValue,
    cardNumber: card.cardNumber || record.cardNumber || '',
    fullName,
    displayName: fullName,
    tier: record.tier === 'elite_black' ? 'Elite Black' : (record.tier || 'Elite Black'),
    status: normalizeStatus(record.status || 'active'),
    residence: primaryUnitCode || '-',
    primaryUnitCode: primaryUnitCode || '-',
    unitCodes,
    email: record.loginEmail || record.email || '',
    contactEmail: record.email || '',
    phone: record.phone || '',
    preferredLanguage: record.preferredLanguage || 'en',
    points: Number(wallet.currentPoints ?? record.points ?? 0),
    pendingPoints: Number(wallet.pendingPoints ?? 0),
    lifetimeEarned: Number(wallet.lifetimeEarned ?? 0),
    lifetimeRedeemed: Number(wallet.lifetimeRedeemed ?? 0),
    totalSpend: Number(record.totalSpend || 0),
    authUid: record.authUid || record.linkedUserUid || '',
    loginEmail: record.loginEmail || record.email || '',
    wallet,
    card,
    raw: record,
  };
}

async function getResidentWallet(residentId = '') {
  if (!residentId) return {};
  try {
    const snap = await getDoc(doc(state.db, 'resident_wallets', residentId));
    return snap.exists() ? (snap.data() || {}) : {};
  } catch (error) {
    console.warn('resident wallet lookup failed', error);
    return {};
  }
}

async function getResidentCard(residentId = '') {
  if (!residentId) return {};
  try {
    const snap = await getDoc(doc(state.db, 'resident_cards', residentId));
    return snap.exists() ? (snap.data() || {}) : {};
  } catch (error) {
    console.warn('resident card lookup failed', error);
    return {};
  }
}

async function hydrateResidentFromNewCollections(record = {}, id = '') {
  const residentId = id || record.residentId || record.memberId || '';
  if (!residentId) return null;
  const [wallet, card] = await Promise.all([
    getResidentWallet(residentId),
    getResidentCard(residentId),
  ]);
  return normalizeResidentRecord(record, residentId, wallet, card);
}

function normalizeLegacyMemberRecord(record = {}, id = '') {
  const ownedUnits = Array.isArray(record.ownedUnits) ? record.ownedUnits : [];
  const primaryUnit = ownedUnits[0]?.unitNo || ownedUnits[0]?.roomNo || record.residence || '-';

  return {
    id: id || record.memberId || record.publicCardCode || 'resident',
    memberId: record.memberId || id || '',
    residentId: record.memberId || id || '',
    publicCardCode: record.publicCardCode || '',
    qrCodeValue: record.publicCardCode || record.memberId || '',
    memberCode: record.publicCardCode || record.memberId || '',
    cardNumber: record.cardNumber || '',
    fullName: record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ') || 'Resident Member',
    displayName: record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ') || 'Resident Member',
    tier: record.tier === 'elite_black' ? 'Elite Black' : (record.tier || 'Elite Black'),
    status: normalizeStatus(record.status || 'ACTIVE'),
    residence: primaryUnit || '-',
    primaryUnitCode: primaryUnit || '-',
    unitCodes: ownedUnits.map((item) => item?.unitNo || item?.roomNo).filter(Boolean),
    email: record.email || '',
    contactEmail: record.email || '',
    phone: record.phone || '',
    preferredLanguage: record.preferredLanguage || 'en',
    points: Number(record.points || 0),
    totalSpend: Number(record.totalSpend || 0),
    authUid: record.authUid || '',
    loginEmail: record.email || '',
    raw: record,
  };
}

async function attachLegacyWalletSummary(resident = {}) {
  const memberId = resident.memberId || resident.raw?.memberId;
  if (!memberId) return resident;

  try {
    const walletSnap = await getDoc(doc(state.db, 'point_wallets', memberId));
    if (!walletSnap.exists()) return resident;
    const wallet = walletSnap.data() || {};
    return {
      ...resident,
      points: Number(wallet.currentPoints ?? resident.points ?? 0),
      pendingPoints: Number(wallet.pendingPoints ?? 0),
      lifetimeEarned: Number(wallet.lifetimeEarned ?? 0),
      lifetimeRedeemed: Number(wallet.lifetimeRedeemed ?? 0),
      lifetimeExpired: Number(wallet.lifetimeExpired ?? 0),
      tier: wallet.tier === 'elite_black' ? 'Elite Black' : (resident.tier || 'Elite Black'),
      wallet,
    };
  } catch (error) {
    console.warn('legacy wallet lookup failed', error);
    return resident;
  }
}

async function attachLegacySpendSummary(resident = {}) {
  const memberId = resident.memberId || resident.raw?.memberId;
  if (!memberId) return resident;

  try {
    const spendSnap = await getDocs(query(collection(state.db, 'spend_transactions'), where('memberId', '==', memberId), limit(200)));
    const totalSpend = spendSnap.docs.reduce((sum, row) => sum + Number(row.data()?.amountEligible ?? row.data()?.amountGross ?? 0), 0);
    return { ...resident, totalSpend };
  } catch (error) {
    console.warn('legacy spend lookup failed', error);
    return resident;
  }
}

async function hydrateLegacyMemberRecord(record = {}, id = '') {
  const resident = normalizeLegacyMemberRecord(record, id);
  let row = await attachLegacyWalletSummary(resident);
  row = await attachLegacySpendSummary(row);
  return row;
}

async function findLegacyMemberByAuth(uid, email, memberKey) {
  const membersRef = collection(state.db, 'members');
  let snap;

  if (memberKey) {
    snap = await getDocs(query(membersRef, where('publicCardCode', '==', memberKey), limit(1)));
    if (!snap.empty) return snap.docs[0];
    snap = await getDocs(query(membersRef, where('memberId', '==', memberKey), limit(1)));
    if (!snap.empty) return snap.docs[0];
  }

  snap = await getDocs(query(membersRef, where('authUid', '==', uid), limit(1)));
  if (!snap.empty) return snap.docs[0];

  if (email) {
    snap = await getDocs(query(membersRef, where('email', '==', email), limit(1)));
    if (!snap.empty) return snap.docs[0];
  }

  return null;
}

async function tryFindResidentByQuery(uid, email, memberCode) {
  const residentsRef = collection(state.db, 'residents');
  const candidates = [];
  const emailLower = String(email || '').trim().toLowerCase();

  if (uid) candidates.push(query(residentsRef, where('authUid', '==', uid), limit(1)));
  if (emailLower) candidates.push(query(residentsRef, where('loginEmailLower', '==', emailLower), limit(1)));
  if (email) candidates.push(query(residentsRef, where('loginEmail', '==', email), limit(1)));
  if (memberCode) candidates.push(query(residentsRef, where('memberCode', '==', memberCode), limit(1)));

  for (const q of candidates) {
    try {
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0];
    } catch (error) {
      console.warn('resident lookup query failed', error);
    }
  }

  return null;
}

export async function loadUserProfile(uid, email) {
  try {
    const snap = await getDoc(doc(state.db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data() || {};
      return {
        role: data.role || 'resident',
        email: data.email || email,
        memberId: data.memberId || '',
        memberCode: data.publicCardCode || data.memberCode || data.memberId || '',
        publicCardCode: data.publicCardCode || '',
        residentId: data.residentId || '',
        displayName: data.displayName || '',
        employeeId: data.employeeId || '',
      };
    }
  } catch (error) {
    console.warn('user profile read failed', error);
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail.endsWith(`@${EMPLOYEE_DOMAIN}`)) {
    return {
      role: 'staff',
      email: normalizedEmail,
      employeeId: normalizedEmail.replace(`@${EMPLOYEE_DOMAIN}`, ''),
      memberId: '',
      memberCode: '',
      publicCardCode: '',
      residentId: '',
      displayName: '',
    };
  }

  return { role: 'resident', email, memberId: '', memberCode: '', publicCardCode: '', residentId: '', displayName: '', employeeId: '' };
}

export async function loadResidentForUser(uid, email, profileOrMemberCode = {}) {
  const profile = typeof profileOrMemberCode === 'string'
    ? { memberCode: profileOrMemberCode, publicCardCode: profileOrMemberCode, residentId: '' }
    : (profileOrMemberCode || {});

  try {
    if (profile.residentId) {
      const residentSnap = await getDoc(doc(state.db, 'residents', profile.residentId));
      if (residentSnap.exists()) {
        return await hydrateResidentFromNewCollections(residentSnap.data(), residentSnap.id);
      }
    }

    const residentDoc = await tryFindResidentByQuery(uid, email, profile.memberCode || profile.publicCardCode || '');
    if (residentDoc) {
      return await hydrateResidentFromNewCollections(residentDoc.data(), residentDoc.id);
    }
  } catch (error) {
    console.warn('new resident lookup failed', error);
  }

  try {
    const memberDoc = await findLegacyMemberByAuth(uid, email, profile.memberCode || profile.publicCardCode || '');
    if (!memberDoc) return null;
    return await hydrateLegacyMemberRecord(memberDoc.data(), memberDoc.id);
  } catch (error) {
    console.warn('legacy member lookup failed', error);
    return null;
  }
}

export async function loadAllResidents() {
  try {
    const residentsSnap = await getDocs(collection(state.db, 'residents'));
    if (!residentsSnap.empty) {
      return await Promise.all(
        residentsSnap.docs.map((row) => hydrateResidentFromNewCollections(row.data(), row.id))
      );
    }
  } catch (error) {
    console.warn('load residents collection failed', error);
  }

  try {
    const membersSnap = await getDocs(collection(state.db, 'members'));
    if (membersSnap.empty) return [];
    return await Promise.all(
      membersSnap.docs.map((row) => hydrateLegacyMemberRecord(row.data(), row.id))
    );
  } catch (error) {
    console.warn('load legacy members failed', error);
    return [];
  }
}

export async function searchResidents(keyword) {
  const rows = await loadAllResidents();
  const normalized = String(keyword || '').trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) =>
    [
      row.fullName,
      row.memberCode,
      row.memberId,
      row.email,
      row.publicCardCode,
      row.residence,
      row.cardNumber,
    ].some((field) => String(field || '').toLowerCase().includes(normalized))
  );
}

export async function loadResidentPointHistory(residentId, maxRows = 10) {
  if (!residentId) return [];
  try {
    const snap = await getDocs(query(
      collection(state.db, 'resident_point_transactions'),
      where('residentId', '==', residentId),
      limit(Math.max(maxRows, 20)),
    ));
    return snap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => {
        const aTime = typeof a.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = typeof b.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, maxRows);
  } catch (error) {
    console.warn('resident point history load failed', error);
    return [];
  }
}
