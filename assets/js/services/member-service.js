
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js?v=20260404fix2';

const EMPLOYEE_DOMAIN = 'employee.layaresident.local';

function normalizeMemberRecord(record = {}, id = '') {
  const ownedUnits = Array.isArray(record.ownedUnits) ? record.ownedUnits : [];
  const primaryUnit = ownedUnits[0]?.unitNo || ownedUnits[0]?.roomNo || record.residence || '-';

  return {
    id: id || record.memberId || record.publicCardCode || 'resident',
    memberId: record.memberId || id || '',
    publicCardCode: record.publicCardCode || '',
    memberCode: record.publicCardCode || record.memberId || '',
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
      lifetimeExpired: Number(wallet.lifetimeExpired ?? 0),
      tier: wallet.tier === 'elite_black' ? 'Elite Black' : (resident.tier || 'Elite Black'),
      wallet,
    };
  } catch (error) {
    console.warn('wallet lookup failed', error);
    return resident;
  }
}

async function attachSpendSummary(resident = {}) {
  const memberId = resident.memberId || resident.raw?.memberId;
  if (!memberId) return resident;

  try {
    const spendSnap = await getDocs(query(collection(state.db, 'spend_transactions'), where('memberId', '==', memberId), limit(200)));
    const totalSpend = spendSnap.docs.reduce((sum, row) => sum + Number(row.data()?.amountEligible ?? row.data()?.amountGross ?? 0), 0);
    return { ...resident, totalSpend };
  } catch (error) {
    console.warn('spend lookup failed', error);
    return resident;
  }
}

async function attachMemberSummaries(resident = {}) {
  let row = await attachWalletSummary(resident);
  row = await attachSpendSummary(row);
  return row;
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

  if (email) {
    snap = await getDocs(query(membersRef, where('email', '==', email), limit(1)));
    if (!snap.empty) return snap.docs[0];
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
      displayName: '',
    };
  }

  return { role: 'resident', email, memberId: '', memberCode: '', publicCardCode: '', displayName: '', employeeId: '' };
}

export async function loadResidentForUser(uid, email, memberCode) {
  try {
    const memberDoc = await findMemberByAuth(uid, email, memberCode);
    if (!memberDoc) return null;
    const resident = normalizeMemberRecord(memberDoc.data(), memberDoc.id);
    return await attachMemberSummaries(resident);
  } catch (error) {
    console.warn('member lookup failed', error);
    return null;
  }
}

export async function loadAllResidents() {
  try {
    const membersSnap = await getDocs(collection(state.db, 'members'));
    if (membersSnap.empty) return [];
    return await Promise.all(
      membersSnap.docs.map(async (d) => attachMemberSummaries(normalizeMemberRecord(d.data(), d.id)))
    );
  } catch (error) {
    console.warn('load members failed', error);
    return [];
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
