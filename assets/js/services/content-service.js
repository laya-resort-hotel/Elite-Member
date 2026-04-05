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

export const CONTENT_LANGS = ['en', 'th', 'ru', 'zh'];
const CONTENT_STATUSES = ['draft', 'published', 'unpublished'];
const LANGUAGE_PRIORITY = ['en', 'th', 'ru', 'zh'];

function stringValue(value = '') {
  return String(value || '').trim();
}

function linesValue(value = '') {
  return stringValue(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function integerValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function toBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function blankTranslationEntry() {
  return {
    title: '',
    summary: '',
    fullDetails: '',
    terms: '',
    ctaLabel: '',
  };
}

function normalizeTranslationEntry(entry = {}, fallback = {}) {
  return {
    title: stringValue(entry.title || fallback.title),
    summary: stringValue(entry.summary || fallback.summary),
    fullDetails: stringValue(entry.fullDetails || fallback.fullDetails),
    terms: stringValue(entry.terms || fallback.terms),
    ctaLabel: stringValue(entry.ctaLabel || fallback.ctaLabel),
  };
}

function translationHasContent(entry = {}) {
  return ['title', 'summary', 'fullDetails', 'terms', 'ctaLabel'].some((field) => stringValue(entry[field]));
}

export function normalizeContentTranslations(value = {}, fallback = {}) {
  const translations = {};
  CONTENT_LANGS.forEach((lang) => {
    const source = value?.[lang] || {};
    const langFallback = lang === 'en'
      ? {
          title: fallback.title,
          summary: fallback.summary || fallback.body,
          fullDetails: fallback.fullDetails || (Array.isArray(fallback.details) ? fallback.details.join('\n') : fallback.details),
          terms: Array.isArray(fallback.terms) ? fallback.terms.join('\n') : fallback.terms,
          ctaLabel: fallback.ctaLabel,
        }
      : {
          title: fallback[`title_${lang}`],
          summary: fallback[`summary_${lang}`],
          fullDetails: fallback[`fullDetails_${lang}`],
          terms: fallback[`terms_${lang}`],
          ctaLabel: fallback[`ctaLabel_${lang}`],
        };
    translations[lang] = normalizeTranslationEntry(source, langFallback);
  });
  return translations;
}

function pickPreferredLanguage(lang = state.currentLanguage || 'en') {
  return [lang, ...LANGUAGE_PRIORITY.filter((code) => code !== lang)];
}

function pickFieldFromTranslations(translations = {}, field = 'title', lang = state.currentLanguage || 'en', fallback = '') {
  const preferred = pickPreferredLanguage(lang);
  for (const code of preferred) {
    const value = stringValue(translations?.[code]?.[field]);
    if (value) return value;
  }
  return stringValue(fallback);
}

function pickBestTranslation(translations = {}, lang = state.currentLanguage || 'en') {
  const preferred = pickPreferredLanguage(lang);
  for (const code of preferred) {
    const entry = normalizeTranslationEntry(translations?.[code] || {});
    if (translationHasContent(entry)) {
      return { lang: code, entry };
    }
  }
  return { lang: 'en', entry: blankTranslationEntry() };
}

export function getLocalizedContent(item = {}, lang = state.currentLanguage || 'en') {
  const translations = normalizeContentTranslations(item.translations || {}, item);
  const localizedTitle = pickFieldFromTranslations(translations, 'title', lang, item.title);
  const localizedSummary = pickFieldFromTranslations(translations, 'summary', lang, item.summary || item.body);
  const localizedFullDetails = pickFieldFromTranslations(
    translations,
    'fullDetails',
    lang,
    item.fullDetails || (Array.isArray(item.details) ? item.details.join('\n') : item.details)
  );
  const localizedTerms = pickFieldFromTranslations(
    translations,
    'terms',
    lang,
    Array.isArray(item.terms) ? item.terms.join('\n') : item.terms
  );
  const localizedCtaLabel = pickFieldFromTranslations(translations, 'ctaLabel', lang, item.ctaLabel || 'Learn more') || 'Learn more';
  const chosen = pickBestTranslation(translations, lang);

  return {
    ...item,
    translations,
    localizedLanguage: chosen.lang,
    title: localizedTitle,
    summary: localizedSummary,
    body: localizedSummary,
    fullDetails: localizedFullDetails,
    details: linesValue(localizedFullDetails),
    terms: linesValue(localizedTerms),
    termsText: localizedTerms,
    ctaLabel: localizedCtaLabel,
  };
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
  const translations = normalizeContentTranslations(payload.translations || {}, payload);
  const preferred = pickBestTranslation(translations, 'en').entry;
  const title = stringValue(payload.title || preferred.title);
  const summary = stringValue(payload.summary || preferred.summary);
  const fullDetails = stringValue(payload.fullDetails || preferred.fullDetails);
  const termsText = stringValue(payload.terms || preferred.terms);
  const ctaLabel = stringValue(payload.ctaLabel || preferred.ctaLabel) || 'Learn more';
  const pointsCost = Math.max(0, Number(payload.pointsCost || 0));
  const rewardCategory = stringValue(payload.rewardCategory || payload.category);
  const stockTotal = integerValue(payload.stockTotal || payload.stock || 0, 0);
  const rewardIsActive = toBoolean(payload.rewardIsActive, true);
  const rewardCodeExpiryDays = integerValue(payload.rewardCodeExpiryDays || payload.codeExpiryDays || 30, 30) || 30;

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
    translations,
    pointsCost,
    rewardCategory,
    category: rewardCategory,
    stockTotal,
    rewardIsActive,
    rewardCodeExpiryDays,
    codeExpiryDays: rewardCodeExpiryDays,
    redemptionMode: pointsCost > 0 ? 'points' : stringValue(payload.redemptionMode),
    benefitType: pointsCost > 0 ? 'reward' : stringValue(payload.benefitType),
    coverImageUrl: coverFields.coverImageUrl,
    coverImagePath: coverFields.coverImagePath,
    coverImageName: coverFields.coverImageName,
    galleryImages: coverFields.galleryImages,
    imageCount: coverFields.galleryImages.length,
  };
}

function buildRewardPersistenceFields(normalized = {}, existingData = null) {
  const rewardCategory = stringValue(normalized.rewardCategory || normalized.category || existingData?.rewardCategory || existingData?.category);
  const stockTotal = integerValue(normalized.stockTotal ?? existingData?.stockTotal ?? 0, 0);
  const rewardIsActive = toBoolean(normalized.rewardIsActive, existingData?.rewardIsActive !== false);
  const rewardCodeExpiryDays = integerValue(normalized.rewardCodeExpiryDays ?? normalized.codeExpiryDays ?? existingData?.rewardCodeExpiryDays ?? existingData?.codeExpiryDays ?? 30, 30) || 30;

  let stockRemaining = null;
  if (stockTotal > 0) {
    const previousTotal = integerValue(existingData?.stockTotal ?? 0, 0);
    const previousRemaining = existingData?.stockRemaining == null
      ? previousTotal
      : integerValue(existingData?.stockRemaining, previousTotal);
    const alreadyRedeemed = previousTotal > 0 ? Math.max(previousTotal - previousRemaining, 0) : 0;
    stockRemaining = existingData ? Math.max(stockTotal - alreadyRedeemed, 0) : stockTotal;
  }

  return {
    rewardCategory,
    category: rewardCategory,
    stockTotal,
    stockRemaining,
    rewardIsActive,
    rewardCodeExpiryDays,
    codeExpiryDays: rewardCodeExpiryDays,
  };
}

function resolveContentStatus(data = {}) {
  const rawStatus = stringValue(data.status).toLowerCase();
  if (CONTENT_STATUSES.includes(rawStatus)) return rawStatus;
  if (data.isPublished === true) return 'published';
  if (data.isPublished === false && (data.unpublishedAt || data.publishedAt)) return 'unpublished';
  return 'draft';
}

function toStatusLabel(status = 'draft') {
  switch (status) {
    case 'published':
      return 'Published';
    case 'unpublished':
      return 'Unpublished';
    default:
      return 'Draft';
  }
}

function enrichContentDocument(collectionName, snapOrData, id = '') {
  const data = typeof snapOrData?.data === 'function' ? snapOrData.data() : (snapOrData || {});
  const docId = id || snapOrData?.id || '';
  const status = resolveContentStatus(data);
  const publishedAt = data.publishedAt || null;
  const unpublishedAt = data.unpublishedAt || null;
  const translations = normalizeContentTranslations(data.translations || {}, data);
  const primary = pickBestTranslation(translations, 'en').entry;

  const stockTotal = integerValue(data.stockTotal ?? 0, 0);
  const stockRemaining = data.stockRemaining == null ? (stockTotal > 0 ? stockTotal : null) : integerValue(data.stockRemaining, stockTotal);
  const rewardIsActive = data.rewardIsActive !== false;

  return {
    id: docId,
    ...data,
    title: stringValue(data.title || primary.title),
    summary: stringValue(data.summary || data.body || primary.summary),
    body: stringValue(data.body || data.summary || primary.summary),
    fullDetails: stringValue(data.fullDetails || primary.fullDetails),
    details: Array.isArray(data.details) && data.details.length ? data.details : linesValue(data.fullDetails || primary.fullDetails),
    terms: Array.isArray(data.terms) && data.terms.length ? data.terms : linesValue(Array.isArray(data.terms) ? data.terms.join('\n') : (data.terms || primary.terms)),
    ctaLabel: stringValue(data.ctaLabel || primary.ctaLabel || 'Learn more') || 'Learn more',
    translations,
    status,
    statusLabel: toStatusLabel(status),
    isPublished: status === 'published',
    isActive: ['benefits', 'reward_catalog'].includes(collectionName) ? status === 'published' : Boolean(data.isActive),
    rewardCategory: stringValue(data.rewardCategory || data.category),
    category: stringValue(data.rewardCategory || data.category),
    stockTotal,
    stockRemaining,
    rewardIsActive,
    rewardCodeExpiryDays: integerValue(data.rewardCodeExpiryDays ?? data.codeExpiryDays ?? 30, 30) || 30,
    codeExpiryDays: integerValue(data.rewardCodeExpiryDays ?? data.codeExpiryDays ?? 30, 30) || 30,
    rewardAvailable: collectionName === 'reward_catalog'
      ? status === 'published' && rewardIsActive && (stockTotal === 0 || stockRemaining > 0)
      : true,
    createdLabel: formatDate(data.createdAt),
    updatedLabel: formatDate(data.updatedAt),
    publishedLabel: formatDate(publishedAt),
    unpublishedLabel: formatDate(unpublishedAt),
  };
}

function matchesLoadOptions(item, options = {}) {
  if (options.publishedOnly && item.status !== 'published') return false;
  if (Array.isArray(options.statuses) && options.statuses.length && !options.statuses.includes(item.status)) return false;
  if (options.excludeDrafts && item.status === 'draft') return false;
  return true;
}

function getStatusPersistenceFields(collectionName, status, existingData = null) {
  const nextStatus = CONTENT_STATUSES.includes(status) ? status : 'draft';
  return {
    status: nextStatus,
    isPublished: nextStatus === 'published',
    publishedAt: nextStatus === 'published'
      ? (existingData?.publishedAt || serverTimestamp())
      : (existingData?.publishedAt || null),
    unpublishedAt: nextStatus === 'unpublished'
      ? (existingData?.unpublishedAt || serverTimestamp())
      : (existingData?.unpublishedAt || null),
    ...(['benefits', 'reward_catalog'].includes(collectionName) ? { isActive: nextStatus === 'published' } : {}),
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
    translations: normalized.translations,
    coverImageUrl: normalized.coverImageUrl || '',
    coverImagePath: normalized.coverImagePath || '',
    coverImageName: normalized.coverImageName || '',
    galleryImages: Array.isArray(normalized.galleryImages) ? normalized.galleryImages : [],
    imageCount: Array.isArray(normalized.galleryImages) ? normalized.galleryImages.length : 0,
    ...(collectionName === 'reward_catalog' ? buildRewardPersistenceFields(normalized) : {}),
    ...getStatusPersistenceFields(collectionName, 'draft'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: author,
    updatedBy: author,
  };

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
    .map((d) => enrichContentDocument(name, d))
    .filter((row) => row.title || row.summary || row.coverImageUrl || row.imageCount || Object.values(row.translations || {}).some(translationHasContent))
    .filter((row) => matchesLoadOptions(row, options));
}

export async function loadDocumentById(collectionName, id, options = {}) {
  const ref = doc(state.db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const row = enrichContentDocument(collectionName, snap);
  if (!matchesLoadOptions(row, options)) return null;
  return row;
}

export async function saveStructuredCMS(collectionName, payload, options = {}) {
  const normalized = normalizeContentPayload(payload);
  const author = state.currentUser?.email || 'manual-admin';

  if (options.docId) {
    const ref = doc(state.db, collectionName, options.docId);
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;
    const existingStatus = resolveContentStatus(existingData || {});

    const nextData = {
      ...normalized,
      ...(collectionName === 'reward_catalog' ? buildRewardPersistenceFields(normalized, existingData) : {}),
      ...getStatusPersistenceFields(collectionName, existingStatus, existingData),
      updatedAt: serverTimestamp(),
      updatedBy: author,
      createdAt: existingData?.createdAt || serverTimestamp(),
      createdBy: existingData?.createdBy || author,
    };

    await setDoc(ref, nextData, { merge: true });
    return ref;
  }

  return addDoc(collection(state.db, collectionName), {
    ...normalized,
    ...(collectionName === 'reward_catalog' ? buildRewardPersistenceFields(normalized) : {}),
    ...getStatusPersistenceFields(collectionName, 'draft'),
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
    ...(collectionName === 'reward_catalog' ? buildRewardPersistenceFields(normalized, currentData) : {}),
    ...getStatusPersistenceFields(collectionName, resolveContentStatus(currentData || {}), currentData),
    updatedAt: serverTimestamp(),
    updatedBy: state.currentUser?.email || 'manual-admin',
  });
}

export async function publishCMSItem(collectionName, id) {
  const ref = doc(state.db, collectionName, id);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('Document not found');
  const currentData = current.data() || {};
  await updateDoc(ref, {
    ...getStatusPersistenceFields(collectionName, 'published', currentData),
    updatedAt: serverTimestamp(),
    updatedBy: state.currentUser?.email || 'manual-admin',
  });
}

export async function unpublishCMSItem(collectionName, id) {
  const ref = doc(state.db, collectionName, id);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('Document not found');
  const currentData = current.data() || {};
  await updateDoc(ref, {
    ...getStatusPersistenceFields(collectionName, 'unpublished', currentData),
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
