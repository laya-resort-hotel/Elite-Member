import { deleteObject, getDownloadURL, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';
import { state } from '../core/state.js';

function sanitizeName(name = '') {
  return String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
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
  return { url, path, name: file.name || safeName };
}

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
  if (!state.storage || !path) return;
  try {
    await deleteObject(ref(state.storage, path));
  } catch (error) {
    if (error?.code === 'storage/object-not-found') return;
    throw error;
  }
}

export async function deleteStoragePaths(paths = []) {
  for (const path of Array.from(new Set((paths || []).filter(Boolean)))) {
    await deleteStoragePath(path);
  }
}
