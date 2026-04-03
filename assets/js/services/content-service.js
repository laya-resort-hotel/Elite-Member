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
import { deleteStoragePaths } from './storage-service.js';

function stringValue(value = '') {
  return String(value || '').trim();
}

function linesValue(value = '') {
  return stringValue(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeGalleryImages(value = []) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => ({
      url: stringValue(item?.url),
      path: stringValue(item?.path),
      name: stringValue(item?.name),
    }))
    .filter((item) => item.url);
}

function normalizeContentPayload(payload = {}) {
  const title = stringValue(payload.title);
  const summary = stringValue(payload.summary);
  const fullDetails = stringValue(payload.fullDetails);
  const termsText = stringValue(payload.terms);
  const ctaLabel = stringValue(payload.ctaLabel) || 'Learn more';
  const galleryImages = normalizeGalleryImages(payload.galleryImages);
  let coverImageUrl = stringValue(payload.coverImageUrl);
  let coverImagePath = stringValue(payload.coverImagePath);
  let coverImageName = stringValue(payload.coverImageName);

  if (!coverImageUrl && galleryImages.length) {
    coverImageUrl = galleryImages[0].url;
    coverImagePath = galleryImages[0].path;
    coverImageName = galleryImages[0].name;
  }

  return {
    title,
    summary,
    body: summary,
    fullDetails,
    details: linesValue(fullDetails),
    terms: linesValue(termsText),
    ctaLabel,
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages,
    imageCount: galleryImages.length,
  };
}

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

export async function saveStructuredCMS(collectionName, payload) {
  const normalized = normalizeContentPayload(payload);
  const ref = await addDoc(collection(state.db, collectionName), {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: state.currentUser?.email || 'manual-admin',
    updatedBy: state.currentUser?.email || 'manual-admin',
  });
  return ref;
}

export async function updateStructuredCMS(collectionName, id, payload) {
  const normalized = normalizeContentPayload(payload);
  const ref = doc(state.db, collectionName, id);
  const current = await getDoc(ref);
  const currentData = current.exists() ? current.data() : null;
  const oldPaths = [
    currentData?.coverImagePath,
    ...((currentData?.galleryImages || []).map((item) => item?.path)),
  ].filter(Boolean);
  const nextPaths = [
    normalized.coverImagePath,
    ...((normalized.galleryImages || []).map((item) => item?.path)),
  ].filter(Boolean);
  const removedPaths = oldPaths.filter((path) => !nextPaths.includes(path));
  if (removedPaths.length) {
    await deleteStoragePaths(removedPaths);
  }
  await updateDoc(ref, {
    ...normalized,
    updatedAt: serverTimestamp(),
    updatedBy: state.currentUser?.email || 'manual-admin',
  });
}

export async function deleteCMSItem(collectionName, id) {
  const ref = doc(state.db, collectionName, id);
  const current = await getDoc(ref);
  if (current.exists()) {
    const data = current.data();
    await deleteStoragePaths([
      data?.coverImagePath,
      ...((data?.galleryImages || []).map((item) => item?.path)),
    ]);
  }
  await deleteDoc(ref);
}

export async function saveSimpleCMS(collectionName, title, body) {
  return saveStructuredCMS(collectionName, {
    title,
    summary: body,
    fullDetails: body,
    terms: '',
    ctaLabel: 'Learn more',
    coverImageUrl: '',
    coverImagePath: '',
    coverImageName: '',
    galleryImages: [],
  });
}

export async function updateSimpleCMS(collectionName, id, title, body) {
  return updateStructuredCMS(collectionName, id, {
    title,
    summary: body,
    fullDetails: body,
    terms: '',
    ctaLabel: 'Learn more',
    coverImageUrl: '',
    coverImagePath: '',
    coverImageName: '',
    galleryImages: [],
  });
}
