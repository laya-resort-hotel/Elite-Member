import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js?v=20260404fix2';
import { formatDate } from '../core/format.js?v=20260404fix2';

function stringValue(value = '') {
  return String(value || '').trim();
}

function normalizeOwnedUnits(value = []) {
  if (Array.isArray(value)) {
    return value
      .map((row) => ({
        unitNo: stringValue(row?.unitNo),
        roomType: stringValue(row?.roomType),
        ownershipStatus: stringValue(row?.ownershipStatus || 'owned'),
      }))
      .filter((row) => row.unitNo);
  }

  return stringValue(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [unitNo = '', roomType = '', ownershipStatus = 'owned'] = line.split('|').map((part) => part.trim());
      return {
        unitNo,
        roomType,
        ownershipStatus: ownershipStatus || 'owned',
      };
    })
    .filter((row) => row.unitNo);
}

function makeMemberId() {
  const stamp = String(Date.now()).slice(-6);
  return `ECB${stamp}`;
}

function makePublicCardCode() {
  return `LAYA-${Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 8)}`;
}

function normalizeMemberPayload(payload = {}, options = {}) {
  const memberId = stringValue(payload.memberId) || options.memberId || makeMemberId();
  const fullName = stringValue(payload.fullName);
  const firstName = stringValue(payload.firstName);
  const lastName = stringValue(payload.lastName);
  const email = stringValue(payload.email);
  const phone = stringValue(payload.phone);
  const preferredLanguage = stringValue(payload.preferredLanguage) || 'en';

  return {
    memberId,
    publicCardCode: stringValue(payload.publicCardCode) || makePublicCardCode(),
    authUid: stringValue(payload.authUid) || null,
    fullName,
    firstName,
    lastName,
    email,
    phone,
    status: stringValue(payload.status) || 'active',
    tier: stringValue(payload.tier) || 'elite_black',
    ownerType: stringValue(payload.ownerType) || 'resident_owner',
    preferredLanguage,
    avatarUrl: stringValue(payload.avatarUrl),
    ownedUnits: normalizeOwnedUnits(payload.ownedUnits),
    notes: stringValue(payload.notes),
    joinedAt: options.keepJoinedAt ? payload.joinedAt : serverTimestamp(),
    lastActivityAt: payload.lastActivityAt || null,
  };
}

export function createMemberShell() {
  return makeMemberId();
}

export async function loadMembersSafe(options = {}) {
  const colRef = collection(state.db, 'members');
  let qRef = colRef;
  const clauses = [];
  if (options.limit) clauses.push(limit(options.limit));
  if (options.orderBy !== false) clauses.push(orderBy(options.orderField || 'createdAt', 'desc'));
  if (options.whereStatus) clauses.push(where('status', '==', options.whereStatus));
  if (clauses.length) qRef = query(colRef, ...clauses);

  const snap = await getDocs(qRef);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdLabel: formatDate(data.createdAt),
      updatedLabel: formatDate(data.updatedAt),
    };
  });
}

export async function loadMemberById(memberId) {
  const ref = doc(state.db, 'members', memberId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdLabel: formatDate(data.createdAt),
    updatedLabel: formatDate(data.updatedAt),
  };
}

export async function saveMemberRecord(payload = {}, options = {}) {
  const memberId = stringValue(options.memberId) || stringValue(payload.memberId) || createMemberShell();
  const ref = doc(state.db, 'members', memberId);
  const normalized = normalizeMemberPayload(payload, { memberId });

  await setDoc(ref, {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: false });

  const walletRef = doc(state.db, 'point_wallets', memberId);
  const walletSnap = await getDoc(walletRef);
  if (!walletSnap.exists()) {
    await setDoc(walletRef, {
      memberId,
      currentPoints: 0,
      pendingPoints: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      lifetimeExpired: 0,
      tier: normalized.tier,
      lastTransactionAt: null,
      updatedAt: serverTimestamp(),
    });
  }

  return ref;
}

export async function updateMemberRecord(memberId, payload = {}) {
  const ref = doc(state.db, 'members', memberId);
  const current = await getDoc(ref);
  if (!current.exists()) {
    throw new Error('Member not found');
  }

  const currentData = current.data();
  const normalized = normalizeMemberPayload(
    { ...currentData, ...payload },
    { memberId, keepJoinedAt: true }
  );

  await updateDoc(ref, {
    ...normalized,
    updatedAt: serverTimestamp(),
  });

  const walletRef = doc(state.db, 'point_wallets', memberId);
  const walletSnap = await getDoc(walletRef);
  if (walletSnap.exists()) {
    await updateDoc(walletRef, {
      tier: normalized.tier,
      updatedAt: serverTimestamp(),
    });
  }

  return ref;
}

export async function loadMemberInsights(memberId) {
  if (!memberId) {
    return {
      wallet: null,
      recentRedemptions: [],
    };
  }

  const walletSnap = await getDoc(doc(state.db, 'point_wallets', memberId));
  const wallet = walletSnap.exists() ? {
    id: walletSnap.id,
    ...walletSnap.data(),
    updatedLabel: formatDate(walletSnap.data()?.updatedAt),
    lastTransactionLabel: formatDate(walletSnap.data()?.lastTransactionAt),
  } : null;

  let recentRedemptions = [];
  try {
    const redemptionsRef = collection(state.db, 'redemptions');
    const redemptionsQuery = query(
      redemptionsRef,
      where('memberId', '==', memberId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snap = await getDocs(redemptionsQuery);
    recentRedemptions = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdLabel: formatDate(data.createdAt),
        approvedLabel: formatDate(data.approvedAt),
        usedLabel: formatDate(data.usedAt),
        expiresLabel: formatDate(data.expiresAt),
      };
    });
  } catch (error) {
    console.warn('load recentRedemptions failed', error);
  }

  return {
    wallet,
    recentRedemptions,
  };
}

export async function deleteMemberRecord(memberId) {
  if (!memberId) throw new Error('memberId is required');
  await deleteDoc(doc(state.db, 'members', memberId));
  try {
    await deleteDoc(doc(state.db, 'point_wallets', memberId));
  } catch (error) {
    console.warn('delete point_wallet failed', error);
  }
}
