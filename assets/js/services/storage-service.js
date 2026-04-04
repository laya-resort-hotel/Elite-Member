import { deleteObject, getDownloadURL, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';
import { state } from '../core/state.js?v=20260404fix2';

const ALLOWED_CONTENT_TYPES = ['news', 'promotions', 'benefits'];

function sanitizeName(name = '') {
  return String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}

function assertContentType(contentType) {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Invalid contentType: ${contentType}`);
  }
}

function assertDocId(docId) {
  if (!docId || typeof docId !== 'string') {
    throw new Error('docId is required before uploading media');
  }
}

function makeStorageFileName(file) {
  const safeName = sanitizeName(file?.name || 'image.jpg');
  return `${Date.now()}-${safeName}`;
}

function getStoragePath(contentType, docId, group, fileName) {
  assertContentType(contentType);
  assertDocId(docId);

  if (!['cover', 'gallery'].includes(group)) {
    throw new Error(`Invalid storage group: ${group}`);
  }

  return `${contentType}/${docId}/${group}/${fileName}`;
}

async function uploadSingleFile(file, contentType, group, docId) {
  if (!state.storage) throw new Error('Firebase Storage not ready');
  if (!file) throw new Error('No file selected');

  const fileName = makeStorageFileName(file);
  const path = getStoragePath(contentType, docId, group, fileName);
  const storageRef = ref(state.storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    cacheControl: 'public,max-age=3600',
    customMetadata: {
      uploadedBy: state.currentUser?.email || 'manual-admin',
      uploadedAt: new Date().toISOString(),
      contentType,
      group,
      docId,
    },
  });

  const url = await getDownloadURL(storageRef);

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    path,
    name: file.name || fileName,
    fileName,
    sortOrder: 0,
    isCover: group === 'cover',
  };
}

export async function uploadCmsCover(file, contentType = 'news', docId) {
  return uploadSingleFile(file, contentType, 'cover', docId);
}

export async function uploadCmsGallery(files, contentType = 'news', docId) {
  const list = Array.from(files || []).filter(Boolean);
  const results = [];

  for (const file of list) {
    const uploaded = await uploadSingleFile(file, contentType, 'gallery', docId);
    results.push({ ...uploaded, isCover: false });
  }

  return results;
}

export async function deleteStoragePath(path = '') {
  if (!state.storage || !path) return;
  try {
    await deleteObject(ref(state.storage, path));
  } catch (error) {
    if (error?.code === 'storage/object-not-found') return;
    throw error;
  }
}

export async function deleteStoragePaths(paths = []) {
  const uniquePaths = Array.from(new Set((paths || []).filter(Boolean)));
  for (const path of uniquePaths) {
    await deleteStoragePath(path);
  }
}
