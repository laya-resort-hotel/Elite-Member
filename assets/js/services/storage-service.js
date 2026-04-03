import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';
import { state } from '../core/state.js';

const ALLOWED_CONTENT_TYPES = ['news', 'promotions', 'benefits'];

function sanitizeName(name = '') {
  return String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}

function assertFirebaseReady() {
  if (!state.storage) throw new Error('Firebase Storage not ready');
  if (!state.db) throw new Error('Firestore not ready');
}

function assertContentType(contentType) {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Invalid contentType: ${contentType}`);
  }
}

function makeImageId() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeFileName(fileName = 'image.jpg') {
  const parts = String(fileName || 'image.jpg').split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
  const base = parts.join('.') || 'image';

  const safeBase = base
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 60);

  return `${safeBase || 'image'}.${ext}`;
}

function makeStorageFileName(file) {
  return `${Date.now()}-${safeFileName(file?.name || 'image.jpg')}`;
}

function getContentDocRef(contentType, docId) {
  assertContentType(contentType);
  return doc(state.db, contentType, docId);
}

function getStoragePath(contentType, docId, bucketType, fileName) {
  assertContentType(contentType);

  if (bucketType === 'cover') {
    return `${contentType}/${docId}/cover/${fileName}`;
  }

  if (bucketType === 'gallery') {
    return `${contentType}/${docId}/gallery/${fileName}`;
  }

  throw new Error(`Invalid bucketType: ${bucketType}`);
}

function isCoverFolderPath(contentType, docId, path) {
  return typeof path === 'string' && path.startsWith(`${contentType}/${docId}/cover/`);
}

function normalizeGalleryImages(images = []) {
  return [...(Array.isArray(images) ? images : [])]
    .map((img) => ({
      id: img?.id || makeImageId(),
      url: String(img?.url || '').trim(),
      path: String(img?.path || '').trim(),
      fileName: String(img?.fileName || img?.name || '').trim(),
      name: String(img?.name || img?.fileName || '').trim(),
      sortOrder: Number.isFinite(img?.sortOrder) ? Number(img.sortOrder) : 9999,
      isCover: !!img?.isCover,
    }))
    .filter((img) => img.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img, index) => ({ ...img, sortOrder: index }));
}

function resetSortOrders(images = []) {
  return images.map((img, index) => ({
    ...img,
    sortOrder: index,
  }));
}

function dedupePaths(paths = []) {
  return [...new Set((paths || []).filter(Boolean))];
}

async function uploadSingleFile(file, contentType = 'content', group = 'cover') {
  if (!state.storage) throw new Error('Firebase Storage not ready');
  if (!file) throw new Error('No file selected');
  const safeType = String(contentType || 'content').toLowerCase();
  const safeGroup = String(group || 'cover').toLowerCase();
  const safeName = sanitizeName(file.name);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `cms-covers/${safeType}/${safeGroup}/${uniqueId}-${safeName}`;
  const storageRef = ref(state.storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    cacheControl: 'public,max-age=3600',
    customMetadata: {
      uploadedBy: state.currentUser?.email || 'manual-admin',
      uploadedAt: new Date().toISOString(),
      contentType: safeType,
      group: safeGroup,
    },
  });
  const url = await getDownloadURL(storageRef);
  return { url, path, name: file.name || safeName, fileName: file.name || safeName };
}

async function deleteStorageByPath(path = '') {
  if (!state.storage || !path) return;
  try {
    await deleteObject(ref(state.storage, path));
  } catch (error) {
    if (error?.code === 'storage/object-not-found') return;
    throw error;
  }
}

async function readContentDoc(contentType, docId) {
  assertFirebaseReady();
  const docRef = getContentDocRef(contentType, docId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error(`${contentType}/${docId} not found`);
  }

  return {
    id: snap.id,
    ref: docRef,
    data: snap.data(),
  };
}

export async function createContentShell(contentType, seed = {}) {
  assertFirebaseReady();
  assertContentType(contentType);

  const docRef = doc(collection(state.db, contentType));

  await setDoc(docRef, {
    title: '',
    summary: '',
    fullDetails: '',
    terms: '',
    ctaLabel: '',
    coverImageUrl: '',
    coverImagePath: '',
    coverImageName: '',
    galleryImages: [],
    isPublished: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...seed,
  });

  return docRef.id;
}

export async function uploadCoverImage({ contentType, docId, file }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');
  if (!file) throw new Error('file is required');

  const { ref: docRef, data } = await readContentDoc(contentType, docId);
  const oldCoverPath = String(data.coverImagePath || '');
  const oldGallery = normalizeGalleryImages(data.galleryImages || []);

  const fileName = makeStorageFileName(file);
  const storagePath = getStoragePath(contentType, docId, 'cover', fileName);
  const fileRef = ref(state.storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  const downloadURL = await getDownloadURL(fileRef);

  let gallery = oldGallery.filter((img) => !isCoverFolderPath(contentType, docId, img.path));
  gallery = gallery.map((img) => ({ ...img, isCover: false }));

  const newCoverItem = {
    id: makeImageId(),
    url: downloadURL,
    path: storagePath,
    fileName,
    name: file.name || fileName,
    sortOrder: 0,
    isCover: true,
  };

  gallery.unshift(newCoverItem);
  gallery = resetSortOrders(gallery);

  await updateDoc(docRef, {
    coverImageUrl: downloadURL,
    coverImagePath: storagePath,
    coverImageName: file.name || fileName,
    galleryImages: gallery,
    updatedAt: serverTimestamp(),
  });

  if (oldCoverPath && oldCoverPath !== storagePath && isCoverFolderPath(contentType, docId, oldCoverPath)) {
    await deleteStorageByPath(oldCoverPath);
  }

  return {
    coverImageUrl: downloadURL,
    coverImagePath: storagePath,
    coverImageName: file.name || fileName,
    galleryImages: gallery,
  };
}

export async function uploadGalleryImages({ contentType, docId, files }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');
  if (!files || !files.length) throw new Error('files are required');

  const { ref: docRef, data } = await readContentDoc(contentType, docId);

  let gallery = normalizeGalleryImages(data.galleryImages || []);
  let nextSort = gallery.length;
  const uploadedItems = [];

  for (const file of Array.from(files || []).filter(Boolean)) {
    const fileName = makeStorageFileName(file);
    const storagePath = getStoragePath(contentType, docId, 'gallery', fileName);
    const fileRef = ref(state.storage, storagePath);

    await uploadBytes(fileRef, file, {
      contentType: file.type || 'image/jpeg',
    });

    const downloadURL = await getDownloadURL(fileRef);

    uploadedItems.push({
      id: makeImageId(),
      url: downloadURL,
      path: storagePath,
      fileName,
      name: file.name || fileName,
      sortOrder: nextSort++,
      isCover: false,
    });
  }

  gallery = resetSortOrders([...gallery, ...uploadedItems]);

  let coverImageUrl = String(data.coverImageUrl || '');
  let coverImagePath = String(data.coverImagePath || '');
  let coverImageName = String(data.coverImageName || '');

  if (!coverImagePath && gallery.length > 0) {
    gallery = gallery.map((img, index) => ({
      ...img,
      isCover: index === 0,
    }));

    coverImageUrl = gallery[0].url;
    coverImagePath = gallery[0].path;
    coverImageName = gallery[0].name || gallery[0].fileName || '';
  }

  await updateDoc(docRef, {
    galleryImages: gallery,
    coverImageUrl,
    coverImagePath,
    coverImageName,
    updatedAt: serverTimestamp(),
  });

  return {
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages: gallery,
    uploadedItems,
  };
}

export async function setGalleryImageAsCover({ contentType, docId, imageId }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');
  if (!imageId) throw new Error('imageId is required');

  const { ref: docRef, data } = await readContentDoc(contentType, docId);
  let gallery = normalizeGalleryImages(data.galleryImages || []);
  const target = gallery.find((img) => img.id === imageId);

  if (!target) throw new Error(`Image not found: ${imageId}`);

  gallery = gallery.map((img) => ({
    ...img,
    isCover: img.id === imageId,
  }));

  await updateDoc(docRef, {
    coverImageUrl: target.url,
    coverImagePath: target.path,
    coverImageName: target.name || target.fileName || '',
    galleryImages: gallery,
    updatedAt: serverTimestamp(),
  });

  return {
    coverImageUrl: target.url,
    coverImagePath: target.path,
    coverImageName: target.name || target.fileName || '',
    galleryImages: gallery,
  };
}

export async function removeGalleryImage({ contentType, docId, imageId }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');
  if (!imageId) throw new Error('imageId is required');

  const { ref: docRef, data } = await readContentDoc(contentType, docId);
  let gallery = normalizeGalleryImages(data.galleryImages || []);
  const target = gallery.find((img) => img.id === imageId);

  if (!target) throw new Error(`Image not found: ${imageId}`);

  await deleteStorageByPath(target.path);

  let remaining = resetSortOrders(gallery.filter((img) => img.id !== imageId));
  let coverImageUrl = String(data.coverImageUrl || '');
  let coverImagePath = String(data.coverImagePath || '');
  let coverImageName = String(data.coverImageName || '');

  const removedWasCover = !!target.isCover || coverImagePath === target.path;

  if (removedWasCover) {
    if (remaining.length > 0) {
      remaining = remaining.map((img, index) => ({
        ...img,
        isCover: index === 0,
      }));
      coverImageUrl = remaining[0].url;
      coverImagePath = remaining[0].path;
      coverImageName = remaining[0].name || remaining[0].fileName || '';
    } else {
      coverImageUrl = '';
      coverImagePath = '';
      coverImageName = '';
    }
  } else {
    remaining = remaining.map((img) => ({
      ...img,
      isCover: img.path === coverImagePath,
    }));
  }

  await updateDoc(docRef, {
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages: remaining,
    updatedAt: serverTimestamp(),
  });

  return {
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages: remaining,
  };
}

export async function deleteContentItemWithImages({ contentType, docId }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');

  const { ref: docRef, data } = await readContentDoc(contentType, docId);

  const coverImagePath = String(data.coverImagePath || '');
  const galleryImages = normalizeGalleryImages(data.galleryImages || []);
  const allPaths = dedupePaths([
    coverImagePath,
    ...galleryImages.map((img) => img.path),
  ]);

  for (const path of allPaths) {
    await deleteStorageByPath(path);
  }

  await deleteDoc(docRef);

  return {
    deleted: true,
    deletedPaths: allPaths,
    deletedDocId: docId,
    contentType,
  };
}

export async function reorderGalleryImages({ contentType, docId, orderedImageIds }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');
  if (!Array.isArray(orderedImageIds) || !orderedImageIds.length) {
    throw new Error('orderedImageIds is required');
  }

  const { ref: docRef, data } = await readContentDoc(contentType, docId);
  const currentGallery = normalizeGalleryImages(data.galleryImages || []);
  const imageMap = new Map(currentGallery.map((img) => [img.id, img]));

  let reordered = orderedImageIds.map((id) => imageMap.get(id)).filter(Boolean);
  const missing = currentGallery.filter((img) => !orderedImageIds.includes(img.id));
  reordered = resetSortOrders([...reordered, ...missing]);

  const currentCoverPath = String(data.coverImagePath || '');
  reordered = reordered.map((img) => ({
    ...img,
    isCover: img.path === currentCoverPath,
  }));

  await updateDoc(docRef, {
    galleryImages: reordered,
    updatedAt: serverTimestamp(),
  });

  return { galleryImages: reordered };
}

export async function moveGalleryImageFirst({ contentType, docId, imageId }) {
  assertFirebaseReady();
  assertContentType(contentType);

  if (!docId) throw new Error('docId is required');
  if (!imageId) throw new Error('imageId is required');

  const { ref: docRef, data } = await readContentDoc(contentType, docId);
  const gallery = normalizeGalleryImages(data.galleryImages || []);
  const target = gallery.find((img) => img.id === imageId);

  if (!target) throw new Error(`Image not found: ${imageId}`);

  const reordered = resetSortOrders([
    target,
    ...gallery.filter((img) => img.id !== imageId),
  ]).map((img) => ({
    ...img,
    isCover: img.path === String(data.coverImagePath || ''),
  }));

  await updateDoc(docRef, {
    galleryImages: reordered,
    updatedAt: serverTimestamp(),
  });

  return { galleryImages: reordered };
}

// Legacy exports kept for compatibility with existing UI
export async function uploadCmsCover(file, contentType = 'content') {
  return uploadSingleFile(file, contentType, 'cover');
}

export async function uploadCmsGallery(files, contentType = 'content') {
  const list = Array.from(files || []).filter(Boolean);
  const results = [];
  for (const file of list) {
    results.push(await uploadSingleFile(file, contentType, 'gallery'));
  }
  return results;
}

export async function deleteStoragePath(path = '') {
  return deleteStorageByPath(path);
}

export async function deleteStoragePaths(paths = []) {
  for (const path of dedupePaths(paths)) {
    await deleteStorageByPath(path);
  }
}
