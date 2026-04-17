import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { state } from '../core/state.js';
import { t, getLanguage } from '../core/i18n.js';
import { getLocalizedContent } from './content-service.js?v=20260405cms4b';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const DEFAULT_EXPIRY_DAYS = 30;

function authInstance() {
  if (state.auth) return state.auth;
  if (state.app) return getAuth(state.app);
  return null;
}

function getCurrentUser() {
  const authUser = state.currentUser || state.auth?.currentUser || authInstance()?.currentUser || null;
  if (authUser && !state.currentUser) state.currentUser = authUser;
  if (authUser && !state.auth) state.auth = authInstance();
  return authUser;
}

function currentResidentId() {
  return state.currentResident?.residentId || state.currentResident?.memberId || state.currentResident?.id || state.residentId || '';
}

function currentMemberCode() {
  return state.currentResident?.memberCode || state.currentResident?.publicCardCode || '';
}

function generateRedemptionCode(length = 8) {
  let output = 'RW';
  while (output.length < length) {
    output += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return output.slice(0, length);
}

function normalizeRedemptionSnapshot(id, data = {}) {
  const localized = getLocalizedContent({
    ...data,
    title: data.rewardTitle || data.title || '',
    summary: data.rewardSummary || data.summary || '',
    fullDetails: data.rewardFullDetails || data.fullDetails || '',
    terms: data.rewardTerms || data.terms || '',
    ctaLabel: data.rewardCtaLabel || data.ctaLabel || '',
    translations: data.rewardTranslationsSnapshot || data.translations || {},
  }, getLanguage());

  return {
    id,
    ...data,
    rewardTitle: String(localized.title || data.rewardTitle || data.title || t('redemption.rewardPlaceholder')).trim() || t('redemption.rewardPlaceholder'),
    rewardSummary: String(localized.summary || data.rewardSummary || '').trim(),
    rewardFullDetails: String(localized.fullDetails || data.rewardFullDetails || '').trim(),
    rewardTerms: Array.isArray(localized.terms) ? localized.terms : [],
    rewardCtaLabel: String(localized.ctaLabel || data.rewardCtaLabel || '').trim(),
    rewardTranslationsSnapshot: localized.translations || data.rewardTranslationsSnapshot || {},
    rewardImageUrl: String(data.rewardImageUrl || data.coverImageUrl || '').trim(),
    rewardCategory: String(data.rewardCategory || '').trim(),
    redemptionCode: String(data.redemptionCode || data.code || '').trim().toUpperCase(),
    pointsCost: Math.max(0, Number(data.pointsCost || 0)),
    status: String(data.status || 'issued').trim().toLowerCase(),
  };
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isExpiredRecord(record = {}) {
  const expiresAtMs = toMillis(record.expiresAt);
  return Boolean(expiresAtMs && expiresAtMs < Date.now() && String(record.status || '').toLowerCase() !== 'used');
}

export async function redeemReward(rewardId) {
  const currentUser = getCurrentUser();
  if (!state.firebaseReady || !state.db || !currentUser) {
    throw new Error(t('common.loginRequired'));
  }

  const residentId = currentResidentId();
  if (!residentId) throw new Error(t('redemption.profileNotLinked'));
  if (!rewardId) throw new Error(t('redemption.rewardIdRequired'));

  const rewardRef = doc(state.db, 'reward_catalog', rewardId);
  const walletRef = doc(state.db, 'resident_wallets', residentId);
  const redemptionRef = doc(collection(state.db, 'redemptions'));
  const residentRedemptionRef = doc(state.db, 'residents', residentId, 'redemptions', redemptionRef.id);
  const pointTxRef = doc(collection(state.db, 'resident_point_transactions'));

  const result = await runTransaction(state.db, async (transaction) => {
    const rewardSnap = await transaction.get(rewardRef);
    if (!rewardSnap.exists()) throw new Error(t('redemption.rewardNotFound'));
    const reward = rewardSnap.data() || {};

    const localizedReward = getLocalizedContent(reward, getLanguage());
    const pointsCost = Math.max(0, Number(reward.pointsCost || 0));
    if (!pointsCost) throw new Error(t('redemption.rewardNotConfigured'));
    if ((reward.status || 'draft') !== 'published') throw new Error(t('redemption.rewardNotPublished'));
    if (reward.rewardIsActive === false) throw new Error(t('redemption.rewardPaused'));

    const stockTotal = Math.max(0, Number(reward.stockTotal || 0));
    const currentStock = stockTotal > 0
      ? Math.max(0, Number(reward.stockRemaining ?? stockTotal))
      : null;

    if (stockTotal > 0 && currentStock <= 0) {
      throw new Error(t('redemption.outOfStock'));
    }

    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists()) throw new Error('Wallet not found');
    const wallet = walletSnap.data() || {};
    const currentPoints = Math.max(0, Number(wallet.currentPoints || 0));
    if (currentPoints < pointsCost) {
      throw new Error(t('redemption.notEnoughPoints'));
    }

    const nextBalance = currentPoints - pointsCost;
    const nextRedeemed = Math.max(0, Number(wallet.lifetimeRedeemed || 0)) + pointsCost;
    const nextStock = stockTotal > 0 ? currentStock - 1 : null;
    const title = String(localizedReward.title || reward.title || t('redemption.rewardPlaceholder')).trim() || t('redemption.rewardPlaceholder');
    const category = String(reward.rewardCategory || reward.category || '').trim();
    const imageUrl = String(reward.coverImageUrl || reward.galleryImages?.[0]?.url || '').trim();
    const redemptionCode = generateRedemptionCode(8);
    const expiryDays = Math.max(1, Number(reward.rewardCodeExpiryDays || reward.codeExpiryDays || DEFAULT_EXPIRY_DAYS));
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000));
    const basePayload = {
      residentId,
      memberId: residentId,
      rewardId,
      rewardTitle: title,
      rewardSummary: localizedReward.summary || '',
      rewardFullDetails: localizedReward.fullDetails || '',
      rewardTerms: Array.isArray(localizedReward.terms) ? localizedReward.terms : [],
      rewardCtaLabel: localizedReward.ctaLabel || '',
      rewardTranslationsSnapshot: localizedReward.translations || {},
      rewardCategory: category,
      rewardImageUrl: imageUrl,
      pointsCost,
      publicCardCode: state.currentResident?.publicCardCode || '',
      memberCode: currentMemberCode(),
      requestedByUid: currentUser.uid,
      requestedByEmail: currentUser.email || '',
      requestedByName: currentUser.displayName || state.currentResident?.displayName || state.currentResident?.fullName || t('common.residentMember'),
      status: 'issued',
      redemptionCode,
      codeStatus: 'active',
      source: 'resident_redemption',
      createdAt: serverTimestamp(),
      issuedAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      usedAt: null,
      usedByUid: '',
      usedByEmail: '',
      usedByName: '',
      usedOutlet: '',
      usedNote: '',
      expiresAt,
      rewardCodeExpiryDays: expiryDays,
    };

    transaction.set(redemptionRef, basePayload);
    transaction.set(residentRedemptionRef, {
      ...basePayload,
      redemptionId: redemptionRef.id,
    });

    transaction.set(pointTxRef, {
      residentId,
      memberCode: currentMemberCode(),
      type: 'redeem',
      pointsDelta: -pointsCost,
      balanceAfter: nextBalance,
      source: 'reward_redemption',
      sourceRefId: redemptionRef.id,
      rewardId,
      rewardTitle: title,
      redemptionCode,
      createdByUid: currentUser.uid,
      createdByName: currentUser.email || currentUser.displayName || t('common.residentMember'),
      createdAt: serverTimestamp(),
      note: `Redeemed reward: ${title}`,
    });

    transaction.set(walletRef, {
      residentId,
      currentPoints: nextBalance,
      pendingPoints: Math.max(0, Number(wallet.pendingPoints || 0)),
      lifetimeEarned: Math.max(0, Number(wallet.lifetimeEarned || 0)),
      lifetimeRedeemed: nextRedeemed,
      updatedAt: serverTimestamp(),
      lastRedemptionAt: serverTimestamp(),
    }, { merge: true });

    if (stockTotal > 0) {
      transaction.update(rewardRef, {
        stockRemaining: nextStock,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.email || currentUser.displayName || 'resident',
      });
    }

    return {
      redemptionId: redemptionRef.id,
      redemptionCode,
      balanceAfter: nextBalance,
      residentId,
      reward: {
        id: rewardId,
        title,
        pointsCost,
        rewardCategory: category,
        stockTotal,
        stockRemaining: nextStock,
        rewardIsActive: reward.rewardIsActive !== false,
      },
    };
  });

  if (state.currentResident) {
    state.currentResident.points = result.balanceAfter;
    state.currentResident.lifetimeRedeemed = Math.max(0, Number(state.currentResident.lifetimeRedeemed || 0)) + Math.max(0, Number(result.reward.pointsCost || 0));
    state.currentResident.wallet = {
      ...(state.currentResident.wallet || {}),
      currentPoints: result.balanceAfter,
      lifetimeRedeemed: Math.max(0, Number(state.currentResident.wallet?.lifetimeRedeemed || state.currentResident.lifetimeRedeemed || 0)),
    };
  }

  return result;
}

