import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { demoResident } from '../data/demo.js';

function normalizeLegacyResident(record = {}, id = '') {
  return {
    id: id || record.id || record.memberId || record.memberCode || 'resident',
    memberId: record.memberId || record.id || '',
    publicCardCode: record.publicCardCode || record.memberCode || '',
    memberCode: record.publicCardCode || record.memberCode || record.memberId || 'LAYA-0001',
    fullName: record.fullName || 'Resident Member',
    tier: record.tier || 'Elite Black',
    status: record.status || 'ACTIVE',
    residence: record.residence || record.roomNo || '-',
    email: record.email || '',
    phone: record.phone || '',
    preferredLanguage: record.preferredLanguage || 'en',
    points: Number(record.points || 0),
    totalSpend: Number(record.totalSpend || 0),
  };
}

function normalizeMemberRecord(record = {}, id = '') {
  const ownedUnits = Array.isArray(record.ownedUnits) ? record.ownedUnits : [];
  const primaryUnit = ownedUnits[0]?.unitNo || ownedUnits[0]?.roomNo || record.residence || '-';

  return {
    id: id || record.memberId || record.publicCardCode || 'resident',
    memberId: record.memberId || id || '',
    publicCardCode: record.publicCardCode || '',
    memberCode: record.publicCardCode || record.memberId || 'LAYA-0001',
    fullName: record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ') || 'Resident Member',
    tier: record.tier === 'elite_black' ? 'Elite Black' : (record.tier || 'Elite Black'),
    status: String(record.status || 'ACTIVE').replace(/_/g, ' ').toUpperCase(),
    residence: primaryUnit || '-',
    email: record.email || '',
    phone: record.phone || '',
    preferredLanguage: record.preferredLanguage || 'en',
    points: Number(record.points || 0),
    totalSpend: Number(record.totalSpend || 0),
    raw: record,
  };
}

async function attachWalletSummary(resident = {}) {
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
      tier: wallet.tier === 'elite_black' ? 'Elite Black' : (resident.tier || 'Elite Black'),
      wallet,
    };
  } catch (error) {
    console.warn('wallet lookup failed', error);
    return resident;
  }
}

async function findMemberByAuth(uid, email, memberKey) {
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

  snap = await getDocs(query(membersRef, where('email', '==', email), limit(1)));
  if (!snap.empty) return snap.docs[0];

  return null;
}

async function findLegacyResident(uid, email, memberKey) {
  const residentsRef = collection(state.db, 'residents');
  let snap;
  if (memberKey) {
    snap = await getDocs(query(residentsRef, where('memberCode', '==', memberKey), limit(1)));
    if (!snap.empty) return snap.docs[0];
  }
  snap = await getDocs(query(residentsRef, where('uid', '==', uid), limit(1)));
  if (!snap.empty) return snap.docs[0];
  snap = await getDocs(query(residentsRef, where('email', '==', email), limit(1)));
  if (!snap.empty) return snap.docs[0];
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
        displayName: data.displayName || '',
      };
    }
  } catch (error) {
    console.warn('user profile read failed', error);
  }
  return { role: 'resident', email, memberId: '', memberCode: '' };
}

export async function loadResidentForUser(uid, email, memberCode) {
  try {
    const memberDoc = await findMemberByAuth(uid, email, memberCode);
    if (memberDoc) {
      const resident = normalizeMemberRecord(memberDoc.data(), memberDoc.id);
      return await attachWalletSummary(resident);
    }
  } catch (error) {
    console.warn('member lookup failed', error);
  }

  try {
    const legacyDoc = await findLegacyResident(uid, email, memberCode);
    if (legacyDoc) {
      return normalizeLegacyResident(legacyDoc.data(), legacyDoc.id);
    }
  } catch (error) {
    console.warn('resident lookup failed', error);
  }

  return demoResident;
}

export async function loadAllResidents() {
  try {
    const membersSnap = await getDocs(collection(state.db, 'members'));
    if (!membersSnap.empty) {
      return await Promise.all(
        membersSnap.docs.map(async (d) => attachWalletSummary(normalizeMemberRecord(d.data(), d.id)))
      );
    }
  } catch (error) {
    console.warn('load members failed', error);
  }

  try {
    const snap = await getDocs(collection(state.db, 'residents'));
    return snap.docs.map((d) => normalizeLegacyResident(d.data(), d.id));
  } catch (error) {
    console.warn('load residents failed', error);
    return [demoResident];
  }
}

export async function searchResidents(keyword) {
  const rows = await loadAllResidents();
  const normalized = String(keyword || '').trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) =>
    [row.fullName, row.memberCode, row.memberId, row.email, row.publicCardCode]
      .some((field) => String(field || '').toLowerCase().includes(normalized))
  );
}
