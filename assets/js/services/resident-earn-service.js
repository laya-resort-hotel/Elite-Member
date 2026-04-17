import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { state } from '../core/state.js';

export const POINT_RULE = Object.freeze({
  thbPerBlock: 1,
  pointsPerBlock: 1,
});

function ensureDb() {
  if (!state.db) throw new Error('Firebase is not ready');
}

function normalizeCode(value = '') {
  return String(value || '').trim();
}

function normalizeCodeUpper(value = '') {
  return normalizeCode(value).toUpperCase();
}

function unique(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function calculateResidentEarnPoints(amount = 0) {
  const spend = Math.max(0, Number(amount || 0));
  if (!Number.isFinite(spend) || spend <= 0) return 0;
  return Math.floor(spend / POINT_RULE.thbPerBlock) * POINT_RULE.pointsPerBlock;
}

export function formatPointFormula(amount = 0) {
  const points = calculateResidentEarnPoints(amount);
  return `${Math.max(0, Number(amount || 0)).toLocaleString('th-TH')} THB → ${points.toLocaleString('th-TH')} pts`;
}

function extractCodeCandidates(rawValue = '') {
  const raw = normalizeCode(rawValue);
  if (!raw) return [];

  const candidates = [raw, normalizeCodeUpper(raw)];

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      candidates.push(
        normalizeCode(parsed.qrCodeValue),
        normalizeCode(parsed.publicCardCode),
        normalizeCode(parsed.memberCode),
        normalizeCode(parsed.cardNumber),
        normalizeCode(parsed.residentId),
      );
    }
  } catch (_) {
    /* ignore */
  }

  try {
    const url = new URL(raw);
    candidates.push(
      normalizeCode(url.searchParams.get('code')),
      normalizeCode(url.searchParams.get('qr')),
      normalizeCode(url.searchParams.get('memberCode')),
      normalizeCode(url.searchParams.get('residentId')),
    );
    const hash = normalizeCode(url.hash.replace(/^#/, ''));
    if (hash) candidates.push(hash);
  } catch (_) {
    /* ignore */
  }

  const prefixed = raw.match(/(LAYA-[A-Z0-9-]+)/i)?.[1];
  if (prefixed) candidates.push(prefixed, normalizeCodeUpper(prefixed));

  return unique(candidates.map(normalizeCode));
}

async function queryResidentByField(field, value) {
  if (!value) return null;
  const snap = await getDocs(query(collection(state.db, 'residents'), where(field, '==', value), limit(1)));
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  return null;
}

async function lookupResidentFromCard(field, value) {
  if (!value) return null;
  const snap = await getDocs(query(collection(state.db, 'resident_cards'), where(field, '==', value), limit(1)));
  const cardDoc = snap.docs[0];
  if (!cardDoc) return null;
  const card = cardDoc.data() || {};
  const residentId = normalizeCode(card.residentId || cardDoc.id);
  if (!residentId) return null;
  const residentSnap = await getDoc(doc(state.db, 'residents', residentId));
  if (!residentSnap.exists()) return null;
  return { id: residentSnap.id, ...residentSnap.data() };
}

async function loadResidentWallet(residentId) {
  const walletSnap = await getDoc(doc(state.db, 'resident_wallets', residentId));
  return walletSnap.exists()
    ? { residentId, ...walletSnap.data() }
    : { residentId, currentPoints: 0, pendingPoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 };
}

function buildResidentSummary(resident = {}, wallet = {}) {
  return {
    id: resident.id,
    displayName: resident.displayName || [resident.firstName, resident.lastName].filter(Boolean).join(' ') || 'Resident Member',
    memberCode: resident.memberCode || '',
    qrCodeValue: resident.qrCodeValue || '',
    cardNumber: resident.cardNumber || '',
    primaryUnitCode: resident.primaryUnitCode || '',
    unitCodes: Array.isArray(resident.unitCodes) ? resident.unitCodes : [],
    loginEmail: resident.loginEmail || resident.email || '',
    status: resident.status || 'active',
    wallet,
    currentPoints: Number(wallet.currentPoints || 0),
    lifetimeEarned: Number(wallet.lifetimeEarned || 0),
    totalSpend: Number(resident.totalSpend || 0),
  };
}

export async function findResidentByScanValue(scanValue = '') {
  ensureDb();
  const candidates = extractCodeCandidates(scanValue);
  if (!candidates.length) throw new Error('Scan or enter a member QR code first');

  for (const candidate of candidates) {
    const upper = normalizeCodeUpper(candidate);
    const resident =
      await queryResidentByField('qrCodeValue', candidate)
      || await queryResidentByField('qrCodeValue', upper)
      || await queryResidentByField('memberCode', candidate)
      || await queryResidentByField('memberCode', upper)
      || await queryResidentByField('cardNumber', candidate)
      || await queryResidentByField('cardNumber', upper)
      || await lookupResidentFromCard('qrCodeValue', candidate)
      || await lookupResidentFromCard('qrCodeValue', upper)
      || await lookupResidentFromCard('memberCode', candidate)
      || await lookupResidentFromCard('memberCode', upper)
      || await lookupResidentFromCard('cardNumber', candidate)
      || await lookupResidentFromCard('cardNumber', upper);

    if (resident) {
      const wallet = await loadResidentWallet(resident.id);
      return buildResidentSummary(resident, wallet);
    }

    const directSnap = await getDoc(doc(state.db, 'residents', candidate)).catch(() => null);
    if (directSnap?.exists()) {
      const wallet = await loadResidentWallet(directSnap.id);
      return buildResidentSummary({ id: directSnap.id, ...directSnap.data() }, wallet);
    }
  }

  throw new Error('Resident not found from this QR / code');
}

export async function awardResidentSpendPoints(payload = {}) {
  ensureDb();
  const residentId = normalizeCode(payload.residentId);
  if (!residentId) throw new Error('Resident ID is required');

  const amount = Math.max(0, Number(payload.amount || 0));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be more than 0');

  const outlet = normalizeCode(payload.outlet);
  if (!outlet) throw new Error('Outlet is required');

  const referenceNo = normalizeCode(payload.referenceNo);
  const note = normalizeCode(payload.note);
  const scanValue = normalizeCode(payload.scanValue);
  const pointsEarned = calculateResidentEarnPoints(amount);

  const residentRef = doc(state.db, 'residents', residentId);
  const walletRef = doc(state.db, 'resident_wallets', residentId);
  const spendRef = doc(collection(state.db, 'resident_spend_transactions'));
  const pointTxRef = doc(collection(state.db, 'resident_point_transactions'));
  const activityLogRef = doc(state.db, 'resident_activity_logs', spendRef.id);

  const result = await runTransaction(state.db, async (transaction) => {
    const [residentSnap, walletSnap] = await Promise.all([
      transaction.get(residentRef),
      transaction.get(walletRef),
    ]);

    if (!residentSnap.exists()) throw new Error('Resident not found');
    const resident = { id: residentSnap.id, ...(residentSnap.data() || {}) };
    const wallet = walletSnap.exists()
      ? { residentId, ...(walletSnap.data() || {}) }
      : { residentId, currentPoints: 0, pendingPoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 };

    const currentPoints = Number(wallet.currentPoints || 0);
    const nextPoints = currentPoints + pointsEarned;
    const nextLifetimeEarned = Number(wallet.lifetimeEarned || 0) + pointsEarned;
    const nextTotalSpend = Number(resident.totalSpend || 0) + amount;

    transaction.set(spendRef, {
      residentId,
      residentName: resident.displayName || [resident.firstName, resident.lastName].filter(Boolean).join(' ') || 'Resident Member',
      memberCode: resident.memberCode || '',
      qrCodeValue: resident.qrCodeValue || scanValue || '',
      primaryUnitCode: resident.primaryUnitCode || '',
      spendAmount: amount,
      pointsEarned,
      outlet,
      referenceNo,
      note,
      formulaLabel: `${POINT_RULE.thbPerBlock} THB = ${POINT_RULE.pointsPerBlock} pts`,
      pointRule: {
        thbPerBlock: POINT_RULE.thbPerBlock,
        pointsPerBlock: POINT_RULE.pointsPerBlock,
      },
      createdAt: serverTimestamp(),
      createdByUid: state.currentUser?.uid || '',
      createdByEmail: state.currentUser?.email || '',
      createdByRole: state.currentRole || 'staff',
      status: 'completed',
    });

    transaction.set(residentRef, {
      totalSpend: nextTotalSpend,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (pointsEarned > 0) {
      transaction.set(pointTxRef, {
        residentId,
        memberCode: resident.memberCode || '',
        type: 'earn',
        pointsDelta: pointsEarned,
        balanceAfter: nextPoints,
        source: 'staff_qr_spend',
        outlet,
        spendAmount: amount,
        referenceNo,
        note,
        spendTransactionId: spendRef.id,
        createdByName: state.currentUser?.email || 'Staff',
        createdByUid: state.currentUser?.uid || '',
        createdAt: serverTimestamp(),
      });

      transaction.set(walletRef, {
        residentId,
        currentPoints: nextPoints,
        pendingPoints: Number(wallet.pendingPoints || 0),
        lifetimeEarned: nextLifetimeEarned,
        lifetimeRedeemed: Number(wallet.lifetimeRedeemed || 0),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else if (!walletSnap.exists()) {
      transaction.set(walletRef, {
        residentId,
        currentPoints: currentPoints,
        pendingPoints: Number(wallet.pendingPoints || 0),
        lifetimeEarned: Number(wallet.lifetimeEarned || 0),
        lifetimeRedeemed: Number(wallet.lifetimeRedeemed || 0),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    transaction.set(activityLogRef, {
      residentId,
      action: pointsEarned > 0 ? 'spend_points_earned' : 'spend_logged_zero_points',
      memberCode: resident.memberCode || '',
      spendAmount: amount,
      pointsDelta: pointsEarned,
      outlet,
      referenceNo,
      note,
      createdAt: serverTimestamp(),
      createdByUid: state.currentUser?.uid || '',
      createdByName: state.currentUser?.email || 'Staff',
    });

    return {
      resident: buildResidentSummary({
        ...resident,
        totalSpend: nextTotalSpend,
      }, {
        ...wallet,
        currentPoints: nextPoints,
        lifetimeEarned: nextLifetimeEarned,
      }),
      spend: {
        id: spendRef.id,
        amount,
        pointsEarned,
        outlet,
        referenceNo,
        note,
      },
    };
  });

  return result;
}

export async function loadRecentResidentSpendTransactions(limitCount = 20) {
  ensureDb();
  const safeLimit = Math.min(Math.max(Number(limitCount || 20), 1), 100);
  const snap = await getDocs(query(
    collection(state.db, 'resident_spend_transactions'),
    orderBy('createdAt', 'desc'),
    limit(safeLimit),
  ));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}
