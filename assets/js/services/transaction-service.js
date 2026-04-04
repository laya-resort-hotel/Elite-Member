
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js?v=20260404fix5';

function normalizeSpendTransaction(d) {
  const row = d.data ? d.data() : d;
  const id = d.id || row.id || '';
  return {
    id,
    memberId: row.memberId || '',
    memberCode: row.publicCardCode || row.memberCode || row.memberId || '',
    memberName: row.memberName || row.enteredMemberName || row.fullName || '',
    outlet: row.outletName || row.outlet || '-',
    amount: Number(row.amountEligible ?? row.amountGross ?? row.amount ?? 0),
    points: Number(row.pointsEarned ?? row.points ?? 0),
    createdAt: row.spentAt || row.createdAt || null,
    createdLabel: row.createdLabel || '',
  };
}

async function findMemberByCode(memberCode) {
  const membersRef = collection(state.db, 'members');
  let snap = await getDocs(query(membersRef, where('publicCardCode', '==', memberCode), limit(1)));
  if (!snap.empty) return snap.docs[0];
  snap = await getDocs(query(membersRef, where('memberId', '==', memberCode), limit(1)));
  if (!snap.empty) return snap.docs[0];
  return null;
}

export async function loadTransactions(options = {}) {
  const colRef = collection(state.db, 'spend_transactions');
  const clauses = [];
  if (options.whereMemberCode) {
    clauses.push(where('publicCardCode', '==', options.whereMemberCode));
  }
  if (options.orderBy !== false) {
    clauses.push(orderBy(options.orderField || 'spentAt', 'desc'));
  }
  if (options.limit) clauses.push(limit(options.limit));
  const qRef = clauses.length ? query(colRef, ...clauses) : colRef;
  const snap = await getDocs(qRef);
  return snap.docs.map(normalizeSpendTransaction);
}

export async function addSpendTransaction({ memberCode, memberName, outlet, amount, rate }) {
  const safeAmount = Number(amount || 0);
  const pointRate = Number(rate || 0);
  if (!memberCode || !outlet || !safeAmount) {
    throw new Error('Missing transaction fields');
  }

  const memberSnap = await findMemberByCode(memberCode);
  if (!memberSnap) throw new Error('Member not found in Firebase');
  const member = memberSnap.data() || {};
  const memberId = member.memberId || memberSnap.id;
  const publicCardCode = member.publicCardCode || memberCode;
  const displayName = member.fullName || memberName || 'Resident Member';

  let pointsEarned = 0;
  if (pointRate > 0) {
    pointsEarned = Math.floor(safeAmount * pointRate);
  } else {
    const settingsSnap = await getDoc(doc(state.db, 'app_settings', 'points'));
    const spendPerPoint = Number(settingsSnap.exists() ? (settingsSnap.data()?.defaultSpendPerPoint || 20) : 20);
    pointsEarned = Math.floor(safeAmount / spendPerPoint);
  }

  const walletRef = doc(state.db, 'point_wallets', memberId);
  const spendRef = doc(collection(state.db, 'spend_transactions'));
  const pointTxRef = doc(collection(state.db, 'point_transactions'));

  await runTransaction(state.db, async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    const wallet = walletSnap.exists() ? walletSnap.data() : null;

    const currentPoints = Number(wallet?.currentPoints || 0);
    const pendingPoints = Number(wallet?.pendingPoints || 0);
    const lifetimeEarned = Number(wallet?.lifetimeEarned || 0);
    const lifetimeRedeemed = Number(wallet?.lifetimeRedeemed || 0);
    const lifetimeExpired = Number(wallet?.lifetimeExpired || 0);
    const nextBalance = currentPoints + pointsEarned;

    transaction.set(spendRef, {
      memberId,
      publicCardCode,
      memberName: displayName,
      receiptNo: `WEB-${Date.now()}`,
      outletId: String(outlet).trim().toUpperCase().replace(/\s+/g, '_'),
      outletName: outlet,
      amountGross: safeAmount,
      amountEligible: safeAmount,
      currency: 'THB',
      pointRuleSnapshot: {
        ruleId: pointRate > 0 ? 'manual_rate' : 'default',
        pointRate: pointRate > 0 ? pointRate : null,
        spendPerPoint: pointRate > 0 ? null : 20,
        roundMode: 'floor',
      },
      pointsEarned,
      pointsStatus: 'posted',
      source: 'staff_entry',
      enteredByUid: state.currentUser?.uid || '',
      enteredByName: state.currentUser?.email || 'manual-admin',
      notes: '',
      relatedPointTransactionId: pointTxRef.id,
      spentAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(pointTxRef, {
      memberId,
      walletId: memberId,
      type: 'earn',
      pointsDelta: pointsEarned,
      balanceAfter: nextBalance,
      sourceType: 'spend',
      sourceRefId: spendRef.id,
      description: `Spend at ${outlet}`,
      status: 'posted',
      createdByUid: state.currentUser?.uid || '',
      effectiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    transaction.set(walletRef, {
      memberId,
      currentPoints: nextBalance,
      pendingPoints,
      lifetimeEarned: lifetimeEarned + pointsEarned,
      lifetimeRedeemed,
      lifetimeExpired,
      tier: member.tier || 'elite_black',
      lastTransactionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  return { points: pointsEarned, memberId, publicCardCode };
}
