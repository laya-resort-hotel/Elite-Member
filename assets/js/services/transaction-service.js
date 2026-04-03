import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { loadCollectionSafe } from './content-service.js';

export async function loadTransactions(options = {}) {
  return loadCollectionSafe('transactions', options);
}

export async function addSpendTransaction({ memberCode, memberName, outlet, amount, rate }) {
  const points = Math.round(Number(amount || 0) * Number(rate || 1));
  const residentsRef = collection(state.db, 'residents');
  const residentQuery = query(residentsRef, where('memberCode', '==', memberCode), limit(1));
  const residentSnap = await getDocs(residentQuery);
  const residentDocSnap = residentSnap.docs[0];
  const residentRef = residentDocSnap ? doc(state.db, 'residents', residentDocSnap.id) : doc(collection(state.db, 'residents'));

  await runTransaction(state.db, async (transaction) => {
    const currentResidentSnap = await transaction.get(residentRef);
    const currentData = currentResidentSnap.exists() ? currentResidentSnap.data() : {};
    const nextPoints = Number(currentData.points || 0) + points;
    const nextSpend = Number(currentData.totalSpend || 0) + Number(amount || 0);
    transaction.set(residentRef, {
      fullName: memberName,
      memberCode,
      residence: currentData.residence || '-',
      status: currentData.status || 'ACTIVE',
      tier: currentData.tier || 'Elite Black',
      email: currentData.email || '',
      points: nextPoints,
      totalSpend: nextSpend,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await addDoc(collection(state.db, 'transactions'), {
    memberCode,
    memberName,
    outlet,
    amount: Number(amount || 0),
    points,
    createdAt: serverTimestamp(),
    createdBy: state.currentUser?.email || 'manual-admin',
  });

  return { points };
}
