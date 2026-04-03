import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
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

function normalizeBody(body) {
  return String(body || '').trim();
}

function toDetails(body) {
  return normalizeBody(body).split('
').map((line) => line.trim()).filter(Boolean);
}

export async function saveSimpleCMS(collectionName, title, body) {
  const normalizedBody = normalizeBody(body);
  const ref = await addDoc(collection(state.db, collectionName), {
    title,
    body: normalizedBody,
    summary: normalizedBody,
    details: toDetails(normalizedBody),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: state.currentUser?.email || 'manual-admin',
    updatedBy: state.currentUser?.email || 'manual-admin',
  });
  return ref;
}

export async function updateSimpleCMS(collectionName, id, title, body) {
  const normalizedBody = normalizeBody(body);
  await updateDoc(doc(state.db, collectionName, id), {
    title,
    body: normalizedBody,
    summary: normalizedBody,
    details: toDetails(normalizedBody),
    updatedAt: serverTimestamp(),
    updatedBy: state.currentUser?.email || 'manual-admin',
  });
}

export async function deleteCMSItem(collectionName, id) {
  await deleteDoc(doc(state.db, collectionName, id));
}
