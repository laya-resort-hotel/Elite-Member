import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { formatDate } from '../core/format.js';

export async function loadCollectionSafe(name, options = {}) {
  const colRef = collection(state.db, name);
  const clauses = [];
  if (options.whereMemberCode) clauses.push(where('memberCode', '==', options.whereMemberCode));
  if (options.orderBy !== false) clauses.push(orderBy(options.orderField || 'createdAt', 'desc'));
  if (options.limit) clauses.push(limit(options.limit));
  const qRef = clauses.length ? query(colRef, ...clauses) : colRef;
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdLabel: formatDate(d.data().createdAt) }));
}

export async function loadDocumentById(collectionName, id) {
  const ref = doc(state.db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, ...data, createdLabel: formatDate(data.createdAt), updatedLabel: formatDate(data.updatedAt) };
}

export async function saveSimpleCMS(collectionName, title, body) {
  await addDoc(collection(state.db, collectionName), {
    title,
    body,
    summary: body,
    details: [body],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: state.currentUser?.email || 'manual-admin',
  });
}