export async function loadResidentRedemptions(residentId = '') {
  const cleanResidentId = String(residentId || currentResidentId() || '').trim();
  if (!state.firebaseReady || !state.db || !cleanResidentId) return [];
  const snap = await getDocs(query(collection(state.db, 'residents', cleanResidentId, 'redemptions'), orderBy('createdAt', 'desc'), limit(100)));
  return snap.docs
    .map((row) => normalizeRedemptionSnapshot(row.id, row.data()))
    .sort((a, b) => {
      const aTime = Math.max(toMillis(a.createdAt), toMillis(a.issuedAt), toMillis(a.usedAt));
      const bTime = Math.max(toMillis(b.createdAt), toMillis(b.issuedAt), toMillis(b.usedAt));
      return bTime - aTime;
    });
}

export async function markRewardCodeUsedByStaff({ code = '', outlet = '', note = '' } = {}) {
  const currentUser = getCurrentUser();
  if (!state.firebaseReady || !state.db || !currentUser) {
    throw new Error(t('common.loginRequired'));
  }

  const redemptionCode = String(code || '').trim().toUpperCase();
  if (!redemptionCode) throw new Error(t('redemption.enterRewardCode'));

  const snap = await getDocs(query(collection(state.db, 'redemptions'), where('redemptionCode', '==', redemptionCode), limit(10)));
  if (snap.empty) throw new Error(t('redemption.rewardCodeNotFound'));

  const candidates = snap.docs.map((row) => ({ id: row.id, ref: row.ref, data: row.data() || {} }));
  const chosen = candidates.find((item) => String(item.data.status || '').toLowerCase() === 'issued') || candidates[0];
  const residentId = String(chosen.data.residentId || '').trim();
  if (!residentId) throw new Error(t('redemption.residentLinkNotFound'));

  const result = await runTransaction(state.db, async (transaction) => {
    const freshTopSnap = await transaction.get(chosen.ref);
    if (!freshTopSnap.exists()) throw new Error(t('redemption.rewardCodeNotFound'));
    const topData = freshTopSnap.data() || {};
    const status = String(topData.status || '').toLowerCase();
    if (status === 'used') throw new Error(t('redemption.codeAlreadyUsed'));
    if (status === 'expired') throw new Error(t('redemption.codeAlreadyExpired'));
    if (status !== 'issued') throw new Error(t('redemption.codeNotReady'));
    if (isExpiredRecord(topData)) throw new Error(t('redemption.codeExpired'));

    const residentMirrorRef = doc(state.db, 'residents', residentId, 'redemptions', chosen.id);
    const updatePayload = {
      status: 'used',
      codeStatus: 'used',
      usedAt: serverTimestamp(),
      usedByUid: currentUser.uid,
      usedByEmail: currentUser.email || '',
      usedByName: currentUser.displayName || currentUser.email || 'Staff',
      usedOutlet: String(outlet || '').trim(),
      usedNote: String(note || '').trim(),
      updatedAt: serverTimestamp(),
    };

    transaction.update(chosen.ref, updatePayload);
    transaction.update(residentMirrorRef, updatePayload);

    return {
      redemptionId: chosen.id,
      residentId,
      rewardTitle: String(topData.rewardTitle || t('redemption.rewardPlaceholder')).trim() || t('redemption.rewardPlaceholder'),
      redemptionCode,
      usedOutlet: updatePayload.usedOutlet,
    };
  });

  return result;
}

export function splitResidentRedemptions(rows = []) {
  const normalized = Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];
  const groups = { issued: [], used: [], expired: [] };
  normalized.forEach((row) => {
    const lowerStatus = String(row.status || '').toLowerCase();
    if (lowerStatus === 'used') {
      groups.used.push(row);
      return;
    }
    if (lowerStatus === 'expired' || isExpiredRecord(row)) {
      groups.expired.push({ ...row, status: 'expired' });
      return;
    }
    groups.issued.push(row);
  });
  return groups;
}
