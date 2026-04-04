import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';
import { formatDate } from '../core/format.js';

const INVITE_COLLECTION = 'resident_invite_codes';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeUnitCode(value = '') {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

export function parseUnitCodes(value = '') {
  if (Array.isArray(value)) {
    return [...new Set(value.map(normalizeUnitCode).filter(Boolean))];
  }
  return [...new Set(
    String(value || '')
      .split(/
|,/)
      .map(normalizeUnitCode)
      .filter(Boolean)
  )];
}

export function normalizeInviteCode(value = '') {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
}

function randomCode(length = 5) {
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return output;
}

async function ensureUniqueInviteCode(length = 5) {
  if (!state.db) throw new Error('Firestore is not ready');
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomCode(length);
    const snap = await getDoc(doc(state.db, INVITE_COLLECTION, code));
    if (!snap.exists()) return code;
  }
  throw new Error('Unable to generate unique invite code');
}

function mapInviteSnapshot(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    ...data,
    code: data.code || snap.id,
    createdLabel: formatDate(data.createdAt),
    updatedLabel: formatDate(data.updatedAt),
    claimedLabel: formatDate(data.claimedAt),
    primaryUnitCode: normalizeUnitCode(data.primaryUnitCode || ''),
    additionalUnitCodes: parseUnitCodes(data.additionalUnitCodes || []),
  };
}

export async function createResidentInviteCode(payload = {}) {
  if (!state.db) throw new Error('Firestore is not ready');

  const primaryUnitCode = normalizeUnitCode(payload.primaryUnitCode || '');
  if (!primaryUnitCode) throw new Error('Primary room is required');

  const additionalUnitCodes = parseUnitCodes(payload.additionalUnitCodes || payload.additionalUnits || []);
  const code = normalizeInviteCode(payload.code) || await ensureUniqueInviteCode(5);
  const ref = doc(state.db, INVITE_COLLECTION, code);

  await setDoc(ref, {
    code,
    status: 'active',
    primaryUnitCode,
    additionalUnitCodes,
    usageLimit: 1,
    createdByUid: state.currentUser?.uid || '',
    createdByEmail: state.currentUser?.email || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    claimedAt: null,
    claimedByUid: '',
    claimedByEmail: '',
    claimedResidentId: '',
  }, { merge: false });

  const snap = await getDoc(ref);
  return mapInviteSnapshot(snap);
}

export async function loadResidentInviteCodes(options = {}) {
  if (!state.db) return [];
  const q = query(
    collection(state.db, INVITE_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(Number(options.limit || 20))
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapInviteSnapshot);
}

export async function getResidentInviteByCode(code = '') {
  if (!state.db) throw new Error('Firestore is not ready');
  const normalized = normalizeInviteCode(code);
  if (!normalized) throw new Error('Invite code is required');
  const snap = await getDoc(doc(state.db, INVITE_COLLECTION, normalized));
  if (!snap.exists()) return null;
  return mapInviteSnapshot(snap);
}
