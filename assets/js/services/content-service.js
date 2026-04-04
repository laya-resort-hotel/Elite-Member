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
  setDoc,
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
    .map((item, index) => ({
      id: stringValue(item?.id) || `img_${Date.now()}_${index}`,
      url: stringValue(item?.url),
      path: stringValue(item?.path),
      name: stringValue(item?.name || item?.fileName),
      fileName: stringValue(item?.fileName || item?.name),
      sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index,
      isCover: Boolean(item?.isCover),
    }))
    .filter((item) => item.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

function pickCoverFromGallery(galleryImages = [], fallbackUrl = '', fallbackPath = '', fallbackName = '') {
  const explicitCover = galleryImages.find((item) => item.isCover);
  if (explicitCover) {
    return {
      coverImageUrl: explicitCover.url,
      coverImagePath: explicitCover.path,
      coverImageName: explicitCover.name || explicitCover.fileName,
      galleryImages: galleryImages.map((item) => ({
        ...item,
        isCover: item.id === explicitCover.id,
      })),
    };
  }

  if (fallbackUrl) {
    return {
      coverImageUrl: fallbackUrl,
      coverImagePath: fallbackPath,
      coverImageName: fallbackName,
      galleryImages,
    };
  }

  if (galleryImages.length) {
    return {
      coverImageUrl: galleryImages[0].url,
      coverImagePath: galleryImages[0].path,
      coverImageName: galleryImages[0].name || galleryImages[0].fileName,
      galleryImages: galleryImages.map((item, index) => ({
        ...item,
        isCover: index === 0,
      })),
    };
  }

  return {
    coverImageUrl: '',
    coverImagePath: '',
    coverImageName: '',
    galleryImages,
  };
}

function normalizeContentPayload(payload = {}) {
  const title = stringValue(payload.title);
  const summary = stringValue(payload.summary);
  const fullDetails = stringValue(payload.fullDetails);
  const termsText = stringValue(payload.terms);
  const ctaLabel = stringValue(payload.ctaLabel) || 'Learn more';

  const galleryImages = normalizeGalleryImages(payload.galleryImages);
  const coverFields = pickCoverFromGallery(
    galleryImages,
    stringValue(payload.coverImageUrl),
    stringValue(payload.coverImagePath),
    stringValue(payload.coverImageName)
  );

  return {
    title,
    summary,
    body: summary,
    fullDetails,
    details: linesValue(fullDetails),
    terms: linesValue(termsText),
    ctaLabel,
    coverImageUrl: coverFields.coverImageUrl,
    coverImagePath: coverFields.coverImagePath,
    coverImageName: coverFields.coverImageName,
    galleryImages: coverFields.galleryImages,
    imageCount: coverFields.galleryImages.length,
  };
}

export async function createContentShell(collectionName, payload = {}) {
  const ref = doc(collection(state.db, collectionName));
  const author = state.currentUser?.email || 'manual-admin';
  const normalized = normalizeContentPayload(payload);

  const shellData = {
    title: normalized.title || '',
    summary: normalized.summary || '',
    body: normalized.summary || '',
    fullDetails: normalized.fullDetails || '',
    details: Array.isArray(normalized.details) ? normalized.details : [],
    terms: Array.isArray(normalized.terms) ? normalized.terms : [],
    ctaLabel: normalized.ctaLabel || 'Learn more',
    coverImageUrl: normalized.coverImageUrl || '',
    coverImagePath: normalized.coverImagePath || '',
    coverImageName: normalized.coverImageName || '',
    galleryImages: Array.isArray(normalized.galleryImages) ? normalized.galleryImages : [],
    imageCount: Array.isArray(normalized.galleryImages) ? normalized.galleryImages.length : 0,
    isPublished: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: author,
    updatedBy: author,
  };

  if (collectionName === 'benefits') {
    shellData.isActive = false;
  }

  await setDoc(ref, shellData, { merge: true });
  return ref.id;
}

export async function loadCollectionSafe(name, options = {}) {
  const colRef = collection(state.db, name);
  const clauses = [];
  if (options.whereMemberCode) clauses.push(where('memberCode', '==', options.whereMemberCode));
  if (options.orderBy !== false) clauses.push(orderBy(options.orderField || 'createdAt', 'desc'));
  if (options.limit) clauses.push(limit(options.limit));
  const qRef = clauses.length ? query(colRef, ...clauses) : colRef;
  const snap = await getDocs(qRef);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdLabel: formatDate(d.data().createdAt) }))
    .filter((row) => row.title || row.summary || row.coverImageUrl || row.imageCount);
}

export async function loadDocumentById(collectionName, id) {
  const ref = doc(state.db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, ...data, createdLabel: formatDate(data.createdAt), updatedLabel: formatDate(data.updatedAt) };
}

export async function saveStructuredCMS(collectionName, payload, options = {}) {
  const normalized = normalizeContentPayload(payload);
  const author = state.currentUser?.email || 'manual-admin';

  if (options.docId) {
    const ref = doc(state.db, collectionName, options.docId);
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const nextData = {
      ...normalized,
      updatedAt: serverTimestamp(),
      updatedBy: author,
      createdAt: existingData?.createdAt || serverTimestamp(),
      createdBy: existingData?.createdBy || author,
    };

    if (typeof existingData?.isPublished === 'boolean') {
      nextData.isPublished = existingData.isPublished;
    } else {
      nextData.isPublished = false;
    }

    if (collectionName === 'benefits') {
      if (typeof existingData?.isActive === 'boolean') {
        nextData.isActive = existingData.isActive;
      } else {
        nextData.isActive = false;
      }
    }

    await setDoc(ref, nextData, { merge: true });
    return ref;
  }

  return addDoc(collection(state.db, collectionName), {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: author,
    updatedBy: author,
  });
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
