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

export async function loadUserProfile(uid, email) {
  try {
    const snap = await getDoc(doc(state.db, 'users', uid));
    if (snap.exists()) return snap.data();
  } catch (error) {
    console.warn('user profile read failed', error);
  }
  return { role: 'resident', email };
}

export async function loadResidentForUser(uid, email, memberCode) {
  try {
    const residentsRef = collection(state.db, 'residents');
    let snap;
    if (memberCode) {
      snap = await getDocs(query(residentsRef, where('memberCode', '==', memberCode), limit(1)));
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    snap = await getDocs(query(residentsRef, where('uid', '==', uid), limit(1)));
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    snap = await getDocs(query(residentsRef, where('email', '==', email), limit(1)));
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (error) {
    console.warn('resident lookup failed', error);
  }
  return demoResident;
}

export async function loadAllResidents() {
  try {
    const snap = await getDocs(collection(state.db, 'residents'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    [row.fullName, row.memberCode, row.email].some((field) => String(field || '').toLowerCase().includes(normalized))
  );
}
